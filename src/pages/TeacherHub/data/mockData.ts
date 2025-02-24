export const feedbackTrendsData = [
  {
    quiz: 'Quiz 1',
    min: 65,
    q1: 75,
    median: 82,
    q3: 88,
    max: 95,
    outliers: [60, 98]
  },
  {
    quiz: 'Quiz 2',
    min: 70,
    q1: 78,
    median: 85,
    q3: 90,
    max: 97,
    outliers: [65, 99]
  },
  {
    quiz: 'Quiz 3',
    min: 68,
    q1: 76,
    median: 83,
    q3: 89,
    max: 96,
    outliers: [62, 97]
  },
  {
    quiz: 'Quiz 4',
    min: 72,
    q1: 80,
    median: 86,
    q3: 91,
    max: 98,
    outliers: [67, 100]
  }
];

export const engagementData = [
  { month: 'Jan', engagement: 72 },
  { month: 'Feb', engagement: 75 },
  { month: 'Mar', engagement: 80 },
  { month: 'Apr', engagement: 78 },
  { month: 'May', engagement: 85 },
  { month: 'Jun', engagement: 88 },
];

export const topicPerformance = [
  { topic: 'JavaScript', avgScore: 85, improvement: 5, students: 120 },
  { topic: 'React', avgScore: 78, improvement: -2, students: 98 },
  { topic: 'Node.js', avgScore: 82, improvement: 3, students: 110 },
  { topic: 'SQL', avgScore: 88, improvement: 7, students: 105 },
  { topic: 'TypeScript', avgScore: 75, improvement: 4, students: 95 },
];

export const studentFeedback = [
  { 
    id: 1,
    student: 'Emma Thompson',
    topic: 'React Hooks',
    sentiment: 'positive',
    message: 'The practical exercises really helped understand the concepts better.',
    date: '2024-03-20',
    status: 'resolved'
  },
  {
    id: 2,
    student: 'Michael Chen',
    topic: 'TypeScript',
    sentiment: 'negative',
    message: 'Need more examples for advanced type concepts.',
    date: '2024-03-19',
    status: 'pending'
  },
  {
    id: 3,
    student: 'Sarah Johnson',
    topic: 'Node.js',
    sentiment: 'neutral',
    message: 'The pace was good but would like more hands-on projects.',
    date: '2024-03-18',
    status: 'in-progress'
  }
];
