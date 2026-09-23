/*
# Add 5th question option (answer_e)

1. Changes
- Adds `answer_e` column to `questions` table (text, defaults to empty string)
- Updates `questions.correct_answer` CHECK constraint to allow 'e'
- Updates `attempt_answers.correct_answer` CHECK constraint to allow 'e'
- Updates `attempt_answers.student_answer` CHECK constraint to allow 'e' (or NULL)
- Notifies PostgREST to reload schema cache

2. Notes
- No data is lost; existing rows keep their values.
- answer_e defaults to '' so existing questions with only 4 options are unaffected.
- This migration is safe to re-run (uses IF NOT EXISTS / IF EXISTS).
*/

ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_e text DEFAULT '';

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_correct_answer_check;
ALTER TABLE questions ADD CONSTRAINT questions_correct_answer_check CHECK (correct_answer IN ('a','b','c','d','e'));

ALTER TABLE attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_correct_answer_check;
ALTER TABLE attempt_answers DROP CONSTRAINT IF EXISTS attempt_answers_student_answer_check;
ALTER TABLE attempt_answers ADD CONSTRAINT attempt_answers_correct_answer_check CHECK (correct_answer IN ('a','b','c','d','e'));
ALTER TABLE attempt_answers ADD CONSTRAINT attempt_answers_student_answer_check CHECK (student_answer IS NULL OR student_answer IN ('a','b','c','d','e'));

NOTIFY pgrst, 'reload schema';
