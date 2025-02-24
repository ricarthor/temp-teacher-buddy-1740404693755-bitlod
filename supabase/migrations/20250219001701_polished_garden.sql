-- Drop and recreate course access functionality
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
    EXISTS (
      SELECT 1 FROM course_access
      WHERE course_id = course_access.course_id
      AND user_id = auth.uid()
      AND access_type = 'owner'
    )
  );

-- Update course policies to use course_access
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON courses;
DROP POLICY IF EXISTS "Users can view courses they have access to" ON courses;

CREATE POLICY "Users can view courses they have access to"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_access
      WHERE course_id = id
      AND user_id = auth.uid()
    )
  );

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
    SELECT 1 FROM course_access
    WHERE course_id = p_course_id
    AND user_id = auth.uid()
    AND access_type = 'owner'
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
    SELECT 1 FROM course_access
    WHERE course_id = p_course_id
    AND user_id = auth.uid()
    AND access_type = 'owner'
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
