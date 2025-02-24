-- Drop and recreate the import_course_students function with proper student ID handling
CREATE OR REPLACE FUNCTION import_course_students(
  p_course_id uuid,
  p_students jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_record jsonb;
  v_student_id uuid;
BEGIN
  FOR student_record IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    -- Insert or update student
    -- Use the original student ID as is, since it's their institutional ID
    WITH new_student AS (
      INSERT INTO students (
        student_id,
        name,
        email
      )
      VALUES (
        student_record->>'student_id',  -- Keep original student ID
        student_record->>'name',
        student_record->>'email'
      )
      ON CONFLICT (student_id) DO UPDATE  -- Changed from email to student_id
      SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email
      RETURNING id
    )
    -- Store the student's UUID
    SELECT id INTO v_student_id FROM new_student;
    
    -- Link student to course using the UUID
    INSERT INTO course_students (course_id, student_id)
    VALUES (p_course_id, v_student_id)
    ON CONFLICT (course_id, student_id) DO NOTHING;
  END LOOP;
END;
$$;
