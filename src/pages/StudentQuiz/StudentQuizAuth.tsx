import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function StudentQuizAuth() {
  const navigate = useNavigate();
  const [quizCode, setQuizCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const trimmedCode = quizCode.trim();
      const trimmedStudentId = studentId.trim();
      
      // Log validation attempt
      console.log('Validating:', {
        quizCode: trimmedCode,
        studentId: trimmedStudentId
      });

      // Only select the fields we need
      const { data: quiz, error: quizError } = await supabase
        .from('teacher_quizzes')
        .select('id, code, title, status')
        .eq('code', trimmedCode)
        .single();

      if (quizError) {
        console.error('Quiz lookup error:', quizError);
        throw new Error('Error validating quiz code');
      }

      if (!quiz) {
        throw new Error('Invalid quiz code');
      }

      if (quiz.status !== 'active') {
        throw new Error('This quiz is not currently active');
      }

      // Log successful quiz lookup
      console.log('Quiz found:', quiz);

      // Validate student ID - use exact match on student_id
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('student_id')
        .eq('student_id', trimmedStudentId)
        .maybeSingle();

      // Log student lookup result
      console.log('Student lookup result:', { student, error: studentError });

      if (studentError) {
        console.error('Student lookup error:', studentError);
        throw new Error('Error validating student ID');
      }

      if (!student) {
        throw new Error('Invalid student ID');
      }

      // Check if student has already taken this quiz
      const { data: existingAnswers, error: answersError } = await supabase
        .from('quiz_answers')
        .select('id')
        .eq('quiz_id', quiz.id)
        .eq('student_id', student.student_id)
        .limit(1);

      if (answersError) {
        console.error('Answer check error:', answersError);
        throw new Error('Error checking quiz status');
      }

      if (existingAnswers && existingAnswers.length > 0) {
        throw new Error('You have already taken this quiz');
      }

      // All validations passed, navigate to quiz
      navigate(`/student/quiz/${quiz.id}`, {
        state: { 
          studentId: student.student_id,
          quizCode: quiz.code,
          quizTitle: quiz.title
        }
      });

    } catch (err: any) {
      console.error('Quiz validation error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">QuizTracker</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Start Quiz</h1>
          <p className="text-gray-600">Enter your quiz code and student ID to begin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quiz Code
            </label>
            <input
              type="text"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter quiz code"
              required
              pattern="[A-Z0-9]{4}"
              maxLength={4}
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the 4-digit code provided by your teacher
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your student ID"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}
