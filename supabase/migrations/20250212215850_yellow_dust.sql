/*
  # Add course management

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text: active, archived)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `course_students`
      - `id` (uuid, primary key)
      - `course_id` (uuid, references courses)
      - `student_id` (uuid, references students)
      - `status` (text: active, dropped)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `course_id` to existing tables:
      - quizzes
      - students

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_students junction table
CREATE TABLE IF NOT EXISTS course_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Add course_id to quizzes
ALTER TABLE quizzes ADD COLUMN course_id uuid REFERENCES courses(id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to course_students"
  ON course_students FOR SELECT
  TO authenticated
  USING (true);

-- Create function to process student CSV
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
BEGIN
  FOR student_record IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    -- Insert or update student
    WITH new_student AS (
      INSERT INTO students (name, email, phone, enrollment_date)
      VALUES (
        student_record->>'name',
        student_record->>'email',
        student_record->>'phone',
        COALESCE((student_record->>'enrollment_date')::date, CURRENT_DATE)
      )
      ON CONFLICT (email) DO UPDATE
      SET 
        name = EXCLUDED.name,
        phone = EXCLUDED.phone
      RETURNING id
    )
    -- Link student to course
    INSERT INTO course_students (course_id, student_id)
    SELECT p_course_id, id FROM new_student
    ON CONFLICT (course_id, student_id) DO NOTHING;
  END LOOP;
END;
$$;
