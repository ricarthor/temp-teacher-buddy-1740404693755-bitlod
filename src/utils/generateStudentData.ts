import { faker } from '@faker-js/faker';
import type { Student } from '../types/student';

export function generateStudentData(count: number): Student[] {
  return Array.from({ length: count }, (_, index) => {
    const averageScore = faker.number.int({ min: 60, max: 98 });
    const quizzesTaken = faker.number.int({ min: 5, max: 15 });
    const isPositive = faker.datatype.boolean();
    const trendValue = faker.number.int({ min: 2, max: 8 });
    
    // Calculate if student should be flagged based on performance
    const shouldFlag = averageScore < 75 || quizzesTaken < 8;
    const flags = shouldFlag ? [
      {
        type: averageScore < 75 ? 'performance' : 'engagement',
        description: averageScore < 75 
          ? 'Performance below expected threshold'
          : 'Low quiz participation rate',
        severity: averageScore < 70 || quizzesTaken < 6 ? 'high' : 'medium'
      }
    ] : undefined;

    return {
      id: `STU${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('(###) ###-####'),
      enrollmentDate: faker.date.between({ 
        from: '2023-09-01', 
        to: '2024-01-15' 
      }).toISOString().split('T')[0],
      status: faker.helpers.arrayElement(['active', 'active', 'active', 'inactive']),
      academicRecord: {
        averageScore,
        quizzesTaken,
        lastQuizDate: faker.date.recent({ days: 14 }).toISOString().split('T')[0],
        trend: {
          value: trendValue,
          isPositive
        }
      },
      flags
    };
  });
}
