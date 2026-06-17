/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mokart: {
          dark: '#0d0f12',
          darker: '#0d0f12',
          surface: '#121212',
          primary: '#7bf8ac',
          metallic: '#9ca3af',
        }
      },
      fontFamily: {
        display: ['Iliad', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backgroundImage: {
        'carbon-mesh': "repeating-linear-gradient(45deg, #111 25%, transparent 25%, transparent 75%, #111 75%, #111), repeating-linear-gradient(45deg, #111 25%, #0d0f12 25%, #0d0f12 75%, #111 75%, #111)",
      }
    },
  },
  plugins: [],
}
