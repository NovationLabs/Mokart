/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral racing-dark canvas with a restrained lime accent.
        mokart: {
          bg: '#0b0d0c',
          bg2: '#101310',
          surface: '#141715',
          surface2: '#1b1f1b',
          line: '#30362f',
          moss: '#5d685a',
          primary: '#a3e635',
          glow: '#c8f36d',
          // legacy aliases kept so older pages keep compiling
          dark: '#0b0d0c',
          darker: '#0b0d0c',
          metallic: '#a3a9a0',
        },
      },
      fontFamily: {
        display: ['Iliad', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
