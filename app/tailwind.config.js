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
          primary: '#22D3EE', // Ice Cyan
          secondary: '#A3E635', // Keep Lime as secondary if needed, or remove? Request says "Strictly use new Mokart V2 colors", but replace Lime with Ice Cyan. I will map Ice Cyan to primary.
          cyan: '#22D3EE',
          metallic: '#9ca3af',
        }
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-minimal': "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
