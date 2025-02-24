export interface CourseAnalytics {
  active_students: number;
  ratings_summary: {
    average_ratings: number;
    total_ratings: number;
  };
  feedback_summary: {
    total_responses: number;
  };
}
