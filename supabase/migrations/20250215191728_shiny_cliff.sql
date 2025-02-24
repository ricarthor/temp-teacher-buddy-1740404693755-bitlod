-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,  -- This matches the student_id in students table
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Add indexes for better performance
CREATE INDEX idx_quiz_answers_student_id ON quiz_answers(student_id);
CREATE INDEX idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_created_at ON quiz_answers(created_at);

-- Enable RLS
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create function to import quiz answers
CREATE OR REPLACE FUNCTION import_quiz_answers(
  p_answers jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  answer_record jsonb;
BEGIN
  FOR answer_record IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    -- Insert each answer
    INSERT INTO quiz_answers (
      student_id,
      quiz_id,
      question_id,
      selected_answer,
      is_correct,
      created_at
    )
    VALUES (
      answer_record->>'student_id',
      (answer_record->>'quiz_id')::uuid,
      (answer_record->>'question_id')::uuid,
      answer_record->>'selected_answer',
      (answer_record->>'is_correct')::boolean,
      (answer_record->>'created_at')::timestamptz
    )
    ON CONFLICT DO NOTHING;  -- Skip if already exists
  END LOOP;
END;
$$;
