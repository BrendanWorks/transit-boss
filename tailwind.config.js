/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Community Transit Official Brand Colors (from their website)
        'ct-blue': {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0079c1', // Community Transit official blue
          600: '#0066a3',
          700: '#004d7a',
          800: '#003352',
          900: '#001a29',
        },
        'ct-green': {
          50: '#e6f7f0',
          100: '#ccefe1',
          200: '#99dfc3',
          300: '#66cfa5',
          400: '#33bf87',
          500: '#00a651', // Community Transit secondary green
          600: '#008541',
          700: '#006331',
          800: '#004221',
          900: '#002110',
        },
        'ct-orange': {
          50: '#fff4e6',
          100: '#ffe9cc',
          200: '#ffd399',
          300: '#ffbd66',
          400: '#ffa733',
          500: '#ff8c00', // Community Transit accent orange
          600: '#cc7000',
          700: '#995400',
          800: '#663800',
          900: '#331c00',
        },
        'ct-gray': {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        },
        // King County Metro Brand Colors
        'kcm-navy': {
          50: '#f0f2f5',
          100: '#e1e5eb',
          200: '#c3cbd7',
          300: '#a5b1c3',
          400: '#8797af',
          500: '#697d9b',
          600: '#4b6387',
          700: '#2d4973',
          800: '#162944', // Primary King County Metro Navy
          900: '#0f1f33',
        },
        'kcm-orange': {
          50: '#fef4f0',
          100: '#fde9e1',
          200: '#fbd3c3',
          300: '#f9bda5',
          400: '#f7a787',
          500: '#f59169',
          600: '#f37b4b',
          700: '#f1652d',
          800: '#eb6209', // Primary King County Metro Orange
          900: '#d35808',
        },
        // Everett Transit Brand Colors
        'et-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#fc4c2f', // Primary Everett Transit Red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Sound Transit Brand Colors
        'st-blue': {
          50: '#f0f4f8',
          100: '#e1e9f1',
          200: '#c3d3e3',
          300: '#a5bdd5',
          400: '#87a7c7',
          500: '#6991b9',
          600: '#4b7bab',
          700: '#2d659d',
          800: '#002e6d', // Primary Sound Transit Wave Blue
          900: '#002558',
        },
        // Washington State Ferries Brand Colors
        'wsf-green': {
          50: '#f0f9f7',
          100: '#e1f3ef',
          200: '#c3e7df',
          300: '#a5dbcf',
          400: '#87cfbf',
          500: '#69c3af',
          600: '#4bb79f',
          700: '#2dab8f',
          800: '#007b5f', // Primary WA State Ferries Green
          900: '#006650',
        }
      },
      fontFamily: {
        'sans': ['Avenir', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'display': ['Avenir', 'system-ui', 'sans-serif'],
        'avenir': ['Avenir', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        'avenir-bold': '700',
        'avenir-heavy': '900',
      }
    },
  },
  plugins: [],
};