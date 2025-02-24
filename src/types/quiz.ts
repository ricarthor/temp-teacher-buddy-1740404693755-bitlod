export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'code-interpretation';
  options?: string[];
  correctAnswer: string | boolean;
  codeLanguage?: string;
  codeSnippet?: string;
  tags: string[]; // Add tags here
}

export interface QuizResponse {
  questionId: string;
  answer: string | boolean;
}

export interface QuizFeedback {
  pace: number;       // 1-5 scale
  difficulty: number; // 1-5 scale
  comfort: number;    // 1-5 scale
  continue: string;
  start: string;
  stop: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  description: string;
  questions: QuizQuestion[];
  dueDate: string;
  createdAt: string;
}

export interface StudentAnswer {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string;
  responses: QuizResponse[];
}

export interface StudentFeedback {
  submissionId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  feedback: QuizFeedback;
}

export interface QuizMetrics {
  score: number;
  completedAt: string;
  correctAnswers: number;
  totalQuestions: number;
}

export interface StudentFlag {
  type: 'performance' | 'feedback' | 'engagement';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface FlaggedStudent {
  studentId: string;
  studentName: string;
  flags: StudentFlag[];
}

export interface QuizStats {
  averageScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  totalSubmissions: number;
  feedbackMetrics: {
    averagePace: number;
    averageDifficulty: number;
    averageComfort: number;
  };
}

export const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'sql', label: 'SQL' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' }
] as const;
