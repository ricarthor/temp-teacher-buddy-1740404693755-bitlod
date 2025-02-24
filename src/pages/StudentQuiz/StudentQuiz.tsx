import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FeedbackForm } from '../../components/FeedbackForm';

interface QuizState {
  currentQuestion: number;
  answers: Record<string, string>;
  isSubmitting: boolean;
  error: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  showFeedback: boolean;
}

export function StudentQuiz() {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    isSubmitting: false,
    error: null,
    isSaving: false,
    lastSaved: null,
    showFeedback: false
  });

  // Prevent browser back/forward navigation
  useEffect(() => {
    const preventNavigation = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.pathname);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', preventNavigation);

    return () => window.removeEventListener('popstate', preventNavigation);
  }, []);

  // Fetch quiz data
  useEffect(() => {
    async function fetchQuiz() {
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('teacher_quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        if (!quizData) throw new Error('Quiz not found');

        if (!Array.isArray(quizData.questions)) {
          throw new Error('Invalid quiz format: questions array is missing');
        }

        setQuiz(quizData);
      } catch (err: any) {
        setState(prev => ({ ...prev, error: err.message }));
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [quizId]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = quiz?.questions?.[state.currentQuestion];
    if (!currentQuestion) return;

    const questionId = currentQuestion.question_id;
    if (!questionId) return;

    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    setState(prev => ({
      ...prev,
      currentQuestion: direction === 'next' 
        ? prev.currentQuestion + 1 
        : prev.currentQuestion - 1
    }));
  };

  const handleFeedbackSubmit = async (feedback: {
    rating_field: Record<string, number>;
    open_field: Record<string, string>;
  }) => {
    try {
      const { error: feedbackError } = await supabase
        .from('quiz_feedback_imports')
        .insert({
          quiz_id: quizId,
          student_id: location.state?.studentId,
          rating_field: feedback.rating_field,
          open_field: feedback.open_field
        });

      if (feedbackError) throw feedbackError;

      // Navigate back with success message
      navigate('/student/quiz', { 
        replace: true,
        state: { 
          message: 'Thank you for your feedback!'
        }
      });
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to submit feedback. Please try again.'
      }));
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !quizId || !window.confirm('Are you sure you want to submit your quiz?')) {
      return;
    }

    if (!location.state?.studentId) {
      setState(prev => ({ 
        ...prev, 
        error: 'Student ID is missing. Please try logging in again.' 
      }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const answers = quiz.questions.map((question: any) => ({
        question_id: question.question_id,
        selected_answer: state.answers[question.question_id] || ''
      }));

      const unansweredQuestions = answers.filter(a => !a.selected_answer);
      if (unansweredQuestions.length > 0) {
        throw new Error(`Please answer all questions before submitting (${unansweredQuestions.length} remaining)`);
      }

      const { data, error } = await supabase.rpc('save_quiz_answers', {
        p_student_id: location.state.studentId,
        p_quiz_id: quizId,
        p_answers: answers
      });

      if (error) throw error;

      if (data.error_count > 0) {
        throw new Error('Failed to save some answers. Please try again.');
      }

      // Show feedback form if quiz has feedback questions
      if (quiz.feedback && quiz.feedback.length > 0) {
        setState(prev => ({ ...prev, showFeedback: true, isSubmitting: false }));
      } else {
        // Navigate back with score
        navigate('/student/quiz', { 
          replace: true,
          state: { 
            message: 'Quiz completed successfully!'
          }
        });
      }
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      setState(prev => ({ 
        ...prev, 
        error: err.message || 'Failed to submit quiz. Please try again.',
        isSubmitting: false
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => navigate('/student/quiz')}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Quiz Login
          </button>
        </div>
      </div>
    );
  }

  if (!quiz?.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">No Questions</h2>
          </div>
          <p className="text-gray-600 mb-6">This quiz has no questions yet.</p>
          <button
            onClick={() => navigate('/student/quiz')}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Quiz Login
          </button>
        </div>
      </div>
    );
  }

  // Show feedback form after quiz submission
  if (state.showFeedback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Quiz Completed!</h2>
          <p className="text-[#64748b] mb-8">
            Thank you for completing the quiz. Please take a moment to provide your feedback.
          </p>
          <FeedbackForm
            feedback={quiz.feedback}
            onSubmit={handleFeedbackSubmit}
          />
        </div>
      </div>
    );
  }

  const currentQuestionData = quiz.questions[state.currentQuestion];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = state.currentQuestion === totalQuestions - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">{quiz.title}</h1>
          <div className="text-sm text-gray-600">
            Question {state.currentQuestion + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-[#2563eb] rounded-full transition-all"
                style={{ width: `${((state.currentQuestion + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              {currentQuestionData.text}
            </h2>

            {/* Code snippet for code interpretation questions */}
            {currentQuestionData.type === 'code-interpretation' && (
              <div className="mb-6">
                <div className="bg-gray-100 rounded-t-lg px-4 py-2 text-sm text-gray-700 font-medium">
                  {currentQuestionData.code_language}
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                  <code>{currentQuestionData.code_snippet}</code>
                </pre>
              </div>
            )}

            {/* Answer options */}
            <div className="space-y-3">
              {(currentQuestionData.type === 'multiple-choice' || currentQuestionData.type === 'code-interpretation') && (
                <>
                  {currentQuestionData.options?.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`w-full px-4 py-3 text-left rounded-lg transition-colors ${
                        state.answers[currentQuestionData.question_id] === option
                          ? 'bg-blue-50 border-2 border-[#2563eb] text-[#2563eb]'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </>
              )}

              {currentQuestionData.type === 'true-false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['true', 'false'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`px-4 py-3 text-center rounded-lg transition-colors ${
                        state.answers[currentQuestionData.question_id] === option
                          ? 'bg-blue-50 border-2 border-[#2563eb] text-[#2563eb]'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={state.currentQuestion === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={state.isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {state.isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={() => handleNavigation('next')}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
