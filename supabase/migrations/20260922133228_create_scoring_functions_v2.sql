/*
# Server-side functions: scoring, achievement evaluation, admin session validation

1. submit_quiz_attempt(p_student_id, p_quiz_id, p_mode, p_answers, p_completion_time_seconds)
   - Validates the attempt server-side
   - Creates the attempt record first, then iterates questions
   - Computes correct/wrong counts
   - Calculates proportional earned_points = (correct/total) * max_points
   - Adds timed_bonus_points if mode='timed'
   - Inserts attempt_answers rows
   - Updates student aggregate stats
   - Evaluates and awards achievements
   - Returns the attempt record
   SECURITY DEFINER

2. evaluate_achievements_for_student(p_student_id)
   - Checks all enabled achievements against student stats
   - Awards missing achievements
   - SECURITY DEFINER

3. admin_validate_session(p_token)
   - Checks if a session token is valid and not expired
   - SECURITY DEFINER

4. admin_cleanup_sessions()
   - Deletes expired sessions
*/

-- Drop the broken version
DROP FUNCTION IF EXISTS submit_quiz_attempt(uuid, uuid, text, jsonb, int);

-- ============================================================
-- submit_quiz_attempt (corrected)
-- ============================================================
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

  -- Calculate score first
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

  -- Create attempt record
  INSERT INTO quiz_attempts (
    student_id, quiz_id, mode, score, max_score, percentage,
    correct_answers, wrong_answers, total_questions,
    completion_time_seconds, earned_points, timed_bonus_points,
    status, is_100_percent
  ) VALUES (
    p_student_id, p_quiz_id, p_mode, v_earned_points + v_bonus, v_max_score,
    v_percentage, v_correct_count, v_wrong_count, v_total_questions,
    p_completion_time_seconds, v_earned_points, v_bonus,
    'completed', v_is_100
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
  UPDATE students SET
    total_points = total_points + v_earned_points + v_bonus,
    total_completed_quizzes = total_completed_quizzes + 1,
    total_attempts = total_attempts + 1,
    highest_score = GREATEST(highest_score, v_earned_points + v_bonus),
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
    'earned_points', v_earned_points,
    'timed_bonus_points', v_bonus,
    'total_score', v_earned_points + v_bonus,
    'max_score', v_max_score,
    'is_100_percent', v_is_100,
    'completion_time_seconds', p_completion_time_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- evaluate_achievements_for_student
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_achievements_for_student(p_student_id uuid)
RETURNS void AS $$
DECLARE
  v_ach RECORD;
  v_student RECORD;
  v_should_award boolean;
  v_cond_value jsonb;
  v_attempt_count int;
  v_best_percentage numeric;
  v_best_time int;
  v_quiz_count int;
BEGIN
  SELECT * INTO v_student FROM students WHERE id = p_student_id;
  IF NOT FOUND THEN RETURN; END IF;

  FOR v_ach IN SELECT * FROM achievements WHERE is_enabled = true
  LOOP
    -- Skip if already awarded
    PERFORM 1 FROM student_achievements WHERE student_id = p_student_id AND achievement_id = v_ach.id;
    IF FOUND THEN CONTINUE; END IF;

    v_should_award := false;
    v_cond_value := v_ach.condition_value;

    CASE v_ach.condition_type
      WHEN 'total_points' THEN
        v_should_award := v_student.total_points >= (v_cond_value ->> 'value')::numeric;

      WHEN 'total_percentage' THEN
        -- Check if any attempt achieved >= threshold percentage
        SELECT COALESCE(MAX(percentage), 0) INTO v_best_percentage
        FROM quiz_attempts WHERE student_id = p_student_id;
        v_should_award := v_best_percentage >= (v_cond_value ->> 'value')::numeric;

      WHEN 'quiz_100_percent' THEN
        v_should_award := EXISTS (
          SELECT 1 FROM quiz_attempts WHERE student_id = p_student_id AND is_100_percent = true
        );

      WHEN 'completed_quizzes_count' THEN
        v_should_award := v_student.total_completed_quizzes >= (v_cond_value ->> 'value')::int;

      WHEN 'completed_specific_quiz' THEN
        v_should_award := EXISTS (
          SELECT 1 FROM quiz_attempts 
          WHERE student_id = p_student_id 
          AND quiz_id = (v_cond_value ->> 'quiz_id')::uuid
        );

      WHEN 'completion_time_within' THEN
        -- Complete any quiz within X seconds
        SELECT COALESCE(MIN(completion_time_seconds), 999999) INTO v_best_time
        FROM quiz_attempts WHERE student_id = p_student_id;
        v_should_award := v_best_time <= (v_cond_value ->> 'value')::int;

      WHEN 'timed_mode_count' THEN
        SELECT count(*) INTO v_attempt_count
        FROM quiz_attempts WHERE student_id = p_student_id AND mode = 'timed';
        v_should_award := v_attempt_count >= (v_cond_value ->> 'value')::int;

      WHEN 'highest_score' THEN
        v_should_award := v_student.highest_score >= (v_cond_value ->> 'value')::numeric;

      ELSE
        v_should_award := false;
    END CASE;

    IF v_should_award THEN
      INSERT INTO student_achievements (student_id, achievement_id)
      VALUES (p_student_id, v_ach.id)
      ON CONFLICT (student_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- admin_validate_session
-- ============================================================
CREATE OR REPLACE FUNCTION admin_validate_session(p_token text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_sessions 
    WHERE token = p_token 
    AND expires_at > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- admin_cleanup_sessions
-- ============================================================
CREATE OR REPLACE FUNCTION admin_cleanup_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on admin functions to service_role only (anon cannot call)
-- By default SECURITY DEFINER functions are executable by PUBLIC if the owner grants EXECUTE
-- We'll restrict admin_validate_session and admin_cleanup_sessions
REVOKE EXECUTE ON FUNCTION admin_validate_session(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_cleanup_sessions() FROM PUBLIC, anon, authenticated;

-- submit_quiz_attempt and evaluate_achievements_for_student are called by the edge function
-- using service role, so we restrict them too
REVOKE EXECUTE ON FUNCTION submit_quiz_attempt(uuid, uuid, text, jsonb, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION evaluate_achievements_for_student(uuid) FROM PUBLIC, anon, authenticated;
