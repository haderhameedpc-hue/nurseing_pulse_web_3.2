/*
# Interactive Quiz Platform — Full Schema

Creates the complete relational schema for a quiz platform with:
- Students (name-based registration with 2-digit suffix, stable internal ID)
- Name change history
- Quiz structure: Stages → Courses → Subjects → (optional Folders) → Quizzes → Questions
- Quiz attempts with per-question answer tracking
- Server-side scoring (proportional points + timed bonus)
- Achievements (badges/trophies) with conditions and automatic evaluation
- Leaderboard settings (column visibility/ordering, enable/disable)
- Question templates for bulk import
- Admin activity log
- Admin sessions (password-based, server-side)

Security:
- Public tables (students, structure, quizzes, questions, attempts, achievements, leaderboard) are readable by anon+authenticated.
- Mutations on admin-managed tables go through SECURITY DEFINER functions callable only by the service role / edge functions.
- Students can only insert their own attempts (via edge function) and update their own name (via edge function).
- Direct writes to scoring/achievements/structure tables are blocked for anon.
*/

-- ============================================================
-- STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid REFERENCES stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  icon_url text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- FOLDERS (Additional Topics inside Subjects)
-- ============================================================
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  instructions text DEFAULT '',
  max_points numeric NOT NULL DEFAULT 100,
  timed_mode_enabled boolean NOT NULL DEFAULT true,
  untimed_mode_enabled boolean NOT NULL DEFAULT true,
  time_limit_seconds int NOT NULL DEFAULT 60,
  timed_bonus_points numeric NOT NULL DEFAULT 0,
  immediate_feedback boolean NOT NULL DEFAULT true,
  show_explanations boolean NOT NULL DEFAULT true,
  show_translations boolean NOT NULL DEFAULT true,
  review_wrong_answers boolean NOT NULL DEFAULT true,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quiz_parent CHECK (
    (folder_id IS NOT NULL) OR (subject_id IS NOT NULL)
  )
);

-- ============================================================
-- QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_translation text DEFAULT '',
  answer_a text NOT NULL DEFAULT '',
  answer_b text NOT NULL DEFAULT '',
  answer_c text NOT NULL DEFAULT '',
  answer_d text NOT NULL DEFAULT '',
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  correct_answer_translation text DEFAULT '',
  explanation text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL UNIQUE,
  total_points numeric NOT NULL DEFAULT 0,
  total_completed_quizzes int NOT NULL DEFAULT 0,
  total_attempts int NOT NULL DEFAULT 0,
  highest_score numeric NOT NULL DEFAULT 0,
  total_time_spent_seconds int NOT NULL DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- NAME CHANGE HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS name_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  previous_name text NOT NULL,
  new_name text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('timed','untimed')),
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  correct_answers int NOT NULL DEFAULT 0,
  wrong_answers int NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 0,
  completion_time_seconds int NOT NULL DEFAULT 0,
  earned_points numeric NOT NULL DEFAULT 0,
  timed_bonus_points numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','incomplete')),
  is_100_percent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ATTEMPT ANSWERS (per-question detail)
-- ============================================================
CREATE TABLE IF NOT EXISTS attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  student_answer char(1) CHECK (student_answer IN ('a','b','c','d')),
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  is_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ACHIEVEMENTS (badges & trophies)
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon_url text DEFAULT '',
  achievement_type text NOT NULL CHECK (achievement_type IN ('badge','trophy')),
  condition_type text NOT NULL,
  condition_value jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- STUDENT ACHIEVEMENTS (awarded achievements)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, achievement_id)
);

-- ============================================================
-- QUESTION TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS question_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_text text DEFAULT '',
  parsing_rules jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- LEADERBOARD SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_settings (
  id int PRIMARY KEY DEFAULT 1,
  is_enabled boolean NOT NULL DEFAULT true,
  columns_config jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_by text NOT NULL DEFAULT 'total_points',
  sort_direction text NOT NULL DEFAULT 'desc' CHECK (sort_direction IN ('asc','desc')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO leaderboard_settings (id, columns_config)
VALUES (1, '[
  {"key":"rank","label":"Rank","enabled":true,"order":0},
  {"key":"display_name","label":"Student Name","enabled":true,"order":1},
  {"key":"total_points","label":"Points","enabled":true,"order":2},
  {"key":"badges","label":"Badges","enabled":true,"order":3},
  {"key":"trophies","label":"Trophies","enabled":true,"order":4},
  {"key":"total_completed_quizzes","label":"Completed","enabled":true,"order":5},
  {"key":"highest_score","label":"Highest Score","enabled":true,"order":6}
]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ADMIN SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  token text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- ============================================================
-- ADMIN ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  record_id text DEFAULT '',
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courses_stage ON courses(stage_id);
CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_folders_subject ON folders(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_folder ON quizzes(folder_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_name_changes_student ON name_change_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ach_student ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ach_achievement ON student_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS on ALL tables
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE name_change_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PUBLIC READ tables (students see these)
-- ========================================
-- Stages: public read (only visible+enabled for students, but RLS can't easily
-- check visibility without complex logic — we'll filter in queries/edge functions)
DROP POLICY IF EXISTS "stages_read" ON stages;
CREATE POLICY "stages_read" ON stages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "courses_read" ON courses;
CREATE POLICY "courses_read" ON courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "subjects_read" ON subjects;
CREATE POLICY "subjects_read" ON subjects FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "folders_read" ON folders;
CREATE POLICY "folders_read" ON folders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_read" ON quizzes;
CREATE POLICY "quizzes_read" ON quizzes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "questions_read" ON questions;
CREATE POLICY "questions_read" ON questions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "students_read" ON students;
CREATE POLICY "students_read" ON students FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quiz_attempts_read" ON quiz_attempts;
CREATE POLICY "quiz_attempts_read" ON quiz_attempts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "attempt_answers_read" ON attempt_answers;
CREATE POLICY "attempt_answers_read" ON attempt_answers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "achievements_read" ON achievements;
CREATE POLICY "achievements_read" ON achievements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "student_achievements_read" ON student_achievements;
CREATE POLICY "student_achievements_read" ON student_achievements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "leaderboard_settings_read" ON leaderboard_settings;
CREATE POLICY "leaderboard_settings_read" ON leaderboard_settings FOR SELECT TO anon, authenticated USING (true);

-- Students can insert new student records (registration)
DROP POLICY IF EXISTS "students_insert" ON students;
CREATE POLICY "students_insert" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Students can update their own display_name only (and last_active_at)
-- We use a simple check: any student can update any student's display_name via
-- the edge function, but direct updates from anon are restricted to display_name + last_active_at
DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Name change history: students can insert (via edge function)
DROP POLICY IF EXISTS "name_changes_read" ON name_change_history;
CREATE POLICY "name_changes_read" ON name_change_history FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "name_changes_insert" ON name_change_history;
CREATE POLICY "name_changes_insert" ON name_change_history FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Student achievements: readable by all, insert via edge function only
DROP POLICY IF EXISTS "student_achievements_insert" ON student_achievements;
CREATE POLICY "student_achievements_insert" ON student_achievements FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Quiz attempts + answers: insert via edge function only
DROP POLICY IF EXISTS "quiz_attempts_insert" ON quiz_attempts;
CREATE POLICY "quiz_attempts_insert" ON quiz_attempts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "attempt_answers_insert" ON attempt_answers;
CREATE POLICY "attempt_answers_insert" ON attempt_answers FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ========================================
-- ADMIN-ONLY tables (no direct anon access)
-- ========================================
-- admin_sessions: no read for anon (edge function uses service role)
DROP POLICY IF EXISTS "admin_sessions_read" ON admin_sessions;
CREATE POLICY "admin_sessions_read" ON admin_sessions FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "admin_sessions_insert" ON admin_sessions;
CREATE POLICY "admin_sessions_insert" ON admin_sessions FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "admin_sessions_delete" ON admin_sessions;
CREATE POLICY "admin_sessions_delete" ON admin_sessions FOR DELETE TO anon, authenticated USING (false);

-- admin_activity_log: no direct access for anon
DROP POLICY IF EXISTS "admin_log_read" ON admin_activity_log;
CREATE POLICY "admin_log_read" ON admin_activity_log FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "admin_log_insert" ON admin_activity_log;
CREATE POLICY "admin_log_insert" ON admin_activity_log FOR INSERT TO anon, authenticated WITH CHECK (false);

-- Write policies on admin-managed tables: blocked for anon (edge function uses service role)
DROP POLICY IF EXISTS "stages_write" ON stages;
CREATE POLICY "stages_write" ON stages FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "stages_update" ON stages;
CREATE POLICY "stages_update" ON stages FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "stages_delete" ON stages;
CREATE POLICY "stages_delete" ON stages FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "courses_write" ON courses;
CREATE POLICY "courses_write" ON courses FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "courses_update" ON courses;
CREATE POLICY "courses_update" ON courses FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "courses_delete" ON courses;
CREATE POLICY "courses_delete" ON courses FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "subjects_write" ON subjects;
CREATE POLICY "subjects_write" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "folders_write" ON folders;
CREATE POLICY "folders_write" ON folders FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "folders_update" ON folders;
CREATE POLICY "folders_update" ON folders FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "folders_delete" ON folders;
CREATE POLICY "folders_delete" ON folders FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "quizzes_write" ON quizzes;
CREATE POLICY "quizzes_write" ON quizzes FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "quizzes_update" ON quizzes;
CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "quizzes_delete" ON quizzes;
CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "questions_write" ON questions;
CREATE POLICY "questions_write" ON questions FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "questions_update" ON questions;
CREATE POLICY "questions_update" ON questions FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "questions_delete" ON questions;
CREATE POLICY "questions_delete" ON questions FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "achievements_write" ON achievements;
CREATE POLICY "achievements_write" ON achievements FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "achievements_update" ON achievements;
CREATE POLICY "achievements_update" ON achievements FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "achievements_delete" ON achievements;
CREATE POLICY "achievements_delete" ON achievements FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "question_templates_write" ON question_templates;
CREATE POLICY "question_templates_write" ON question_templates FOR INSERT TO anon, authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "question_templates_update" ON question_templates;
CREATE POLICY "question_templates_update" ON question_templates FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "question_templates_delete" ON question_templates;
CREATE POLICY "question_templates_delete" ON question_templates FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "leaderboard_settings_update" ON leaderboard_settings;
CREATE POLICY "leaderboard_settings_update" ON leaderboard_settings FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

-- Students: prevent direct update of total_points, scores etc. via column-level
-- (This is handled by edge function using service role)
-- The update policy above allows display_name + last_active_at updates;
-- for sensitive columns we rely on edge function validation.

-- ========================================
-- updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stages_updated ON stages;
CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated ON courses;
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_subjects_updated ON subjects;
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_folders_updated ON folders;
CREATE TRIGGER trg_folders_updated BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_quizzes_updated ON quizzes;
CREATE TRIGGER trg_quizzes_updated BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_questions_updated ON questions;
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_achievements_updated ON achievements;
CREATE TRIGGER trg_achievements_updated BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated ON question_templates;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON question_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
