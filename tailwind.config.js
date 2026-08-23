/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.html"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B4332',
          dark: '#163A29',
          light: '#3E6B56'
        },
        brass: {
          DEFAULT: '#C9972F',
          light: '#D9AE4A',
          dark: '#B6862A'
        },
        paper: {
          DEFAULT: '#F5EFE6',
          dark: '#EDE3D2',
          card: '#FFFFFF'
        },
        ink: {
          DEFAULT: '#1B2A22',
          light: '#4A5A50'
        },
        clay: '#9E4A4A',
        sage: '#3E6B56'
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}