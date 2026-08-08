import { keyframes, style } from '@vanilla-extract/css';

const reduced = '(prefers-reduced-motion: reduce)';

/** Bottom sheets and dialogs share one entrance so they feel like one system. */
const sheetInFrames = keyframes({
  from: { transform: 'translateY(6%)', opacity: 0.6 },
  to: { transform: 'translateY(0)', opacity: 1 },
});

const fadeInFrames = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

/** App-open splash: bars rise in sequence like a signal meter filling. */
const signalFrames = keyframes({
  '0%, 100%': { transform: 'scaleY(0.3)', opacity: 0.5 },
  '45%': { transform: 'scaleY(1)', opacity: 1 },
});

const haloFrames = keyframes({
  '0%, 100%': { transform: 'scale(0.9)', opacity: 0.2 },
  '50%': { transform: 'scale(1.15)', opacity: 0.45 },
});

/**
 * Reduced-motion fallback for the splash only. It still has to read as
 * "working", so it drops to a plain fade rather than to a static image with no
 * sign of progress.
 */
const breatheFrames = keyframes({
  '0%, 100%': { opacity: 0.45 },
  '50%': { opacity: 1 },
});

export const sheetIn = style({
  animation: `${sheetInFrames} 260ms cubic-bezier(0.22, 1, 0.36, 1)`,
  '@media': {
    [reduced]: { animation: 'none' },
  },
});

export const fadeIn = style({
  animation: `${fadeInFrames} 180ms ease-out`,
  '@media': {
    [reduced]: { animation: 'none' },
  },
});

export const signal = style({
  transformOrigin: 'bottom',
  animation: `${signalFrames} 1.1s ease-in-out infinite`,
  '@media': {
    [reduced]: {
      transform: 'none',
      animation: `${breatheFrames} 2s ease-in-out infinite`,
    },
  },
});

export const halo = style({
  animation: `${haloFrames} 2.4s ease-in-out infinite`,
  '@media': {
    [reduced]: {
      transform: 'none',
      animation: `${breatheFrames} 2s ease-in-out infinite`,
    },
  },
});
