-- Create function to validate feedback field names
CREATE OR REPLACE FUNCTION validate_feedback_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_quiz record;
  v_feedback_question jsonb;
  v_field_name text;
BEGIN
  -- Get quiz feedback structure
  SELECT * INTO v_quiz
  FROM teacher_quizzes
  WHERE id = NEW.quiz_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  -- Validate rating fields
  FOR v_feedback_question IN SELECT * FROM jsonb_array_elements(v_quiz.feedback)
  LOOP
    v_field_name := v_feedback_question->>'text';
    
    -- For rating questions, ensure the field name matches the question text
    IF v_feedback_question->>'type' = 'rating' THEN
      IF NOT (NEW.rating_field ? v_field_name) THEN
        NEW.rating_field := jsonb_set(
          NEW.rating_field,
          array[v_field_name],
          NEW.rating_field->(v_feedback_question->>'id')
        );
        
        -- Remove the old UUID key if it exists
        IF NEW.rating_field ? (v_feedback_question->>'id') THEN
          NEW.rating_field := NEW.rating_field - (v_feedback_question->>'id');
        END IF;
      END IF;
    END IF;

    -- For open questions, ensure the field name matches the question text
    IF v_feedback_question->>'type' = 'open' THEN
      IF NOT (NEW.open_field ? v_field_name) THEN
        NEW.open_field := jsonb_set(
          NEW.open_field,
          array[v_field_name],
          NEW.open_field->(v_feedback_question->>'id')
        );
        
        -- Remove the old UUID key if it exists
        IF NEW.open_field ? (v_feedback_question->>'id') THEN
          NEW.open_field := NEW.open_field - (v_feedback_question->>'id');
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to validate feedback fields
DROP TRIGGER IF EXISTS tr_validate_feedback_fields ON quiz_feedback_imports;
CREATE TRIGGER tr_validate_feedback_fields
  BEFORE INSERT OR UPDATE ON quiz_feedback_imports
  FOR EACH ROW
  EXECUTE FUNCTION validate_feedback_fields();
