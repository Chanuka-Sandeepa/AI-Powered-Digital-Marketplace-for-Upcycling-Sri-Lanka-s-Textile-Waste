/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6fbf9',
          100: '#edf7f3',
          200: '#d2ecd5',
          300: '#a7dbbb',
          400: '#72c299',
          500: '#48a478',
          600: '#34865f',
          700: '#2a6c4e',
          800: '#22553f',
          900: '#1d4635',
          950: '#0f271d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
