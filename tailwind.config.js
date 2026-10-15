/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Hebrew"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // צבע הדגשה יחיד: כתום-אות, לסימוני הערות ולאינדיקציות בלבד
        signal: {
          50: '#fff4ee',
          100: '#ffe4d4',
          200: '#ffc6a6',
          400: '#ff7a42',
          500: '#f45a16',
          600: '#d9480b',
          700: '#b3390c',
        },
        ink: '#1c1917',
        stage: {
          DEFAULT: '#1a1918',
          deep: '#141312',
          line: '#2b2927',
        },
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28,25,23,0.05)',
        pop: '0 12px 32px -8px rgba(28,25,23,0.22), 0 2px 6px -2px rgba(28,25,23,0.08)',
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs: ['12px', '16px'],
        sm: ['13px', '20px'],
        base: ['14px', '22px'],
      },
    },
  },
  plugins: [],
};
