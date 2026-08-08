import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, solid } from '@/common/styles/Token.utils';
import { halo, signal } from '@/common/styles/Motion.css';

export const root = style({
  display: 'flex',
  minHeight: '100dvh',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: solid(vars.rgb.canvas),
});

export const brand = style({ position: 'relative' });

export const glow = style([
  halo,
  {
    position: 'absolute',
    inset: 0,
    borderRadius: vars.radius.xl,
    backgroundImage: accentGradient,
    filter: 'blur(16px)',
  },
]);

export const tile = style({
  position: 'relative',
  display: 'flex',
  height: '4rem',
  width: '4rem',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: '0.375rem',
  borderRadius: vars.radius.xl,
  backgroundImage: accentGradient,
  padding: '1rem',
  boxShadow: vars.shadow.float,
});

const barBase = style([
  signal,
  {
    width: '0.375rem',
    borderRadius: vars.radius.pill,
    backgroundColor: 'rgb(255 255 255 / 0.95)',
  },
]);

/** Four bars of rising height, staggered so they read as a meter filling. */
export const bar = styleVariants({
  1: [barBase, { height: '0.5rem' }],
  2: [barBase, { height: '0.875rem', animationDelay: '130ms' }],
  3: [barBase, { height: '1.25rem', animationDelay: '260ms' }],
  4: [barBase, { height: '1.75rem', animationDelay: '390ms' }],
});

export const wordmark = style({
  marginTop: '1.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});
