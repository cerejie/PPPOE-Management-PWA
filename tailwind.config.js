/** @type {import('tailwindcss').Config} */

/** Resolve a theme token from index.css while keeping Tailwind opacity modifiers. */
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: token('--canvas'),
        surface: {
          DEFAULT: token('--surface'),
          2: token('--surface-2'),
        },
        line: token('--line'),

        // Text
        fg: token('--fg'),
        muted: token('--fg-muted'),

        // Brand
        accent: {
          DEFAULT: token('--accent'),
          2: token('--accent-2'),
          soft: token('--accent-soft'),
          text: token('--accent-text'),
        },

        // Status
        ok: {
          DEFAULT: token('--ok'),
          soft: token('--ok-soft'),
        },
        warn: {
          DEFAULT: token('--warn'),
          soft: token('--warn-soft'),
        },
        danger: {
          DEFAULT: token('--danger'),
          soft: token('--danger-soft'),
        },
      },
      backgroundImage: {
        'accent-gradient':
          'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      maxWidth: {
        app: '480px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        // Clearance for the floating tab bar: bar height + gap + safe area.
        'tabbar': 'calc(5.5rem + env(safe-area-inset-bottom))',
        'above-tabbar': 'calc(6.25rem + env(safe-area-inset-bottom))',
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
