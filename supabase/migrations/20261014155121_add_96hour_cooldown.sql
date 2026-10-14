/*
# 96-Hour Cooldown for Quiz Points

1. New Column
- `quiz_attempts.points_awarded` (boolean, default true) — tracks whether this attempt actually granted points to the student's balance. false means the attempt was recorded but points were suppressed due to cooldown.

2. Updated Function: submit_quiz_attempt
- Before awarding points, checks whether a prior attempt for the same (student_id, quiz_id) exists where points_awarded = true AND created_at > now() - interval '96 hours'.
- If such a record exists (within cooldown): the attempt is still recorded with full score/percentage/correct/wrong stats, but earned_points and timed_bonus_points are set to 0, points_awarded is set to false, and the student's total_points is NOT increased.
- If no such record exists (cooldown expired or first attempt): points are calculated and awarded normally, points_awarded is set to true, and total_points is updated.
- Each quiz is independent — the check is scoped to the same quiz_id only.
- Student's total_completed_quizzes, total_attempts, total_time_spent_seconds, highest_score, and last_active_at are always updated regardless of cooldown (these track activity, not points).

3. Notes
- The score and percentage fields in quiz_attempts always reflect the student's actual performance.
- The returned JSON includes a new `points_awarded` boolean and a `cooldown_active` boolean so the edge function / frontend can inform the user.
- Safe to re-run (idempotent column addition, CREATE OR REPLACE function).
*/

ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS points_awarded boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION submit_quiz_attempt(
  p_student_id uuid,
  p_quiz_id uuid,
  p_mode text,
  p_answers jsonb,
  p_completion_time_seconds int
) RETURNS jsonb AS $$
DECLARE
  v_quiz RECORD;
  v_question RECORD;
  v_correct_count int := 0;
  v_wrong_count int := 0;
  v_total_questions int := 0;
  v_earned_points numeric := 0;
  v_bonus numeric := 0;
  v_percentage numeric := 0;
  v_attempt_id uuid;
  v_answer jsonb;
  v_is_correct boolean;
  v_time_spent int;
  v_max_score numeric;
  v_is_100 boolean := false;
  v_ans_char char(1);
  v_cooldown_active boolean := false;
  v_points_to_award numeric := 0;
  v_bonus_to_award numeric := 0;
  v_points_awarded boolean := true;
BEGIN
  -- Fetch quiz
  SELECT * INTO v_quiz FROM quizzes WHERE id = p_quiz_id AND is_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found or disabled');
  END IF;

  -- Validate mode
  IF p_mode = 'timed' AND v_quiz.timed_mode_enabled = false THEN
    RETURN jsonb_build_object('error', 'Timed mode not enabled for this quiz');
  END IF;
  IF p_mode = 'untimed' AND v_quiz.untimed_mode_enabled = false THEN
    RETURN jsonb_build_object('error', 'Untimed mode not enabled for this quiz');
  END IF;

  -- Count enabled questions
  SELECT count(*) INTO v_total_questions FROM questions WHERE quiz_id = p_quiz_id AND is_enabled = true;
  IF v_total_questions = 0 THEN
    RETURN jsonb_build_object('error', 'No questions in quiz');
  END IF;

  -- Calculate score
  FOR v_question IN SELECT * FROM questions WHERE quiz_id = p_quiz_id AND is_enabled = true ORDER BY sort_order
  LOOP
    v_answer := p_answers -> v_question.id::text;
    v_ans_char := NULL;
    IF v_answer IS NOT NULL AND v_answer ->> 'answer' IS NOT NULL AND (v_answer ->> 'answer') != '' THEN
      v_ans_char := (v_answer ->> 'answer')::char;
    END IF;
    v_time_spent := COALESCE((v_answer ->> 'time_spent')::int, 0);
    
    IF v_ans_char IS NOT NULL AND v_ans_char = v_question.correct_answer THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  v_wrong_count := v_total_questions - v_correct_count;
  v_percentage := ROUND((v_correct_count::numeric / v_total_questions::numeric) * 100, 2);
  v_earned_points := ROUND((v_correct_count::numeric / v_total_questions::numeric) * v_quiz.max_points, 2);
  
  IF p_mode = 'timed' THEN
    v_bonus := v_quiz.timed_bonus_points;
  ELSE
    v_bonus := 0;
  END IF;

  v_max_score := v_quiz.max_points + v_bonus;
  v_is_100 := (v_correct_count = v_total_questions);

  -- ── 96-hour cooldown check ──────────────────────────
  -- Check if a prior attempt for this student+quiz awarded points within the last 96 hours
  PERFORM 1
    FROM quiz_attempts
   WHERE student_id = p_student_id
     AND quiz_id = p_quiz_id
     AND points_awarded = true
     AND created_at > now() - interval '96 hours'
   LIMIT 1;

  IF FOUND THEN
    -- Within cooldown: record the attempt but suppress points
    v_cooldown_active := true;
    v_points_to_award := 0;
    v_bonus_to_award := 0;
    v_points_awarded := false;
  ELSE
    -- Cooldown expired or first time: award points normally
    v_cooldown_active := false;
    v_points_to_award := v_earned_points;
    v_bonus_to_award := v_bonus;
    v_points_awarded := true;
  END IF;

  -- Create attempt record (score/percentage always reflect actual performance; earned_points reflects what was actually granted)
  INSERT INTO quiz_attempts (
    student_id, quiz_id, mode, score, max_score, percentage,
    correct_answers, wrong_answers, total_questions,
    completion_time_seconds, earned_points, timed_bonus_points,
    status, is_100_percent, points_awarded
  ) VALUES (
    p_student_id, p_quiz_id, p_mode, v_points_to_award + v_bonus_to_award, v_max_score,
    v_percentage, v_correct_count, v_wrong_count, v_total_questions,
    p_completion_time_seconds, v_points_to_award, v_bonus_to_award,
    'completed', v_is_100, v_points_awarded
  ) RETURNING id INTO v_attempt_id;

  -- Insert attempt answers
  FOR v_question IN SELECT * FROM questions WHERE quiz_id = p_quiz_id AND is_enabled = true ORDER BY sort_order
  LOOP
    v_answer := p_answers -> v_question.id::text;
    v_ans_char := NULL;
    IF v_answer IS NOT NULL AND v_answer ->> 'answer' IS NOT NULL AND (v_answer ->> 'answer') != '' THEN
      v_ans_char := (v_answer ->> 'answer')::char;
    END IF;
    v_time_spent := COALESCE((v_answer ->> 'time_spent')::int, 0);
    v_is_correct := (v_ans_char IS NOT NULL AND v_ans_char = v_question.correct_answer);

    INSERT INTO attempt_answers (attempt_id, question_id, student_answer, correct_answer, is_correct, time_spent_seconds, sort_order)
    VALUES (v_attempt_id, v_question.id, v_ans_char, v_question.correct_answer, v_is_correct, v_time_spent, v_question.sort_order);
  END LOOP;

  -- Update student stats
  -- total_points only increases when points were actually awarded (not in cooldown)
  -- total_completed_quizzes, total_attempts, highest_score, and total_time_spent always update (activity tracking)
  UPDATE students SET
    total_points = total_points + v_points_to_award + v_bonus_to_award,
    total_completed_quizzes = total_completed_quizzes + 1,
    total_attempts = total_attempts + 1,
    highest_score = GREATEST(highest_score, v_points_to_award + v_bonus_to_award),
    total_time_spent_seconds = total_time_spent_seconds + p_completion_time_seconds,
    last_active_at = now()
  WHERE id = p_student_id;

  -- Evaluate achievements
  PERFORM evaluate_achievements_for_student(p_student_id);

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'correct_answers', v_correct_count,
    'wrong_answers', v_wrong_count,
    'total_questions', v_total_questions,
    'percentage', v_percentage,
    'earned_points', v_points_to_award,
    'timed_bonus_points', v_bonus_to_award,
    'total_score', v_points_to_award + v_bonus_to_award,
    'max_score', v_max_score,
    'is_100_percent', v_is_100,
    'completion_time_seconds', p_completion_time_seconds,
    'points_awarded', v_points_awarded,
    'cooldown_active', v_cooldown_active
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-restrict execution to service role only (CREATE OR REPLACE resets privileges)
REVOKE EXECUTE ON FUNCTION submit_quiz_attempt(uuid, uuid, text, jsonb, int) FROM PUBLIC, anon, authenticated;
