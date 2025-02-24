import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuizData } from '../hooks/useQuizData';
import { BookOpen, Copy } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { QuizHeader } from './QuizDetails/components/QuizHeader';
import { ResultsTable } from './QuizDetails/components/ResultsTable';
import { QuestionMetrics } from './QuizDetails/components/Insights/QuestionMetrics';
import { ActionableInsights } from './QuizDetails/components/Insights/ActionableInsights';
import { FeedbackSection } from './QuizDetails/components/Feedback/FeedbackSection';
import { Tabs } from '../components/Tabs';

export function QuizDetails() {
  const { quizId } = useParams();
  const [shouldRefetch, setShouldRefetch] = useState(0);
  const { quiz, answers = [], metrics = { quizStats: {}, studentMetrics: {} }, isLoading, error: quizError } =
    useQuizData(quizId || '', shouldRefetch);

  // Tabs
  const [activeTab, setActiveTab] = useState<'performance' | 'insights'>('performance');

  // Sorting, filtering, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'submittedAt',
    direction: 'desc' as 'asc' | 'desc',
  });
  const [questionFilters, setQuestionFilters] = useState<Array<{ questionId: string; value: string | null }>>([]);

  // Add the missing handleQuestionFilter function
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
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
                  placeholder="Search students..."
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
      <FeedbackSection quizId={quizId!} />
    </div>
  );
}
