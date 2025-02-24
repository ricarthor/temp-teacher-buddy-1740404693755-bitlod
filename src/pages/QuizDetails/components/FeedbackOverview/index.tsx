// src/pages/QuizDetails/components/FeedbackOverview/index.tsx
import React from 'react';

interface FeedbackOverviewProps {
  feedback: Array<{
    open_field: Record<string, string>;
    rating_fields: Record<string, number>;
  }>;
}

export function FeedbackOverview({ feedback }: FeedbackOverviewProps) {
  console.log('FeedbackOverview rendered with feedback:', feedback);

  return (
    <div className="p-4 bg-white rounded-lg">
      <h2 className="text-xl font-semibold mb-4">hello from the component</h2>
      <p>This is the Feedback tab content.</p>
      {/* If you want, you can render actual feedback data here */}
    </div>
  );
}
