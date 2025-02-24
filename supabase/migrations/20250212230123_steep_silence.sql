-- Add policies for submissions table
DROP POLICY IF EXISTS "Allow course owners to read submissions" ON submissions;
DROP POLICY IF EXISTS "Allow course owners to insert submissions" ON submissions;

CREATE POLICY "Allow course owners to read submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = submissions.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to insert submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add policies for students table to allow inserting submissions
DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to update students" ON students;

CREATE POLICY "Allow authenticated users to insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add missing policies for questions
DROP POLICY IF EXISTS "Allow course owners to insert questions" ON questions;

CREATE POLICY "Allow course owners to insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND courses.user_id = auth.uid()
    )
  );
