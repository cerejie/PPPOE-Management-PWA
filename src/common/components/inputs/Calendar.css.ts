import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, alpha, solid } from '@/common/styles/Token.utils';

export const root = style({ padding: '0.75rem' });

export const header = style({
  marginBottom: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
});

export const monthLabel = style({
  paddingLeft: '0.25rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const navGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
});

export const navButton = style({
  display: 'flex',
  height: '2.25rem',
  width: '2.25rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  color: solid(vars.rgb.fgMuted),
  transition: 'background-color 150ms, color 150ms',
  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: solid(vars.rgb.surface2),
      color: solid(vars.rgb.fg),
    },
    '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
  },
});

export const navIcon = style({ height: '1rem', width: '1rem' });

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '0.125rem',
});

export const weekday = style({
  paddingBottom: '0.25rem',
  textAlign: 'center',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: solid(vars.rgb.fgMuted),
});

const dayBase = style({
  display: 'flex',
  height: '2.25rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.md,
  fontSize: '0.875rem',
  transition: 'background-color 150ms, color 150ms',
  selectors: {
    '&:disabled': { pointerEvents: 'none', opacity: 0.25 },
  },
});

const hoverable = {
  selectors: {
    '&:hover:not(:disabled)': { backgroundColor: solid(vars.rgb.surface2) },
  },
} as const;

export const day = styleVariants({
  selected: [
    dayBase,
    {
      backgroundImage: accentGradient,
      fontWeight: 600,
      color: '#fff',
      boxShadow: vars.shadow.float,
    },
  ],
  today: [
    dayBase,
    {
      fontWeight: 600,
      color: solid(vars.rgb.accentText),
      boxShadow: `inset 0 0 0 1px ${alpha(vars.rgb.accent, 0.6)}`,
      ...hoverable,
    },
  ],
  inMonth: [dayBase, { color: solid(vars.rgb.fg), ...hoverable }],
  outsideMonth: [dayBase, { color: alpha(vars.rgb.fgMuted, 0.5), ...hoverable }],
});

export const footer = style({
  marginTop: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderTopWidth: '1px',
  borderTopColor: solid(vars.rgb.line),
  paddingTop: '0.5rem',
});

export const clearButton = style({
  borderRadius: vars.radius.sm,
  padding: '0.25rem 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
  transition: 'color 150ms',
  selectors: { '&:hover': { color: solid(vars.rgb.fg) } },
});

export const todayButton = style({
  borderRadius: vars.radius.sm,
  padding: '0.25rem 0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: solid(vars.rgb.accentText),
  transition: 'opacity 150ms',
  selectors: {
    '&:hover:not(:disabled)': { opacity: 0.7 },
    '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
  },
});
