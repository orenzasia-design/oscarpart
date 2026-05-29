/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4fb',
          100: '#d4e5f5',
          200: '#a9cbeb',
          300: '#7aafd9',
          400: '#4d8fc4',
          500: '#2a6fac',
          600: '#1a3a5c',   // primary
          700: '#163050',
          800: '#122644',
          900: '#0d1c34',
        },
        accent: {
          DEFAULT: '#c0392b',
          light:   '#e74c3c',
          dark:    '#922b21',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card:    '#ffffff',
          border:  '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)',
        lg:   '0 4px 16px -2px rgba(0,0,0,.12)',
      },
      animation: {
        'fade-in':   'fadeIn .15s ease-out',
        'slide-up':  'slideUp .2s ease-out',
        'pulse-dot': 'pulseDot 1.5s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                    to: { opacity: '1' } },
        slideUp:  { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.4' } },
      },
    },
  },
  plugins: [],
};
