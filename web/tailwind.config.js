/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark-green canvas system. `bg` is the dominant surface, `accent`
        // is the single locked signal-green used across the whole page.
        mokart: {
          bg: '#04130c',        // dominant canvas — deep racing green
          bg2: '#061a10',       // alternating section tone
          surface: '#0a2315',   // panels
          surface2: '#0c2a19',  // elevated panels
          line: '#16412b',      // hairline green
          moss: '#1f7a4d',      // mid green for fills
          primary: '#7bf8ac',   // accent / signal green (brand)
          glow: '#adffce',      // bright highlight
          // legacy aliases kept so older pages keep compiling
          dark: '#04130c',
          darker: '#04130c',
          metallic: '#8fb4a1',
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
