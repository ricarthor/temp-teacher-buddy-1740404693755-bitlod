-- Drop the existing function first
DROP FUNCTION IF EXISTS import_course_students(uuid, jsonb);

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION import_course_students(
  p_course_id uuid,
  p_students jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_record jsonb;
  v_student_id uuid;
  v_result jsonb := '[]'::jsonb;
  v_error text;
BEGIN
  -- Validate input
  IF p_course_id IS NULL THEN
    RAISE EXCEPTION 'Course ID cannot be null';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id) THEN
    RAISE EXCEPTION 'Course with ID % does not exist', p_course_id;
  END IF;

  FOR student_record IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    BEGIN
      -- Insert or update student
      WITH new_student AS (
        INSERT INTO students (
          student_id,
          name,
          email
        )
        VALUES (
          student_record->>'student_id',
          student_record->>'name',
          student_record->>'email'
        )
        ON CONFLICT (student_id) DO UPDATE
        SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email
        RETURNING id, student_id
      )
      -- Store the student's UUID
      SELECT id INTO v_student_id FROM new_student;
      
      IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Failed to create or update student with ID %', student_record->>'student_id';
      END IF;

      -- Link student to course using the UUID
      INSERT INTO course_students (course_id, student_id)
      VALUES (p_course_id, v_student_id)
      ON CONFLICT (course_id, student_id) DO NOTHING;

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'student_id', student_record->>'student_id',
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next student
      v_error := SQLERRM;
      v_result := v_result || jsonb_build_object(
        'student_id', student_record->>'student_id',
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  -- Verify students were imported
  IF NOT EXISTS (
    SELECT 1 FROM course_students WHERE course_id = p_course_id
  ) THEN
    RAISE EXCEPTION 'No students were imported successfully';
  END IF;

  RETURN jsonb_build_object(
    'imported_students', v_result
  );
END;
$$;
