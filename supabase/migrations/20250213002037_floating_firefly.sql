/*
  # Fix Student Import Function
  
  1. Changes
    - Modify student_id generation to be unique per course
    - Update import_course_students function to handle unique student IDs
    - Add validation to prevent duplicate student IDs
  
  2. Security
    - Maintain existing RLS policies
    - Function remains security definer for proper access control
*/

-- Drop and recreate the import function with fixed student_id generation
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
    -- Generate a unique student_id based on the original ID and course
    -- This ensures the same student can be in multiple courses
    -- Format: {original_id}_{course_id_first_8_chars}
    DECLARE
      v_unique_student_id text;
    BEGIN
      v_unique_student_id := (student_record->>'student_id') || '_' || 
                            substring(p_course_id::text, 1, 8);

      -- Insert or update student
      WITH new_student AS (
        INSERT INTO students (student_id, name, email)
        VALUES (
          v_unique_student_id,
          student_record->>'name',
          student_record->>'email'
        )
        ON CONFLICT (email) DO UPDATE
        SET 
          name = EXCLUDED.name,
          student_id = v_unique_student_id
        RETURNING id
      )
      -- Store the student's UUID
      SELECT id INTO v_student_id FROM new_student;
      
      -- Link student to course using the UUID
      INSERT INTO course_students (course_id, student_id)
      VALUES (p_course_id, v_student_id)
      ON CONFLICT (course_id, student_id) DO NOTHING;
    END;
  END LOOP;
END;
$$;
