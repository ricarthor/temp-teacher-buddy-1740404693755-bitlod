-- Drop and recreate share_course function with proper auth schema handling
CREATE OR REPLACE FUNCTION share_course(
  p_course_id uuid,
  p_email text,
  p_access_type text DEFAULT 'viewer'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
  v_user_exists boolean;
  v_debug jsonb;
BEGIN
  -- Check if user is course owner
  IF NOT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = p_course_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only course owners can share courses';
  END IF;

  -- Get user ID from email (case-insensitive)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Collect debug information
  SELECT jsonb_build_object(
    'user_id', v_user_id,
    'email', p_email,
    'exists', v_user_id IS NOT NULL
  ) INTO v_debug;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('No user found with email %s', p_email),
      'debug', v_debug
    );
  END IF;

  -- Prevent sharing with yourself
  IF v_user_id = auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot share course with yourself',
      'debug', v_debug
    );
  END IF;

  -- Check if user already has access
  IF EXISTS (
    SELECT 1 FROM public.course_access
    WHERE course_id = p_course_id
    AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already has access to this course',
      'debug', v_debug
    );
  END IF;

  -- Add course access
  INSERT INTO public.course_access (course_id, user_id, access_type, created_by)
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
    'access_type', access_type,
    'debug', v_debug
  ) INTO v_result;

  RETURN v_result;
END;
$$;
