import React, { useState } from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';

interface ImportFeedbackProps {
  onImport: (data: any[]) => Promise<void>;
}

export function ImportFeedback({ onImport }: ImportFeedbackProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const parseJSON = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);

          // Validate that it's an array
          if (!Array.isArray(json)) {
            throw new Error('File must contain a JSON array');
          }

          // Validate each feedback record
          json.forEach((record, index) => {
            if (!record.student_id) {
              throw new Error(`Missing student_id in record ${index + 1}`);
            }
            if (!record.rating_field || typeof record.rating_field !== 'object') {
              throw new Error(`Invalid rating_field in record ${index + 1}`);
            }
            if (!record.open_field || typeof record.open_field !== 'object') {
              throw new Error(`Invalid open_field in record ${index + 1}`);
            }
          });

          resolve(json);
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setPreview([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.json')) {
      setError('Please upload a JSON file');
      setFile(null);
      return;
    }

    try {
      const feedback = await parseJSON(selectedFile);
      setFile(selectedFile);
      setPreview(feedback);
    } catch (err: any) {
      setError(err.message);
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;

    try {
      setIsImporting(true);
      setError(null);
      await onImport(preview);
      setFile(null);
      setPreview([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Import Feedback</h3>

      {!file ? (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer rounded-md font-medium text-[#2563eb] hover:text-blue-500">
                <span>Upload a file</span>
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <span className="pl-1">or drag and drop</span>
            </div>
            <div className="text-xs text-gray-500">
              JSON file containing an array of feedback records
            </div>
            <div className="text-xs text-gray-500 mt-2 text-left">
              <div>Example format:</div>
              <div className="mt-1 bg-gray-50 p-2 rounded-md overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`[{
  "student_id": "64523",
  "rating_field": {
    "pace": 3,
    "comfort": 2,
    "challenge": 3
  },
  "open_field": {
    "comments": "Great quiz!"
  }
}]`}</pre>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-[#1e293b]">{file.name}</h4>
              <p className="text-sm text-[#64748b]">
                {preview.length} feedback records found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Feedback'}
              </button>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setError(null);
                }}
                className="p-2 text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Student ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Ratings</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-[#1e293b]">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-2 text-sm text-[#1e293b]">{item.student_id}</td>
                      <td className="px-4 py-2 text-sm text-[#1e293b]">
                        {JSON.stringify(item.rating_field)}
                      </td>
                      <td className="px-4 py-2 text-sm text-[#64748b]">
                        {JSON.stringify(item.open_field)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <div className="text-sm text-[#64748b] mt-2 px-4">
                  And {preview.length - 5} more records...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}
    </div>
  );
}
