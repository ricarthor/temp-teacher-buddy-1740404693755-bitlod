import React from 'react';
import { RatingStats } from './RatingStats';
import { OpenFeedback } from './OpenFeedback';
import { CorrelationAnalysis } from './CorrelationAnalysis';

interface FeedbackOverviewProps {
  ratings: Record<string, { average: number; count: number }>;
  correlations: Record<string, Record<string, number>>;
  feedback: Array<{
    rating_field: Record<string, number>;
    open_field: Record<string, string>;
    created_at: string;
  }>;
  totalResponses: number;
}

export function FeedbackOverview({ ratings, correlations, feedback, totalResponses }: FeedbackOverviewProps) {
  // Log props for debugging
  console.log('FeedbackOverview props:', {
    ratings,
    correlations,
    feedbackCount: feedback.length,
    totalResponses
  });

  return (
    <div className="space-y-8">
      <RatingStats
        averageRatings={ratings}
        totalResponses={totalResponses}
      />
      
      
      
      <OpenFeedback feedback={feedback} />
    </div>
  );
}
