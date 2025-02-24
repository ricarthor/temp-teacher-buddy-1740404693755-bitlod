-- First drop any existing foreign key constraint
ALTER TABLE quiz_answers
DROP CONSTRAINT IF EXISTS quiz_answers_quiz_id_fkey;

-- Drop any existing index
DROP INDEX IF EXISTS idx_quiz_answers_quiz_id;

-- Create quiz_answers table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL,
  question_id uuid NOT NULL,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, quiz_id, question_id)
);

-- Add foreign key constraint with validation disabled
ALTER TABLE quiz_answers 
ADD CONSTRAINT quiz_answers_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES teacher_quizzes(id) 
ON DELETE CASCADE 
NOT VALID;

-- Create index for better performance
CREATE INDEX idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);

-- Update RLS policies for quiz_answers
DROP POLICY IF EXISTS "Allow anonymous quiz answer check" ON quiz_answers;
DROP POLICY IF EXISTS "Allow anonymous quiz answer submission" ON quiz_answers;
DROP POLICY IF EXISTS "Allow anonymous quiz answer updates" ON quiz_answers;

-- Create new policies that reference teacher_quizzes
CREATE POLICY "Allow quiz answer check"
  ON quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_quizzes tq
      WHERE tq.id = quiz_id
      AND (
        tq.creator_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM courses c
          WHERE c.id = tq.course_id
          AND (
            c.user_id = auth.uid() OR
            EXISTS (
              SELECT 1 FROM course_access ca
              WHERE ca.course_id = c.id
              AND ca.user_id = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Allow quiz answer submission"
  ON quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_quizzes tq
      WHERE tq.id = quiz_id
      AND tq.status = 'active'
    )
  );

CREATE POLICY "Allow quiz answer updates"
  ON quiz_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teacher_quizzes tq
      WHERE tq.id = quiz_id
      AND tq.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teacher_quizzes tq
      WHERE tq.id = quiz_id
      AND tq.status = 'active'
    )
  );
