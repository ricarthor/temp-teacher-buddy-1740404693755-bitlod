import React from 'react';
import { Upload, X, AlertTriangle } from 'lucide-react';
import type { QuizResponse } from '../../../../types/quiz';

interface QuizMetadata {
  title: string;
  topic: string;
  description: string;
}

interface ImportState {
  responses: QuizResponse[];
  validCount: number;
  invalidCount: number;
  isValidating: boolean;
  isImporting: boolean;
  metadata: QuizMetadata;
}

interface ImportFormProps {
  file: File | null;
  importState: ImportState;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMetadataChange: (field: keyof QuizMetadata, value: string) => void;
  onImport: () => Promise<void>;
  onClear: () => void;
  error: string | null;
}

export function ImportForm({
  file,
  importState,
  onFileChange,
  onMetadataChange,
  onImport,
  onClear,
  error
}: ImportFormProps) {
  if (file) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={importState.metadata.title}
              onChange={(e) => onMetadataChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="Enter quiz title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Topic
            </label>
            <input
              type="text"
              value={importState.metadata.topic}
              onChange={(e) => onMetadataChange('topic', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="Enter quiz topic"
              required
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1e293b] mb-2">
            Description
          </label>
          <textarea
            value={importState.metadata.description}
            onChange={(e) => onMetadataChange('description', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            placeholder="Enter quiz description"
            rows={3}
          />
        </div>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-[#1e293b]">{file.name}</h3>
              {importState.isValidating ? (
                <p className="text-sm text-[#64748b]">Validating data...</p>
              ) : (
                <div className="flex gap-4 mt-2">
                  <p className="text-sm">
                    <span className="text-green-600 font-medium">{importState.validCount}</span>
                    <span className="text-[#64748b] ml-1">valid rows</span>
                  </p>
                  {importState.invalidCount > 0 && (
                    <p className="text-sm">
                      <span className="text-red-600 font-medium">{importState.invalidCount}</span>
                      <span className="text-[#64748b] ml-1">invalid rows</span>
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!importState.isValidating && importState.validCount > 0 && (
                <button
                  onClick={onImport}
                  disabled={importState.isImporting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {importState.isImporting ? 'Importing...' : 'Import Valid Data'}
                </button>
              )}
              <button
                onClick={onClear}
                className="p-2 text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {importState.invalidCount > 0 && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-medium">Invalid Rows</h4>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-[#64748b]">Student ID</th>
                      <th className="px-4 py-2 text-left font-medium text-[#64748b]">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importState.responses
                      .filter(r => r.status === 'invalid')
                      .map((response, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="px-4 py-2 font-medium">{response.student_id}</td>
                          <td className="px-4 py-2 text-red-600">{response.error}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
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
              onChange={onFileChange}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          CSV file containing quiz responses
        </p>
      </div>
    </div>
  );
}
