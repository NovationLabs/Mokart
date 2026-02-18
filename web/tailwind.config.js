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
          darker: '#050505',
          surface: '#121212',
          primary: '#A3E635', // Lime Green
          secondary: '#22D3EE', // Ice Cyan
          metallic: '#9ca3af',
        }
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backgroundImage: {
        'carbon-mesh': "repeating-linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), repeating-linear-gradient(45deg, #111 25%, #0a0a0a 25%, #0a0a0a 75%, #111 75%, #111)",
      }
    },
  },
  plugins: [],
}
