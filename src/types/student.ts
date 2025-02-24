export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  status: 'active' | 'inactive';
  academicRecord: {
    averageScore: number;
    quizzesTaken: number;
    lastQuizDate: string;
    trend: {
      value: number;
      isPositive: boolean;
    };
  };
  flags?: {
    type: 'performance' | 'engagement' | 'feedback';
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}
