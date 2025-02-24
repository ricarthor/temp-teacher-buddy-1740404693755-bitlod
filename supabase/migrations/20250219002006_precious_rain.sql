-- Drop all existing policies to start fresh
DO $$ 
BEGIN
  -- Drop course policies
  DROP POLICY IF EXISTS "Course access policy" ON courses;
  DROP POLICY IF EXISTS "Course insert policy" ON courses;
  DROP POLICY IF EXISTS "Course update policy" ON courses;
  DROP POLICY IF EXISTS "Course delete policy" ON courses;
  
  -- Drop course_access policies
  DROP POLICY IF EXISTS "Course access view policy" ON course_access;
  DROP POLICY IF EXISTS "Course access manage policy" ON course_access;
END $$;

-- Create direct course policies without circular references
CREATE POLICY "Course read policy"
  ON courses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 
      FROM course_access 
      WHERE course_id = courses.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Course write policy"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course modify policy"
  ON courses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Course remove policy"
  ON courses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create simple course_access policies
CREATE POLICY "Access read policy"
  ON course_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Access write policy"
  ON course_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM courses 
      WHERE id = course_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Access modify policy"
  ON course_access FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM courses 
      WHERE id = course_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Access delete policy"
  ON course_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM courses 
      WHERE id = course_id 
      AND user_id = auth.uid()
    )
  );
