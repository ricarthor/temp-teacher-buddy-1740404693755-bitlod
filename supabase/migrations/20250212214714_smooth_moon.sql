/*
  # Initial Schema Setup for Quiz Management App

  1. New Tables
    - `students`
      - Basic student information
      - Academic records
      - Status tracking
    
    - `quizzes`
      - Quiz details
      - Status and dates
      - Topic information
    
    - `questions`
      - Question content
      - Type and options
      - Correct answers
    
    - `submissions`
      - Quiz submissions
      - Student responses
      - Timestamps
    
    - `feedback`
      - Student feedback
      - Ratings and comments
      - Submission references
    
    - `flags`
      - Student flags
      - Flag types and severity
      - Descriptions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  average_score numeric(5,2) DEFAULT 0 CHECK (average_score >= 0 AND average_score <= 100),
  quizzes_taken integer DEFAULT 0,
  last_quiz_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  topic text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  due_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('multiple-choice', 'true-false')),
  options jsonb,
  correct_answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  score numeric(5,2) CHECK (score >= 0 AND score <= 100),
  responses jsonb NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  pace integer CHECK (pace >= 1 AND pace <= 5),
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  comfort integer CHECK (comfort >= 1 AND comfort <= 5),
  continue_feedback text,
  start_feedback text,
  stop_feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flags table
CREATE TABLE IF NOT EXISTS flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('performance', 'engagement', 'feedback')),
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access to students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read access to flags"
  ON flags FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_submissions_quiz_id ON submissions(quiz_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_feedback_submission_id ON feedback(submission_id);
CREATE INDEX idx_flags_student_id ON flags(student_id);
