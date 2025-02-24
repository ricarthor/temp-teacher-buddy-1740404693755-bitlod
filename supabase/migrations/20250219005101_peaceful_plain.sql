/*
  # Add Quiz RLS Policies

  1. Policies
    - Add policies for quiz access control
    - Link quiz access to course ownership
    - Allow quiz creation for course owners
  
  2. Changes
    - Drop existing policies
    - Create new policies based on course ownership
*/

-- Drop existing quiz policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow course owners to read quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Allow course owners to insert quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Allow course owners to update quizzes" ON quizzes;
  DROP POLICY IF EXISTS "Allow course owners to delete quizzes" ON quizzes;
END $$;

-- Create new quiz policies
CREATE POLICY "Quiz read policy"
  ON quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Quiz insert policy"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Quiz update policy"
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

CREATE POLICY "Quiz delete policy"
  ON quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );
