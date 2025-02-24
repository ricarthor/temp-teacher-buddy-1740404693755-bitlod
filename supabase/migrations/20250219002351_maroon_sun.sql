-- Drop and recreate share_course function with case-insensitive email handling
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

  -- Get user ID from email (case-insensitive)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email);

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Prevent sharing with yourself
  IF v_user_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot share course with yourself'
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
