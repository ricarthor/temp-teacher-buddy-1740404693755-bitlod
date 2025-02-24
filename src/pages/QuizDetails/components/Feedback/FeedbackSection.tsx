import React, { useState, useEffect } from 'react';
import { FeedbackOverview } from './FeedbackOverview';
import { ImportFeedback } from './ImportFeedback';
import { supabase } from '../../../../lib/supabase';

interface FeedbackSectionProps {
  quizId: string;
}

export function FeedbackSection({ quizId }: FeedbackSectionProps) {
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quizId) {
      fetchFeedback();
    }
  }, [quizId]);

  const fetchFeedback = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching feedback for quiz:', quizId);

      const { data, error: feedbackError } = await supabase
        .rpc('get_imported_feedback', { p_quiz_id: quizId });

      if (feedbackError) {
        console.error('Supabase error:', feedbackError);
        throw feedbackError;
      }

      console.log('Feedback data:', data);

      if (!data) {
        console.log('No feedback found for quiz:', quizId);
        setFeedbackData({
          ratings: {},
          feedback: [],
          total_responses: 0
        });
        return;
      }

      setFeedbackData(data);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (feedbackData: any[]) => {
    try {
      const { data, error } = await supabase
        .rpc('import_quiz_feedback', {
          p_quiz_id: quizId,
          p_feedback: feedbackData
        });

      if (error) throw error;

      // Refresh feedback data after import
      await fetchFeedback();

      return data;
    } catch (err) {
      console.error('Error importing feedback:', err);
      throw err;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#1e293b] mb-6">Student Feedback</h2>
      
      <ImportFeedback onImport={handleImport} />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error Loading Feedback</h3>
          <p>{error}</p>
        </div>
      ) : feedbackData ? (
        <FeedbackOverview 
          ratings={feedbackData.ratings}
          correlations={{}} // We'll handle correlations later if needed
          feedback={feedbackData.feedback}
          totalResponses={feedbackData.total_responses}
        />
      ) : null}
    </div>
  );
}
