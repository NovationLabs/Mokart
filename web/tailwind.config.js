/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mokart: {
          dark: '#0a0a0a',
          surface: '#1e1e1e',
          accent: '#00f0ff',
          success: '#00ff41',
        }
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
