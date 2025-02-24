-- Add missing policies for questions table
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Allow course owners to insert questions" ON questions;
  DROP POLICY IF EXISTS "Allow course owners to update questions" ON questions;
  DROP POLICY IF EXISTS "Allow course owners to delete questions" ON questions;
END $$;

-- Create policies
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
