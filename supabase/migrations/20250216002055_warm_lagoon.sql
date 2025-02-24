-- Create function to import quiz with questions
CREATE OR REPLACE FUNCTION import_quiz_with_metadata(
  p_course_id uuid,
  p_quiz_title text,
  p_quiz_topic text,
  p_quiz_description text,
  p_questions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  v_question_record record;
  v_result jsonb := '[]'::jsonb;
  v_error text;
BEGIN
  -- Create quiz
  INSERT INTO quizzes (
    course_id,
    title,
    topic,
    description,
    status,
    due_date
  ) VALUES (
    p_course_id,
    p_quiz_title,
    p_quiz_topic,
    p_quiz_description,
    'completed',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_quiz_id;

  -- Process each question
  FOR v_question_record IN 
    SELECT 
      key as question_id,
      value->>'question' as text,
      value->>'options' as options_json,
      value->>'answer' as correct_answer,
      (value->>'question_order')::int as question_order
    FROM jsonb_each(p_questions)
  LOOP
    BEGIN
      -- Insert question
      INSERT INTO questions (
        quiz_id,
        text,
        type,
        options,
        correct_answer
      ) VALUES (
        v_quiz_id,
        v_question_record.text,
        'multiple-choice',
        v_question_record.options_json::jsonb,
        v_question_record.correct_answer
      );

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'question_id', v_question_record.question_id,
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next question
      v_error := SQLERRM;
      v_result := v_result || jsonb_build_object(
        'question_id', v_question_record.question_id,
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id,
    'imported_questions', v_result
  );
END;
$$;
