import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { Copy, ChevronDown } from 'lucide-react';
import type { Quiz, StudentAnswer } from '../../../../types/quiz';

interface ResultsTableProps {
  quiz: Quiz;
  answers: StudentAnswer[];
  metrics: {
    studentMetrics: Record<string, any>;
  };
  searchQuery: string;
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  questionFilters: Array<{ questionId: string; value: string | null }>;
  onSort: (key: string) => void;
  onQuestionFilter: (questionId: string, value: string | null) => void;
}

const ROWS_PER_PAGE = 5;

export function ResultsTable({
  quiz,
  answers,
  metrics,
  searchQuery,
  sortConfig,
  questionFilters,
  onSort,
  onQuestionFilter
}: ResultsTableProps) {
  const [displayCount, setDisplayCount] = React.useState(ROWS_PER_PAGE);

  // Get unique answers for each multiple-choice question
  const questionOptions = React.useMemo(() => {
    if (!quiz?.questions) return {};

    const options: Record<string, Set<string>> = {};
    
    quiz.questions.forEach(question => {
      if (question.type === 'multiple-choice') {
        options[question.id] = new Set();
        answers.forEach(answer => {
          const response = answer.responses.find(r => r.questionId === question.id);
          if (response?.answer) {
            options[question.id].add(response.answer.toString());
          }
        });
      }
    });

    return options;
  }, [quiz?.questions, answers]);

  // Filter and sort answers
  const filteredAnswers = React.useMemo(() => {
    let result = answers;

    // Apply text search
    if (searchQuery) {
      result = result.filter(answer => 
        answer.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply question filters
    if (questionFilters.length > 0) {
      result = result.filter(answer => {
        return questionFilters.every(filter => {
          if (!filter.value) return true;

          // Handle score range filter
          if (filter.questionId === 'score') {
            const score = answer.responses.filter(r => r.isCorrect).length / quiz.questions.length * 100;
            const [min, max] = filter.value.split('-').map(Number);
            return score >= min && score <= (max || 100);
          }

          // Handle regular question filters
          const response = answer.responses.find(r => r.questionId === filter.questionId);
          return response?.answer?.toString() === filter.value;
        });
      });
    }

    // Sort answers
    result = [...result].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'studentName':
          aValue = a.studentName;
          bValue = b.studentName;
          break;
        case 'score':
          aValue = (a.responses.filter(r => r.isCorrect).length / quiz.questions.length) * 100;
          bValue = (b.responses.filter(r => r.isCorrect).length / quiz.questions.length) * 100;
          break;
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        default:
          aValue = a[sortConfig.key as keyof typeof a];
          bValue = b[sortConfig.key as keyof typeof b];
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return result;
  }, [answers, searchQuery, questionFilters, sortConfig, quiz.questions.length]);

  const displayedAnswers = filteredAnswers.slice(0, displayCount);
  const hasMore = displayedAnswers.length < filteredAnswers.length;

  const handleCopyEmails = () => {
    const emails = filteredAnswers.map(answer => answer.studentEmail).join(', ');
    navigator.clipboard.writeText(emails);
  };

  const handleShowMore = () => {
    setDisplayCount(prev => prev + ROWS_PER_PAGE);
  };

  // Reset display count when filters change
  React.useEffect(() => {
    setDisplayCount(ROWS_PER_PAGE);
  }, [searchQuery, questionFilters, sortConfig]);

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <p className="text-[#64748b]">No questions available for this quiz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleCopyEmails}
          className="px-4 py-2 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Email List ({filteredAnswers.length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <TableHeader
              questions={quiz.questions}
              sortConfig={sortConfig}
              questionFilters={questionFilters}
              questionOptions={questionOptions}
              onSort={onSort}
              onQuestionFilter={onQuestionFilter}
            />
            <tbody>
              {displayedAnswers.map(answer => (
                <TableRow
                  key={`${answer.studentId}-${answer.id}`}
                  answer={answer}
                  questions={quiz.questions}
                  studentMetrics={metrics.studentMetrics[answer.studentId]}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleShowMore}
            className="px-6 py-3 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Show More ({filteredAnswers.length - displayedAnswers.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
