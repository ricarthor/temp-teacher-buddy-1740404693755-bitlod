import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // Light theme (white background)
// Import language support
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
}

export function CodeEditor({ value, onChange, language, placeholder }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef<HTMLElement>(null);

  // Re-highlight code whenever value or language changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [value, language]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Handle tab key to insert two spaces
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      // Set the cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative font-mono text-sm">
      {/* Hidden textarea for input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
        className="absolute inset-0 w-full h-full resize-none overflow-auto bg-transparent text-transparent caret-black z-10 p-4 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
        style={{ minHeight: '200px' }}
      />
      {/* Code preview */}
      <pre
        className="w-full h-full overflow-auto rounded-lg p-4 border border-gray-200"
        style={{ minHeight: '200px', margin: 0, backgroundColor: 'white' }} // Force white background
      >
        <code
          ref={codeRef}
          className={`language-${language}`}
          style={{ display: 'block', backgroundColor: 'white' }}
        >
          {value || ' '}
        </code>
      </pre>
    </div>
  );
}
