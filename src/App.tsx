// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { ThemeProvider } from './components/ThemeProvider';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Progress } from './pages/Progress';
import { QuizDetails } from './pages/QuizDetails';
import { Feedback } from './pages/Feedback';
import { Flagged } from './pages/Flagged';
import { Courses } from './pages/Courses';
import { CourseNew } from './pages/CourseNew';
import { CreateQuiz } from './pages/CreateQuiz';
import { TeacherQuizzes } from './pages/TeacherQuizzes';
import { Settings } from './pages/Settings';
import { TeacherHub } from './pages/TeacherHub';
import { StudentQuizAuth } from './pages/StudentQuiz/StudentQuizAuth';
import { StudentQuiz } from './pages/StudentQuiz/StudentQuiz';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          {/* Student Quiz Routes - No Auth Required */}
          <Route path="/student/quiz" element={<StudentQuizAuth />} />
          <Route path="/student/quiz/:quizId" element={<StudentQuiz />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/courses" replace />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/new" element={<CourseNew />} />
                    <Route path="/create-quiz" element={<CreateQuiz />} />
                    <Route path="/quizzes" element={<TeacherQuizzes />} />
                    <Route path="/quizzes/:quizId/edit" element={<CreateQuiz />} />
                    <Route 
                      path="/courses/:courseId" 
                      element={<Navigate to="students" replace />} 
                    />
                    <Route path="/courses/:courseId/students" element={<Students />} />
                    <Route path="/courses/:courseId/progress" element={<Progress />} />
                    <Route path="/courses/:courseId/progress/:quizId" element={<QuizDetails />} />
                    <Route path="/courses/:courseId/teacher-hub" element={<TeacherHub />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </AuthGuard>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
