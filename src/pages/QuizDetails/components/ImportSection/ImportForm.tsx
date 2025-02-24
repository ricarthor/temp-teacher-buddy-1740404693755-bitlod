// src/pages/QuizDetails/components/ImportSection/ImportForm.tsx
import React from 'react';
import { Upload, X } from 'lucide-react';
import { FileUpload } from './FileUpload';

interface ImportFormProps {
  answersFile: File | null;
  questionsFile: File | null;
  onAnswersFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuestionsFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => Promise<void>;
  importState: {
    isImporting: boolean;
    error: string | null;
    success: boolean;
  };
}

export function ImportForm({
  answersFile,
  questionsFile,
  onAnswersFileChange,
  onQuestionsFileChange,
  onImport,
  importState
}: ImportFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          title="Import Questions (JSON)"
          accept=".json"
          file={questionsFile}
          onChange={onQuestionsFileChange}
        />
        <FileUpload
          title="Import Answers (CSV)"
          accept=".csv"
          file={answersFile}
          onChange={onAnswersFileChange}
        />
      </div>

      {importState.error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {importState.error}
        </div>
      )}

      {importState.success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          Data imported successfully!
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onImport}
          disabled={importState.isImporting || (!answersFile && !questionsFile)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {importState.isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
