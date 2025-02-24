-- Add course_id to teacher_quizzes table
ALTER TABLE teacher_quizzes
ADD COLUMN course_id uuid REFERENCES courses(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_teacher_quizzes_course_id ON teacher_quizzes(course_id);

-- Update RLS policies to include course access
DROP POLICY IF EXISTS "Teacher quiz read policy" ON teacher_quizzes;
DROP POLICY IF EXISTS "Teacher quiz write policy" ON teacher_quizzes;
DROP POLICY IF EXISTS "Teacher quiz modify policy" ON teacher_quizzes;
DROP POLICY IF EXISTS "Teacher quiz remove policy" ON teacher_quizzes;

CREATE POLICY "Teacher quiz read policy"
  ON teacher_quizzes FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access ca
          WHERE ca.course_id = c.id
          AND ca.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Teacher quiz write policy"
  ON teacher_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access ca
          WHERE ca.course_id = c.id
          AND ca.user_id = auth.uid()
          AND ca.access_type = 'owner'
        )
      )
    )
  );

CREATE POLICY "Teacher quiz modify policy"
  ON teacher_quizzes FOR UPDATE
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access ca
          WHERE ca.course_id = c.id
          AND ca.user_id = auth.uid()
          AND ca.access_type = 'owner'
        )
      )
    )
  )
  WITH CHECK (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access ca
          WHERE ca.course_id = c.id
          AND ca.user_id = auth.uid()
          AND ca.access_type = 'owner'
        )
      )
    )
  );

CREATE POLICY "Teacher quiz remove policy"
  ON teacher_quizzes FOR DELETE
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_id
      AND (
        c.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access ca
          WHERE ca.course_id = c.id
          AND ca.user_id = auth.uid()
          AND ca.access_type = 'owner'
        )
      )
    )
  );
