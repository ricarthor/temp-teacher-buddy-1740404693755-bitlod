-- Create quiz_feedback_imports table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_feedback_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES teacher_quizzes(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  rating_field jsonb NOT NULL,
  open_field jsonb NOT NULL,
  imported_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  UNIQUE(quiz_id, student_id)
);

-- Enable RLS
ALTER TABLE quiz_feedback_imports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Quiz owners can view feedback imports" ON quiz_feedback_imports;
DROP POLICY IF EXISTS "Quiz owners can import feedback" ON quiz_feedback_imports;

-- Create new policies that allow both authenticated and anonymous access
CREATE POLICY "Allow feedback submission"
  ON quiz_feedback_imports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow feedback viewing"
  ON quiz_feedback_imports FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_imports_quiz_id 
  ON quiz_feedback_imports(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_feedback_imports_student_id 
  ON quiz_feedback_imports(student_id);
