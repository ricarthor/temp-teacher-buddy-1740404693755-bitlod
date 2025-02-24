-- Drop and recreate course policies to fix infinite recursion
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own or shared courses" ON courses;
  DROP POLICY IF EXISTS "Users can create courses" ON courses;
  DROP POLICY IF EXISTS "Course owners can update courses" ON courses;
  DROP POLICY IF EXISTS "Course owners can delete courses" ON courses;
  
  -- Drop course_access policies
  DROP POLICY IF EXISTS "Users can view their own access" ON course_access;
  DROP POLICY IF EXISTS "Course owners can manage access" ON course_access;
END $$;

-- Create simplified course policies
CREATE POLICY "Course access policy"
  ON courses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    id IN (
      SELECT course_id 
      FROM course_access 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Course insert policy"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course update policy"
  ON courses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course delete policy"
  ON courses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create simplified course_access policies
CREATE POLICY "Course access view policy"
  ON course_access FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    course_id IN (
      SELECT id 
      FROM courses 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Course access manage policy"
  ON course_access FOR ALL
  TO authenticated
  USING (
    course_id IN (
      SELECT id 
      FROM courses 
      WHERE user_id = auth.uid()
    )
  );
