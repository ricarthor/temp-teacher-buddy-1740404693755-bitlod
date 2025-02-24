import type { QuizResponse } from '../types/quiz';

interface ParsedResponse {
  student_id: string;
  responses: {
    questionId: string;
    answer: string;
  }[];
  status?: 'valid' | 'invalid';
  error?: string;
}

export async function parseCSV(file: File): Promise<ParsedResponse[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        // Validate required headers
        const requiredHeaders = ['student_id', 'question_id', 'selected_answer'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }

        // Process data rows
        const responses: ParsedResponse[] = [];
        const currentResponse: { [key: string]: ParsedResponse } = {};

        lines.slice(1)
          .filter(line => line.trim())
          .forEach(line => {
            const values = line.split(',').map(v => v.trim());
            const rowData: { [key: string]: string } = {};
            
            headers.forEach((header, index) => {
              rowData[header] = values[index];
            });

            const studentId = rowData.student_id;
            if (!currentResponse[studentId]) {
              currentResponse[studentId] = {
                student_id: studentId,
                responses: []
              };
            }

            currentResponse[studentId].responses.push({
              questionId: rowData.question_id,
              answer: rowData.selected_answer // Map selected_answer to answer
            });
          });

        resolve(Object.values(currentResponse));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function validateResponses(responses: ParsedResponse[]): Promise<ParsedResponse[]> {
  return responses.map(response => {
    // Validate student ID format (non-empty string)
    if (!response.student_id || response.student_id.trim() === '') {
      return {
        ...response,
        status: 'invalid',
        error: 'Invalid student ID'
      };
    }

    // Validate responses
    if (!Array.isArray(response.responses) || response.responses.length === 0) {
      return {
        ...response,
        status: 'invalid',
        error: 'No valid responses found'
      };
    }

    // Check if all responses have required fields
    const invalidResponse = response.responses.find(
      r => !r.questionId || !r.answer
    );

    if (invalidResponse) {
      return {
        ...response,
        status: 'invalid',
        error: 'Invalid response format'
      };
    }

    return {
      ...response,
      status: 'valid'
    };
  });
}
