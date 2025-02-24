-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Truncate all tables in the correct order
TRUNCATE TABLE flags CASCADE;
TRUNCATE TABLE feedback CASCADE;
TRUNCATE TABLE submissions CASCADE;
TRUNCATE TABLE questions CASCADE;
TRUNCATE TABLE quizzes CASCADE;
TRUNCATE TABLE course_students CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE courses CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';
