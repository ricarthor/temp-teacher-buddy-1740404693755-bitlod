import React, { useEffect, useState } from 'react';
import { ThemeContext, ThemePreset, defaultThemes, darkTheme, applyTheme } from '../lib/theme';

const THEME_KEY = 'quiz-app-theme';
const DARK_MODE_KEY = 'quiz-app-dark-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved ? JSON.parse(saved) : defaultThemes[0];
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return saved ? JSON.parse(saved) : prefersDark;
  });

  const setTheme = (newTheme: ThemePreset) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
  };

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem(DARK_MODE_KEY, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    applyTheme(isDark ? darkTheme : theme.colors);
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}
