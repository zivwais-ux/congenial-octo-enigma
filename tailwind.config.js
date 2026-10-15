/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f1f3ff',
          100: '#e3e7ff',
          200: '#c9d0fe',
          300: '#a5affc',
          400: '#7f87f6',
          500: '#5f63ee',
          600: '#4c4be0',
          700: '#3f3cc4',
          800: '#35349e',
          900: '#2f307d',
        },
        stage: {
          DEFAULT: '#18181b',
          deep: '#111113',
          line: '#2a2a2f',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,24,27,0.04), 0 1px 3px rgba(24,24,27,0.06)',
        lift: '0 4px 12px -2px rgba(24,24,27,0.08), 0 2px 4px -2px rgba(24,24,27,0.06)',
        pop: '0 16px 40px -12px rgba(24,24,27,0.25), 0 4px 12px -4px rgba(24,24,27,0.1)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
};
