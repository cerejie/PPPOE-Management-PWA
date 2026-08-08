import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

const surface = {
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1rem',
  boxShadow: vars.shadow.card,
} as const;

/** Read-only card for staff, who cannot edit accounts. */
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

const truncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const name = style({
  ...truncate,
  fontSize: '1rem',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: solid(vars.rgb.fg),
});

const holderBase = style({
  ...truncate,
  marginTop: '0.125rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
});

export const holder = style([holderBase, { color: solid(vars.rgb.fgMuted) }]);

/** Dimmer still: an unassigned line is a fact, not a warning. */
export const holderEmpty = style([
  holderBase,
  { fontStyle: 'italic', color: solid(vars.rgb.fgMuted), opacity: 0.75 },
]);

const stateBase = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
});

export const state = styleVariants({
  enabled: [stateBase, { backgroundColor: solid(vars.rgb.okSoft), color: solid(vars.rgb.ok) }],
  disabled: [
    stateBase,
    { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) },
  ],
});

export const tags = style({
  marginTop: '0.75rem',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '0.375rem',
});

const tagBase = style({
  maxWidth: '100%',
  ...truncate,
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
});

export const tag = styleVariants({
  neutral: [tagBase, { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) }],
  warn: [tagBase, { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) }],
  danger: [tagBase, { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) }],
});
