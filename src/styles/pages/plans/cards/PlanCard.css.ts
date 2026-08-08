import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

const surface = {
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1rem',
  boxShadow: vars.shadow.card,
} as const;

/** Read-only card for staff, who cannot edit plans. */
export const staticCard = style(surface);

/** The same card as a button, for a SuperAdmin. */
export const editableCard = style({
  ...surface,
  width: '100%',
  textAlign: 'left',
  transition: 'transform 150ms',
  selectors: { '&:active': { transform: 'scale(0.98)' } },
});

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const identity = style({ minWidth: 0 });

export const name = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '1rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const subscribers = style({
  marginTop: '0.125rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const pricing = style({ flexShrink: 0, textAlign: 'right' });

export const price = style({
  fontSize: '1.25rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  fontVariantNumeric: 'tabular-nums',
  color: solid(vars.rgb.fg),
});

export const period = style({
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const tags = style({
  marginTop: '0.75rem',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.375rem',
});

const tagBase = style({
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
});

export const tag = styleVariants({
  accent: [tagBase, { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) }],
  neutral: [tagBase, { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) }],
  warn: [tagBase, { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) }],
  danger: [tagBase, { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) }],
});
