// src/pages/QuizDetails/components/Feedback/OpenFeedback.tsx
import React, { useState, useMemo } from 'react';
import { MessageSquare, ChevronDown, Filter } from 'lucide-react';

interface OpenFeedbackProps {
  feedback: Array<{
    rating_field: Record<string, number>;
    open_field: Record<string, string>;
    created_at: string;
  }>;
}

export function OpenFeedback({ feedback }: OpenFeedbackProps) {
  const [displayCount, setDisplayCount] = useState(5);
  const [filters, setFilters] = useState<Record<string, number | null>>({});

  // Filter feedback to only include items with non-empty open fields
  const feedbackWithComments = feedback.filter(item => {
    return Object.values(item.open_field).some(value => value.trim() !== '');
  });

  // Get all possible rating types from the feedback
  const ratingTypes = useMemo(() => {
    const types = new Set<string>();
    feedbackWithComments.forEach(item => {
      Object.keys(item.rating_field).forEach(key => types.add(key));
    });
    return Array.from(types).sort();
  }, [feedbackWithComments]);

  // Apply filters to feedback
  const filteredFeedback = useMemo(() => {
    return feedbackWithComments.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null) return true;
        return item.rating_field[key] === value;
      });
    });
  }, [feedbackWithComments, filters]);

  const hasMore = displayCount < filteredFeedback.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1e293b]">Written Feedback</h2>
        <div className="text-sm text-[#64748b]">
          {filteredFeedback.length} responses with comments
        </div>
      </div>

      {feedbackWithComments.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#1e293b]">
                    Student ID
                  </th>
                  {ratingTypes.map(type => (
                    <th key={type} className="px-4 py-3 text-left text-sm font-medium text-[#1e293b]">
                      <div className="space-y-2">
                        <div className="capitalize">{type}</div>
                        <select
                          value={filters[type]?.toString() ?? ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            [type]: e.target.value === '' ? null : Number(e.target.value)
                          }))}
                          className="text-xs p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb] w-full"
                        >
                          <option value="">All</option>
                          {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#1e293b]">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFeedback.slice(0, displayCount).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-[#1e293b]">
                      {item.student_id}
                    </td>
                    {ratingTypes.map(type => (
                      <td key={type} className="px-4 py-4 text-sm text-[#1e293b]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {item.rating_field[type] || '—'}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        {Object.entries(item.open_field).map(([key, value]) => (
                          value.trim() && (
                            <div key={key}>
                              <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
                                {key}
                              </div>
                              <div className="text-sm text-[#1e293b]">{value}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setDisplayCount(prev => prev + 5)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                Show More ({filteredFeedback.length - displayCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No written feedback yet</h3>
          <p className="text-[#64748b]">Students haven't provided any written comments</p>
        </div>
      )}
    </div>
  );
}
