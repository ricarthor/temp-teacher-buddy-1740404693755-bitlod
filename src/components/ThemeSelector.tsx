import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { useTheme, defaultThemes } from '../lib/theme';

export function ThemeSelector() {
  const { theme, setTheme, isDark, toggleDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="relative" ref={menuRef}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Change theme"
        >
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        {isOpen && (
          <div 
            className="absolute left-full top-0 ml-2 bg-card rounded-lg shadow-lg border border-default p-2 min-w-[200px] z-[100]"
          >
            <div className="space-y-2">
              {defaultThemes.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setTheme(preset);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                    theme.name === preset.name
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span>{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={toggleDark}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </div>
  );
}
