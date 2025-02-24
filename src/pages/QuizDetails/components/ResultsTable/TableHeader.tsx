import React from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import type { Question } from '../../../../types/quiz';

interface TableHeaderProps {
  questions: Question[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  };
  questionFilters: Array<{ questionId: string; value: string | null }>;
  questionOptions: Record<string, Set<string>>;
  onSort: (key: string) => void;
  onQuestionFilter: (questionId: string, value: string | null) => void;
}

export function TableHeader({
  questions,
  sortConfig,
  questionFilters,
  questionOptions,
  onSort,
  onQuestionFilter
}: TableHeaderProps) {
  const renderSortButton = (key: string, label: string) => (
    <button
      onClick={() => onSort(key)}
      className="flex items-center gap-2 text-sm font-medium text-[#1e293b]"
    >
      {label}
      {sortConfig.key === key && (
        sortConfig.direction === 'asc' ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th key="studentId" className="px-6 py-4 text-left">
          {renderSortButton('studentId', 'Student ID')}
        </th>
        <th key="student" className="px-6 py-4 text-left">
          <div className="space-y-1">
            {renderSortButton('studentName', 'Student')}
            <div className="text-xs text-[#64748b]">Name and Email</div>
          </div>
        </th>
        <th key="submitted" className="px-6 py-4 text-left">
          {renderSortButton('submittedAt', 'Submitted')}
        </th>
        {questions.map((question, index) => (
          <th key={question.id} className="px-6 py-4 text-left">
            <div className="space-y-2">
              <div className="text-sm font-medium text-[#1e293b]">
                Q{index + 1}
              </div>
              <div className="text-xs text-[#64748b]">
                {question.text.length > 30 
                  ? `${question.text.substring(0, 30)}...` 
                  : question.text}
              </div>
              {question.type === 'multiple-choice' && questionOptions[question.id] && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-[#64748b]" />
                  <select
                    value={questionFilters.find(f => f.questionId === question.id)?.value || ''}
                    onChange={(e) => onQuestionFilter(
                      question.id, 
                      e.target.value || null
                    )}
                    className="text-xs p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="">All answers</option>
                    {Array.from(questionOptions[question.id]).map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </th>
        ))}
        <th key="score" className="px-6 py-4 text-left">
          <div className="space-y-2">
            {renderSortButton('score', 'Final Score')}
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-[#64748b]" />
              <select
                onChange={(e) => onQuestionFilter('score', e.target.value)}
                className="text-xs p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                defaultValue=""
              >
                <option value="">All scores</option>
                <option value="90-100">≥ 90% 🔥</option>
                <option value="75-89">75-89%</option>
                <option value="50-74">50-74%</option>
                <option value="0-49">less than 50%</option>
              </select>
            </div>
          </div>
        </th>
      </tr>
    </thead>
  );
}
