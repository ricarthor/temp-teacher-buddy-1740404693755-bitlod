import { Quiz, QuizResponse, StudentAnswer, StudentFeedback, QuizStats } from '../types/quiz';

export function calculateQuizScore(quiz: Quiz, responses: QuizResponse[]): number {
  const totalQuestions = quiz.questions.length;
  const correctAnswers = responses.filter((response) => {
    const question = quiz.questions.find((q) => q.id === response.questionId);
    return question?.correctAnswer === response.answer;
  }).length;

  return (correctAnswers / totalQuestions) * 100;
}

export function calculateClassStats(answers: StudentAnswer[], quiz: Quiz): QuizStats {
  const scores = answers.map((answer) => calculateQuizScore(quiz, answer.responses));
  
  return {
    averageScore: scores.reduce((acc, score) => acc + score, 0) / scores.length,
    medianScore: calculateMedian(scores),
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    totalSubmissions: answers.length,
    feedbackMetrics: {
      averagePace: 0,
      averageDifficulty: 0,
      averageComfort: 0
    }
  };
}

export function analyzeFeedbackTrends(feedback: StudentFeedback[]) {
  const totalFeedback = feedback.length;
  if (totalFeedback === 0) {
    return {
      averagePace: 0,
      averageDifficulty: 0,
      averageComfort: 0
    };
  }

  const totals = feedback.reduce(
    (acc, item) => {
      acc.pace += item.feedback.pace;
      acc.difficulty += item.feedback.difficulty;
      acc.comfort += item.feedback.comfort;
      return acc;
    },
    { pace: 0, difficulty: 0, comfort: 0 }
  );

  return {
    averagePace: totals.pace / totalFeedback,
    averageDifficulty: totals.difficulty / totalFeedback,
    averageComfort: totals.comfort / totalFeedback
  };
}

// Helper function to calculate median
function calculateMedian(numbers: number[]): number {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}
