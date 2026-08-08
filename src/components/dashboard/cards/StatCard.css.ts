import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const card = style({
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1rem',
  textAlign: 'left',
  boxShadow: vars.shadow.card,
  transition: 'transform 150ms',
  selectors: { '&:active': { transform: 'scale(0.97)' } },
});

const dotBase = style({
  display: 'inline-block',
  height: '0.5rem',
  width: '0.5rem',
  borderRadius: vars.radius.pill,
});

export const dot = styleVariants({
  ok: [dotBase, { backgroundColor: solid(vars.rgb.ok) }],
  muted: [dotBase, { backgroundColor: solid(vars.rgb.fgMuted) }],
  warn: [dotBase, { backgroundColor: solid(vars.rgb.warn) }],
  danger: [dotBase, { backgroundColor: solid(vars.rgb.danger) }],
});

const valueBase = style({
  marginTop: '0.5rem',
  fontSize: '1.875rem',
  lineHeight: '2.25rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  fontVariantNumeric: 'tabular-nums',
});

export const value = styleVariants({
  ok: [valueBase, { color: solid(vars.rgb.ok) }],
  muted: [valueBase, { color: solid(vars.rgb.fg) }],
  warn: [valueBase, { color: solid(vars.rgb.warn) }],
  danger: [valueBase, { color: solid(vars.rgb.danger) }],
});

export const label = style({
  marginTop: '0.125rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
});
