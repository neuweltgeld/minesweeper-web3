/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'typing': {
          '0%': { width: '0' },
          '85%': { width: '100%' },
          '100%': { width: '0' }
        },
        'blink': {
          '50%': { borderColor: 'transparent' }
        }
      },
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'typing': 'typing 6s steps(40, end) infinite, blink .75s step-end infinite',
      },
    },
  },
  plugins: [],
} 