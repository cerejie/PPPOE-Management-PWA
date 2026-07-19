/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single calm accent used across the app.
        accent: {
          DEFAULT: '#2563eb',
          soft: '#eff6ff',
          text: '#1d4ed8',
        },
        // Status colours.
        ok: '#16a34a',
        warn: '#d97706',
        danger: '#dc2626',
        muted: '#64748b',
      },
      maxWidth: {
        app: '480px',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
