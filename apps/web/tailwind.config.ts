import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#f8f6f0',
          surface: '#fcfbfa',
          warm: '#f3efe6',
          panel: '#fdfdfc',
          base: '#f8f6f0',
          50: '#fcfbfa',
          100: '#f8f6f0',
          200: '#f3efe6',
          300: '#eae4d7',
          400: '#ded6c5',
          500: '#cebeaa',
        },
        ink: {
          primary: '#1e1c18',
          secondary: '#46423a',
          muted: '#7f796d',
          faint: '#9d9688',
          950: '#141311',
          900: '#1e1c18',
          800: '#2e2c26',
          700: '#46423a',
          600: '#625d52',
          500: '#7f796d',
          400: '#9d9688',
          300: '#c0b9ab',
          200: '#dbd6cb',
          100: '#eae7df',
        },
        rule: {
          DEFAULT: '#e2ddd2',
          light: '#ebe7de',
          subtle: '#ebe7de',
          strong: '#ccc6b8',
        },
        seal: {
          DEFAULT: '#193354', // Official legal navy
          primary: '#193354',
          secondary: '#132842',
          hover: '#132842',
          burgundy: '#7a1c1d', // Formal state seal red
          amber: '#8c5600',
        },
        diff: {
          addedBg: '#edf6ee',
          addedInk: '#166534',
          addedBorder: '#bbf7d0',
          removedBg: '#fdf2f2',
          removedInk: '#991b1b',
          removedBorder: '#fecaca',
          modifiedBg: '#fefce8',
          modifiedInk: '#854d0e',
          modifiedBorder: '#fef08a',
          'insert-text': '#166534',
          'delete-text': '#991b1b',
        },
      },
      fontFamily: {
        serif: [
          'Charter',
          'Bitstream Charter',
          'Sitka Text',
          'Cambria',
          'Iowan Old Style',
          'Times New Roman',
          'Georgia',
          'serif',
        ],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
