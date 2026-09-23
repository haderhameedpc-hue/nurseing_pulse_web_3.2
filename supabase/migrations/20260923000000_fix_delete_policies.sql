-- السماح بالحذف والتعديل المباشر على جدول الطلاب
DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_delete" ON students FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "students_update" ON students;
CREATE POLICY "students_update" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- السماح بحذف إجابات المحاولات والمحاولات وسجلات الأسماء والأوسمة
DROP POLICY IF EXISTS "attempt_answers_delete" ON attempt_answers;
CREATE POLICY "attempt_answers_delete" ON attempt_answers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quiz_attempts_delete" ON quiz_attempts;
CREATE POLICY "quiz_attempts_delete" ON quiz_attempts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "name_change_delete" ON name_change_history;
CREATE POLICY "name_change_delete" ON name_change_history FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "student_achievements_delete" ON student_achievements;
CREATE POLICY "student_achievements_delete" ON student_achievements FOR DELETE TO anon, authenticated USING (true);