-- Drop existing quiz policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Quiz read policy" ON quizzes;
  DROP POLICY IF EXISTS "Quiz insert policy" ON quizzes;
  DROP POLICY IF EXISTS "Quiz update policy" ON quizzes;
  DROP POLICY IF EXISTS "Quiz delete policy" ON quizzes;
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
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  );

CREATE POLICY "Quiz update policy"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  );

CREATE POLICY "Quiz delete policy"
  ON quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  );
