-- Drop and recreate quiz_answers table with updated structure
DROP TABLE IF EXISTS quiz_answers;

CREATE TABLE quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, quiz_id, question_id)
);

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

-- Create function to import quiz answers
CREATE OR REPLACE FUNCTION import_quiz_answers(
  p_quiz_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  answer_record jsonb;
  v_result jsonb := '[]'::jsonb;
  v_error text;
  v_course_id uuid;
  v_question record;
BEGIN
  -- Log input parameters
  RAISE NOTICE 'Starting import for quiz_id: %, answers count: %', 
    p_quiz_id, 
    jsonb_array_length(p_answers);

  -- Get the course_id for the quiz
  SELECT course_id INTO v_course_id
  FROM quizzes
  WHERE id = p_quiz_id;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Quiz with ID % not found', p_quiz_id;
  END IF;

  -- Process each answer
  FOR answer_record IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    BEGIN
      -- Log current record
      RAISE NOTICE 'Processing answer: %', answer_record;

      -- Verify student exists
      IF NOT EXISTS (
        SELECT 1 FROM students 
        WHERE student_id = answer_record->>'student_id'
      ) THEN
        RAISE EXCEPTION 'Student with ID % not found', answer_record->>'student_id';
      END IF;

      -- Get the question to verify it exists and get correct answer
      SELECT id, correct_answer INTO v_question
      FROM questions
      WHERE id = (answer_record->>'question_id')::uuid
      AND quiz_id = p_quiz_id;

      IF v_question.id IS NULL THEN
        RAISE EXCEPTION 'Question with ID % not found for quiz %', 
          answer_record->>'question_id', 
          p_quiz_id;
      END IF;

      -- Insert answer
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
        p_quiz_id,
        v_question.id,
        answer_record->>'selected_answer',
        (answer_record->>'is_correct')::boolean,
        COALESCE((answer_record->>'created_at')::timestamptz, now())
      )
      ON CONFLICT (student_id, quiz_id, question_id) 
      DO UPDATE SET
        selected_answer = EXCLUDED.selected_answer,
        is_correct = EXCLUDED.is_correct,
        created_at = EXCLUDED.created_at;

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'question_id', answer_record->>'question_id',
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next answer
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      RAISE NOTICE 'Error processing answer: %', v_error;
      
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'question_id', answer_record->>'question_id',
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported_answers', v_result
  );
END;
$$;
