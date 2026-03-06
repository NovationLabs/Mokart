/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs':  '375px',
      'sm':  '640px',
      'md':  '768px',
      'lg':  '1024px',
      'xl':  '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          green:  '#7bf8ac',        // Neon accent
          glow:   'rgba(123,248,172,0.35)',
          dark:   '#0d0f12',        // Page background
          card:   '#16181d',        // Card surface
          sub:    '#1c1f26',        // Icon containers / sub-sections
          muted:  '#94a3b8',        // Muted text (slate-400)
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
      borderRadius: {
        DEFAULT: '0.75rem',   // rounded-xl baseline
      },
      backgroundImage: {
        'grid-minimal': "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
