import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface OpenFeedbackProps {
  feedback: Array<Record<string, any>>;
}

export function OpenFeedback({ feedback }: OpenFeedbackProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Open Feedback</h2>

      <div className="space-y-4">
        {feedback.map((item, index) => {
          const isExpanded = expandedIndex === index;
          const commentKey = Object.keys(item).find(key => key !== 'ratings') || '';
          const comment = item[commentKey];

          return (
            <div key={index} className="border rounded-lg">
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-[#1e293b]">
                    Feedback #{index + 1}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#64748b]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#64748b]" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 py-3 border-t bg-gray-50">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-[#1e293b] mb-2">Ratings</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(item.ratings).map(([type, rating]) => (
                        <div key={type}>
                          <div className="text-sm text-[#64748b] capitalize">{type}</div>
                          <div className="font-medium text-[#1e293b]">{rating}/5</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#1e293b] mb-2">Comment</h4>
                    <p className="text-[#64748b] whitespace-pre-wrap">{comment}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
