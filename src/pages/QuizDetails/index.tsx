import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Copy } from 'lucide-react';

import { useQuizData } from '../../hooks/useQuizData';
import { SearchBar } from '../../components/SearchBar';
import { QuizHeader } from './components/QuizHeader';
import { ResultsTable } from './components/ResultsTable';
import { QuestionMetrics } from './components/Insights/QuestionMetrics';
import { ActionableInsights } from './components/Insights/ActionableInsights';
import { FeedbackOverview } from './components/FeedbackOverview';
import { Tabs } from './components/Tabs';
import { supabase } from '../../lib/supabase';

interface FeedbackData {
  open_field: Record<string, string>;
  rating_fields: Record<string, number>;
}

export function QuizDetails() {
  const { quizId } = useParams();

  // Tabs
  const [activeTab, setActiveTab] = useState<'performance' | 'insights'>('performance');

  // Quiz data
  const { quiz, answers = [], metrics = { quizStats: {}, studentMetrics: {} }, isLoading, error: quizError } =
    useQuizData(quizId || '', 0);

  // Sorting, filtering, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'submittedAt',
    direction: 'desc' as 'asc' | 'desc',
  });
  const [questionFilters, setQuestionFilters] = useState<Array<{ questionId: string; value: string | null }>>([]);

  // Feedback data
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Fetch feedback when component mounts
  useEffect(() => {
    if (quizId) {
      fetchFeedback();
    }
  }, [quizId]);

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);

      const { data, error } = await supabase
        .from('students_feedback')
        .select('id, student_id, quiz_id, open_field, rating_fields, created_at')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedFeedback = (data || []).map(item => ({
        open_field: item.open_field as Record<string, string>,
        rating_fields: item.rating_fields as Record<string, number>,
      }));

      setFeedback(transformedFeedback);
    } catch (err: any) {
      console.error('Error fetching feedback:', err);
      setFeedbackError(err.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleQuestionFilter = (questionId: string, value: string | null) => {
    setQuestionFilters(current => {
      const existing = current.find(f => f.questionId === questionId);
      if (existing) {
        return current.map(f =>
          f.questionId === questionId ? { ...f, value } : f
        );
      }
      return [...current, { questionId, value }];
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-lg">
        <h3 className="font-semibold mb-2">Error Loading Quiz</h3>
        <p>{quizError.message}</p>
      </div>
    );
  }

  if (!quiz?.title) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Quiz Not Found</h3>
        <p className="text-gray-500">The quiz you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quiz Header */}
      <QuizHeader quiz={quiz} metrics={metrics} />

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* TABS */}
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* PERFORMANCE TAB */}
        {activeTab === 'performance' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search..."
                />
              </div>
              <button
                onClick={() => {
                  const emails = answers.map(answer => answer.studentEmail).join(', ');
                  navigator.clipboard.writeText(emails);
                }}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Email List ({answers.length})
              </button>
            </div>

            <ResultsTable
              quiz={quiz}
              answers={answers}
              metrics={metrics}
              searchQuery={searchQuery}
              sortConfig={sortConfig}
              questionFilters={questionFilters}
              onSort={key =>
                setSortConfig(current => ({
                  key,
                  direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
                }))
              }
              onQuestionFilter={handleQuestionFilter}
            />
          </>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            <QuestionMetrics questions={quiz.questions} answers={answers} />
            <ActionableInsights questions={quiz.questions} answers={answers} totalEnrolled={20} />
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1e293b] mb-6">Student Feedback</h2>
        {feedbackLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbackError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Error Loading Feedback</h3>
            <p>{feedbackError}</p>
          </div>
        ) : (
          <FeedbackOverview feedback={feedback} />
        )}
      </div>
    </div>
  );
}
