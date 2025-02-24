-- Drop and recreate course access functionality with fixed policies
DO $$ 
BEGIN
  -- Drop existing objects if they exist
  DROP TABLE IF EXISTS course_access CASCADE;
  DROP FUNCTION IF EXISTS share_course CASCADE;
  DROP FUNCTION IF EXISTS remove_course_access CASCADE;
  DROP FUNCTION IF EXISTS add_course_owner CASCADE;
  DROP TRIGGER IF EXISTS tr_add_course_owner ON courses;
END $$;

-- Create course_access table
CREATE TABLE course_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('owner', 'viewer')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(course_id, user_id)
);

-- Enable RLS
ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

-- Create policies for course_access
CREATE POLICY "Users can view their own access"
  ON course_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Course owners can manage access"
  ON course_access FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_access.course_id
      AND c.user_id = auth.uid()
    )
  );

-- Update course policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Users can view courses they have access to" ON courses;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Enable update access for course owners" ON courses;
DROP POLICY IF EXISTS "Enable delete access for course owners" ON courses;

-- Create new course policies
CREATE POLICY "Users can view their own or shared courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM course_access ca
      WHERE ca.course_id = id
      AND ca.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Course owners can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Course owners can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to share course with a user
CREATE OR REPLACE FUNCTION share_course(
  p_course_id uuid,
  p_email text,
  p_access_type text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Check if user is course owner
  IF NOT EXISTS (
    SELECT 1 FROM courses
    WHERE id = p_course_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only course owners can share courses';
  END IF;

  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Add course access
  INSERT INTO course_access (course_id, user_id, access_type, created_by)
  VALUES (p_course_id, v_user_id, p_access_type, auth.uid())
  ON CONFLICT (course_id, user_id) 
  DO UPDATE SET access_type = EXCLUDED.access_type
  RETURNING jsonb_build_object(
    'success', true,
    'course_id', course_id,
    'user_id', user_id,
    'access_type', access_type
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to remove course access
CREATE OR REPLACE FUNCTION remove_course_access(
  p_course_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user is course owner
  IF NOT EXISTS (
    SELECT 1 FROM courses
    WHERE id = p_course_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only course owners can manage course access';
  END IF;

  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Remove access
  DELETE FROM course_access
  WHERE course_id = p_course_id
  AND user_id = v_user_id
  AND access_type != 'owner';

  RETURN jsonb_build_object(
    'success', true
  );
END;
$$;

-- Function to automatically add owner access
CREATE OR REPLACE FUNCTION add_course_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO course_access (course_id, user_id, access_type, created_by)
  VALUES (NEW.id, auth.uid(), 'owner', auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new courses
CREATE TRIGGER tr_add_course_owner
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION add_course_owner();
