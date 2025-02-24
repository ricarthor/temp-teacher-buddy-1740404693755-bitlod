-- Drop and recreate share_course function with improved error handling
CREATE OR REPLACE FUNCTION share_course(
  p_course_id uuid,
  p_email text,
  p_access_type text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
  v_user_exists boolean;
BEGIN
  -- Check if user is course owner
  IF NOT EXISTS (
    SELECT 1 FROM courses
    WHERE id = p_course_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only course owners can share courses';
  END IF;

  -- First check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No user found with email %s', p_email)
    );
  END IF;

  -- Get user ID from email (case-insensitive)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(p_email)
  AND confirmed_at IS NOT NULL;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User email not confirmed'
    );
  END IF;

  -- Prevent sharing with yourself
  IF v_user_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot share course with yourself'
    );
  END IF;

  -- Check if user already has access
  IF EXISTS (
    SELECT 1 FROM course_access
    WHERE course_id = p_course_id
    AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has access to this course'
    );
  END IF;

  -- Add course access
  INSERT INTO course_access (course_id, user_id, access_type, created_by)
  VALUES (p_course_id, v_user_id, p_access_type, auth.uid())
  ON CONFLICT (course_id, user_id) 
  DO UPDATE SET 
    access_type = EXCLUDED.access_type,
    created_at = now(),
    created_by = EXCLUDED.created_by
  RETURNING jsonb_build_object(
    'success', true,
    'course_id', course_id,
    'user_id', user_id,
    'access_type', access_type
  ) INTO v_result;

  RETURN v_result;
END;
$$;
