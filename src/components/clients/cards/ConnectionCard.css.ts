import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { alpha, solid } from '@/common/styles/Token.utils';

export const card = style({
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1.25rem',
  boxShadow: vars.shadow.card,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const status = style({ minWidth: 0 });

export const statusLine = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

const dotBase = style({
  height: '0.625rem',
  width: '0.625rem',
  flexShrink: 0,
  borderRadius: vars.radius.pill,
});

export const dot = styleVariants({
  live: [
    dotBase,
    {
      backgroundColor: solid(vars.rgb.ok),
      boxShadow: `0 0 0 4px ${alpha(vars.rgb.ok, 0.2)}`,
    },
  ],
  idle: [dotBase, { backgroundColor: alpha(vars.rgb.fgMuted, 0.4) }],
});

const statusLabelBase = style({
  fontSize: '1.125rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
});

export const statusLabel = styleVariants({
  live: [statusLabelBase, { color: solid(vars.rgb.ok) }],
  idle: [statusLabelBase, { color: solid(vars.rgb.fgMuted) }],
});

export const since = style({
  marginTop: '0.25rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

/** Stands in for the toggle while paused — Resume is the only way back online. */
export const pausedHint = style({
  flexShrink: 0,
  textAlign: 'right',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
});

const toggleBase = style({
  minHeight: '48px',
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1.25rem',
  fontWeight: 600,
  color: '#fff',
  boxShadow: vars.shadow.float,
  selectors: {
    '&:active:not(:disabled)': { opacity: 0.8 },
    '&:disabled': { opacity: 0.5 },
  },
});

export const toggle = styleVariants({
  disconnect: [toggleBase, { backgroundColor: solid(vars.rgb.danger) }],
  connect: [toggleBase, { backgroundColor: solid(vars.rgb.ok) }],
});

const noticeBase = style({
  marginTop: '1rem',
  borderRadius: vars.radius.lg,
  padding: '0.5rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 500,
});

export const notice = styleVariants({
  pending: [
    noticeBase,
    { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) },
  ],
  unapplied: [
    noticeBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
});
