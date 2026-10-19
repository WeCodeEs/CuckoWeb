/** @type {import('tailwindcss').Config} */

// Edición limitada Día de Muertos / Halloween (temporal).
// Los colores salen de variables CSS definidas en src/index.css: el modo claro es la versión
// Día de Muertos y el modo oscuro (clase `dark`) es la versión Halloween. Los valores originales
// (azul grisáceo, grises neutros, #183542 de fondo oscuro) están anotados en index.css.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: v('white'),
        gray: {
          50: v('gray-50'),
          100: v('gray-100'),
          200: v('gray-200'),
          300: v('gray-300'),
          400: v('gray-400'),
          500: v('gray-500'),
          600: v('gray-600'),
          700: v('gray-700'),
          800: v('gray-800'),
          900: v('gray-900'),
        },
        primary: {
          DEFAULT: v('primary'),
          dark: v('primary-dark'),
          light: v('primary-light'),
        },
        secondary: {
          DEFAULT: v('secondary'),
          light: v('secondary-light'),
        },
        accent: v('accent'),
        dark: '#000000',
        // Dark mode specific colors
        darkbg: {
          DEFAULT: v('darkbg'),
          lighter: v('darkbg-lighter'),
          darker: v('darkbg-darker'),
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
