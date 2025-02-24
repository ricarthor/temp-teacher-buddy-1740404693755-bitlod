-- Create a function to get student flags that handles large numbers of student IDs
CREATE OR REPLACE FUNCTION get_student_flags(
  p_course_id uuid,
  p_student_ids uuid[]
)
RETURNS SETOF flags
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM flags
  WHERE course_id = p_course_id
  AND student_id = ANY(p_student_ids);
END;
$$;
