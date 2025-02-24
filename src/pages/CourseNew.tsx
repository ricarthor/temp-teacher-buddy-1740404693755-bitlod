import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Upload, X } from 'lucide-react';

interface CSVStudent {
  name: string;
  email: string;
  student_id: string;
}

// Helper function to format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper function to get default dates
function getDefaultDates() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 7); // Start date is 1 week from now
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 4); // End date is 4 months after start date
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
}

export function CourseNew() {
  const navigate = useNavigate();
  const defaultDates = getDefaultDates();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate
  });
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVStudent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = async (file: File): Promise<CSVStudent[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n');
          
          // Skip the first line (header)
          const dataLines = lines.slice(1);
          
          const students: CSVStudent[] = dataLines
            .filter(line => line.trim()) // Skip empty lines
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              
              // Expected format from the example:
              // [activities, code, name, program, year, status1, status2, status3, email, student_id]
              const name = values[2];
              const email = values[8];
              const student_id = values[9];

              if (!name || !email || !student_id) {
                throw new Error('Invalid CSV format: name, email, and student_id are required for all students');
              }

              return {
                name,
                email,
                student_id
              };
            });

          resolve(students);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setCsvPreview([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file');
      setFile(null);
      return;
    }

    try {
      const students = await parseCSV(selectedFile);
      setFile(selectedFile);
      setCsvPreview(students);
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to create a course');
      }

      // Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: formData.name,
          description: formData.description,
          start_date: formData.startDate,
          end_date: formData.endDate,
          user_id: session.user.id
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Process CSV if provided
      if (file && csvPreview.length > 0) {
        try {
          // Log the data being sent
          console.log('Importing students:', {
            courseId: courseData.id,
            students: csvPreview
          });

          // Call the import_course_students function
          const { data: importData, error: importError } = await supabase
            .rpc('import_course_students', {
              p_course_id: courseData.id,
              p_students: csvPreview
            });

          console.log('Import result:', { data: importData, error: importError });

          if (importError) throw importError;

          // Verify the import by checking course_students
          const { data: verifyData, error: verifyError } = await supabase
            .from('course_students')
            .select('*')
            .eq('course_id', courseData.id);

          console.log('Verification result:', { data: verifyData, error: verifyError });

          if (verifyError) throw verifyError;

          if (!verifyData || verifyData.length === 0) {
            throw new Error('Students were not properly linked to the course');
          }

          // Check import results for any errors
          if (importData?.imported_students) {
            const errors = (importData.imported_students as any[])
              .filter(result => result.status === 'error')
              .map(result => `Student ${result.student_id}: ${result.error}`);
            
            if (errors.length > 0) {
              throw new Error(`Failed to import some students:\n${errors.join('\n')}`);
            }
          }

        } catch (err: any) {
          // If there's an error with student import, delete the course
          await supabase
            .from('courses')
            .delete()
            .eq('id', courseData.id);
          
          throw new Error(`Error importing students: ${err.message}`);
        }
      }

      navigate('/courses');
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setCsvPreview([]);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1e293b] mb-8">Create New Course</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Course Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            placeholder="Enter course name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            placeholder="Enter course description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Start Date
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              min={formatDate(new Date())} // Can't start before today
              onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
            <p className="mt-1 text-sm text-[#64748b]">
              Suggested: 1 week from today
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              End Date
            </label>
            <input
              type="date"
              required
              value={formData.endDate}
              min={formData.startDate} // Can't end before start date
              onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
            <p className="mt-1 text-sm text-[#64748b]">
              Suggested: 4 months from start date
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Import Students (CSV)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-[#2563eb] hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                CSV file with columns: Code, Student, Course, Year/Sem., Student status, Status, Student type, Institutional Email, Código Aluno
              </p>
            </div>
          </div>
        </div>

        {file && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-[#1e293b]">Preview: {file.name}</h3>
                <p className="text-sm text-[#64748b]">
                  {csvPreview.length} students found
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-2 text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Student ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(0, 5).map((student, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-2 text-sm text-[#1e293b]">{student.student_id}</td>
                      <td className="px-4 py-2 text-sm text-[#1e293b]">{student.name}</td>
                      <td className="px-4 py-2 text-sm text-[#64748b]">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvPreview.length > 5 && (
                <p className="text-sm text-[#64748b] mt-2 px-4">
                  And {csvPreview.length - 5} more students...
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
