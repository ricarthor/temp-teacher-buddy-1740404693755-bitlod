/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        'lg': '12px',
        'xl': '12px',
      },
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
        card: 'var(--color-card)',
        text: 'var(--color-text)',
        textSecondary: 'var(--color-textSecondary)',
        border: 'var(--color-border)',
      },
    },
  },
  plugins: [],
};
