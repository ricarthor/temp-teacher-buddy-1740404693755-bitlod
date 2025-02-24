/*
  # Add RLS Policies for All Tables

  1. Security
    - Add RLS policies for all tables
    - Ensure course owners can manage their courses and related data
    - Allow students to access their own data
    - Protect sensitive information

  2. Changes
    - Add policies for students table
    - Add policies for course_students table
    - Add policies for quizzes table
    - Add policies for questions table
    - Add policies for submissions table
    - Add policies for feedback table
    - Add policies for flags table
*/

-- Policies for students table
CREATE POLICY "Allow course owners to read students in their courses"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_students cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.student_id = students.id
      AND c.user_id = auth.uid()
    )
  );

-- Policies for course_students table
CREATE POLICY "Allow course owners to read course_students"
  ON course_students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_students.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Policies for quizzes table
CREATE POLICY "Allow course owners to read quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to insert quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to update quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to delete quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Policies for questions table
CREATE POLICY "Allow course owners to read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = questions.quiz_id
      AND courses.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Allow course owners to update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND courses.user_id = auth.uid()
    )
  );

-- Policies for submissions table
CREATE POLICY "Allow course owners to read submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Policies for feedback table
CREATE POLICY "Allow course owners to read feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Policies for flags table
CREATE POLICY "Allow course owners to read flags"
  ON flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to insert flags"
  ON flags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to update flags"
  ON flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to delete flags"
  ON flags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );
