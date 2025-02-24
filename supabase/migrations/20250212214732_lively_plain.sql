/*
  # Seed Data for Quiz Management App

  1. Initial Data
    - Sample students
    - Example quizzes
    - Quiz questions
    - Student submissions
    - Student feedback
    - Student flags
*/

-- Insert sample students
INSERT INTO students (name, email, phone, enrollment_date, status, average_score, quizzes_taken, last_quiz_date)
VALUES
  ('Emma Thompson', 'emma.t@university.edu', '(555) 123-4567', '2023-09-01', 'active', 87, 12, '2024-03-20'),
  ('Michael Chen', 'michael.c@university.edu', '(555) 234-5678', '2023-09-01', 'active', 65, 10, '2024-03-20'),
  ('Sarah Johnson', 'sarah.j@university.edu', '(555) 345-6789', '2023-09-01', 'active', 92, 11, '2024-03-21');

-- Insert sample quizzes
INSERT INTO quizzes (title, topic, description, status, due_date)
VALUES
  (
    'JavaScript Fundamentals',
    'Programming Basics',
    'Test your knowledge of JavaScript fundamentals',
    'active',
    '2024-03-25'
  ),
  (
    'React Hooks',
    'Frontend Development',
    'Understanding React Hooks and their usage',
    'active',
    '2024-03-28'
  );

-- Insert sample questions
WITH quiz1 AS (
  SELECT id FROM quizzes WHERE title = 'JavaScript Fundamentals' LIMIT 1
),
quiz2 AS (
  SELECT id FROM quizzes WHERE title = 'React Hooks' LIMIT 1
)
INSERT INTO questions (quiz_id, text, type, options, correct_answer)
VALUES
  (
    (SELECT id FROM quiz1),
    'What is the result of typeof null?',
    'multiple-choice',
    '["undefined", "object", "null", "number"]',
    'object'
  ),
  (
    (SELECT id FROM quiz1),
    'Is JavaScript a case-sensitive language?',
    'true-false',
    null,
    'true'
  ),
  (
    (SELECT id FROM quiz1),
    'Which method removes the last element from an array?',
    'multiple-choice',
    '["pop()", "push()", "shift()", "unshift()"]',
    'pop()'
  ),
  (
    (SELECT id FROM quiz2),
    'Can useState be used in regular JavaScript functions?',
    'true-false',
    null,
    'false'
  ),
  (
    (SELECT id FROM quiz2),
    'Which hook is used for side effects in React?',
    'multiple-choice',
    '["useEffect", "useState", "useContext", "useReducer"]',
    'useEffect'
  );

-- Insert sample submissions
WITH student1 AS (
  SELECT id FROM students WHERE email = 'emma.t@university.edu' LIMIT 1
),
student2 AS (
  SELECT id FROM students WHERE email = 'michael.c@university.edu' LIMIT 1
),
quiz1 AS (
  SELECT id FROM quizzes WHERE title = 'JavaScript Fundamentals' LIMIT 1
)
INSERT INTO submissions (quiz_id, student_id, score, responses)
VALUES
  (
    (SELECT id FROM quiz1),
    (SELECT id FROM student1),
    100,
    '[{"questionId": "q1", "answer": "object"}, {"questionId": "q2", "answer": true}, {"questionId": "q3", "answer": "pop()"}]'
  ),
  (
    (SELECT id FROM quiz1),
    (SELECT id FROM student2),
    65,
    '[{"questionId": "q1", "answer": "undefined"}, {"questionId": "q2", "answer": true}, {"questionId": "q3", "answer": "shift()"}]'
  );

-- Insert sample feedback
WITH submission1 AS (
  SELECT submissions.id, submissions.student_id, submissions.quiz_id
  FROM submissions
  JOIN students ON submissions.student_id = students.id
  WHERE students.email = 'emma.t@university.edu'
  LIMIT 1
),
submission2 AS (
  SELECT submissions.id, submissions.student_id, submissions.quiz_id
  FROM submissions
  JOIN students ON submissions.student_id = students.id
  WHERE students.email = 'michael.c@university.edu'
  LIMIT 1
)
INSERT INTO feedback (submission_id, student_id, quiz_id, pace, difficulty, comfort, continue_feedback, start_feedback, stop_feedback)
VALUES
  (
    (SELECT id FROM submission1),
    (SELECT student_id FROM submission1),
    (SELECT quiz_id FROM submission1),
    4, 3, 4,
    'The practical exercises are very helpful',
    'More real-world examples would be great',
    'Too many theoretical concepts at once'
  ),
  (
    (SELECT id FROM submission2),
    (SELECT student_id FROM submission2),
    (SELECT quiz_id FROM submission2),
    2, 4, 2,
    'The code examples in slides',
    'More practice exercises',
    'Fast pace of new concepts'
  );

-- Insert sample flags
WITH student2 AS (
  SELECT id FROM students WHERE email = 'michael.c@university.edu' LIMIT 1
)
INSERT INTO flags (student_id, type, description, severity)
VALUES
  (
    (SELECT id FROM student2),
    'performance',
    'Score significantly below class average',
    'high'
  ),
  (
    (SELECT id FROM student2),
    'feedback',
    'Reported difficulty with pace and comfort',
    'medium'
  );
