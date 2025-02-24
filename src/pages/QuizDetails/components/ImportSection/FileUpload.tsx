import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  title: string;
  accept: string;
  file: File | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUpload({ title, accept, file, onChange }: FileUploadProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-[#1e293b]">{title}</h3>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <label className="cursor-pointer">
            <span className="text-[#2563eb] hover:text-blue-500">Choose file</span>
            <input
              type="file"
              accept={accept}
              onChange={onChange}
              className="hidden"
            />
          </label>
          {file && (
            <p className="text-sm text-[#64748b]">{file.name}</p>
          )}
        </div>
      </div>
    </div>
  );
}
