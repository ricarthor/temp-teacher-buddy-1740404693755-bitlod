-- Create function to get quiz data
CREATE OR REPLACE FUNCTION get_quiz_data(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_quiz_data record;
  v_submissions jsonb;
  v_student_metrics jsonb;
  v_questions jsonb;
BEGIN
  -- Get basic quiz information
  SELECT 
    q.id,
    q.title,
    q.topic,
    q.description,
    q.status,
    q.due_date,
    q.created_at
  INTO v_quiz_data
  FROM quizzes q
  WHERE q.id = p_quiz_id;

  IF v_quiz_data IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Quiz not found'
    );
  END IF;

  -- Get questions with their answers
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'options', q.options,
      'correct_answer', q.correct_answer
    )
  )
  INTO v_questions
  FROM questions q
  WHERE q.quiz_id = p_quiz_id;

  -- Get student answers
  WITH student_answers AS (
    SELECT 
      s.student_id,
      s.name as student_name,
      qa.quiz_id,
      qa.created_at as submitted_at,
      jsonb_agg(
        jsonb_build_object(
          'questionId', qa.question_id,
          'answer', qa.selected_answer,
          'isCorrect', qa.is_correct
        )
      ) as responses
    FROM quiz_answers qa
    JOIN students s ON s.student_id = qa.student_id
    WHERE qa.quiz_id = p_quiz_id
    GROUP BY s.student_id, s.name, qa.quiz_id, qa.created_at
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'studentId', student_id,
      'studentName', student_name,
      'submittedAt', submitted_at,
      'responses', responses
    )
  )
  INTO v_student_metrics
  FROM student_answers;

  -- Calculate statistics
  WITH answer_stats AS (
    SELECT 
      COUNT(DISTINCT student_id) as total_submissions,
      AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as average_score
    FROM quiz_answers
    WHERE quiz_id = p_quiz_id
  )
  SELECT jsonb_build_object(
    'totalSubmissions', total_submissions,
    'averageScore', ROUND(COALESCE(average_score, 0)::numeric, 2),
    'medianScore', 0, -- Placeholder for now
    'highestScore', 0, -- Placeholder for now
    'lowestScore', 0 -- Placeholder for now
  )
  INTO v_submissions
  FROM answer_stats;

  -- Combine all data
  v_result := jsonb_build_object(
    'quiz', v_quiz_data,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'student_metrics', COALESCE(v_student_metrics, '[]'::jsonb),
    'stats', COALESCE(v_submissions, '{}'::jsonb)
  );

  RETURN v_result;
END;
$$;
