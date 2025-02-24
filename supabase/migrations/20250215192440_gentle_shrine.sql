-- Drop existing tables if they exist
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS flags CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS course_students CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Create courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table with student_id as the primary identifier
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,  -- Make student_id unique
  name text NOT NULL,
  email text NOT NULL,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create course_students junction table
CREATE TABLE course_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Create quizzes table
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  topic text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  due_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('multiple-choice', 'true-false')),
  options jsonb,
  correct_answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,  -- Reference the unique student_id
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for course owners"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for course owners"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create student import function
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

-- Create indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_quiz_answers_student_id ON quiz_answers(student_id);
CREATE INDEX idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_created_at ON quiz_answers(created_at);

-- Add RLS policies for quiz_answers
CREATE POLICY "Allow course owners to read quiz_answers"
  ON quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_answers.quiz_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to insert quiz_answers"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND courses.user_id = auth.uid()
    )
  );
