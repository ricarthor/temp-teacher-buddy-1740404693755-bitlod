-- Drop functions first
DROP FUNCTION IF EXISTS import_course_students(uuid, jsonb);
DROP FUNCTION IF EXISTS import_quiz(uuid, jsonb);
DROP FUNCTION IF EXISTS import_quiz_with_metadata(uuid, text, text, text, jsonb);
DROP FUNCTION IF EXISTS get_quiz_data(uuid);
DROP FUNCTION IF EXISTS get_student_flags(uuid, uuid[]);
DROP FUNCTION IF EXISTS calculate_quiz_score(uuid, jsonb);

-- Drop tables if they exist
DROP TABLE IF EXISTS flags CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS course_students CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
