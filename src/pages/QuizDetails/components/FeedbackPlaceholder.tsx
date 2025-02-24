import React from 'react';
import { MessageSquare } from 'lucide-react';

export function FeedbackPlaceholder() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-[#1e293b]">Student Feedback</h2>
      </div>

      <div className="text-center py-8">
        <p className="text-[#64748b]">
          This is a placeholder for the feedback tab. The actual feedback data will be displayed here.
        </p>
        <p className="text-[#64748b] mt-2">
          Table: students_feedback
          <br />
          Columns: open_field (JSON), rating_fields (JSON)
        </p>
      </div>
    </div>
  );
}
