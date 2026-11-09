/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B818F',
          dark: '#183542',
          light: '#139FAA',
        },
        secondary: {
          DEFAULT: '#49BCCE',
          light: '#B3E1E4',
        },
        accent: '#F07122',
        dark: '#000000',
        // Dark mode specific colors
        darkbg: {
          DEFAULT: '#183542',
          lighter: '#1F4456',
          darker: '#132A36',
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'dark': '0 2px 15px -3px rgba(0, 0, 0, 0.2), 0 10px 20px -2px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};