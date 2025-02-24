import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
};

export type ThemePreset = {
  name: string;
  colors: Theme;
};

export const defaultThemes: ThemePreset[] = [
  {
    name: 'Default Blue',
    colors: {
      primary: '#2563eb',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0'
    }
  },
  {
    name: 'Forest',
    colors: {
      primary: '#059669',
      background: '#f0fdf4',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#dcfce7'
    }
  },
  {
    name: 'Royal Purple',
    colors: {
      primary: '#7c3aed',
      background: '#f5f3ff',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#ede9fe'
    }
  },
  {
    name: 'Sunset Orange',
    colors: {
      primary: '#ea580c',
      background: '#fff7ed',
      card: '#ffffff',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#fed7aa'
    }
  }
];

export const darkTheme: Theme = {
  primary: '#3b82f6',
  background: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155'
};

type ThemeContextType = {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
  isDark: boolean;
  toggleDark: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function applyTheme(colors: Theme) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Add or remove dark class from html element
  document.documentElement.classList.toggle('dark', colors === darkTheme);
}
