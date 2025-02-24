/*
  # Fix Import Function and Add Missing Policies

  1. Changes
    - Fix ambiguous student_id reference in import_course_students function
    - Add missing policies for course_students table
    - Add missing policies for students table

  2. Security
    - Ensure proper access control for student imports
    - Maintain data integrity during import process
*/

-- Drop and recreate the import function with fixed column references
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
    WITH new_student AS (
      INSERT INTO students (student_id, name, email)
      VALUES (
        student_record->>'student_id',
        student_record->>'name',
        student_record->>'email'
      )
      ON CONFLICT (email) DO UPDATE
      SET 
        name = EXCLUDED.name,
        student_id = EXCLUDED.student_id
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

-- Add missing policies for course_students
CREATE POLICY "Allow course owners to insert course_students"
  ON course_students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to update course_students"
  ON course_students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add missing policies for students
CREATE POLICY "Allow authenticated users to insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
