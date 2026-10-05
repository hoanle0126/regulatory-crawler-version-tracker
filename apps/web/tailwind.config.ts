import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#0f172a',
        'surface-elevated': '#1e293b',
        'surface-border': '#334155',
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        diff: {
          addedBg: 'rgba(16, 185, 129, 0.15)',
          addedText: '#34d399',
          addedBorder: 'rgba(16, 185, 129, 0.3)',
          removedBg: 'rgba(244, 63, 94, 0.15)',
          removedText: '#fb7185',
          removedBorder: 'rgba(244, 63, 94, 0.3)',
          modifiedBg: 'rgba(245, 158, 11, 0.15)',
          modifiedText: '#fbbf24',
          modifiedBorder: 'rgba(245, 158, 11, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
