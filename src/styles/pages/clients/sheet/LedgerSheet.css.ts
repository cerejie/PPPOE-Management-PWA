import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';
import { bar as chipBar } from '@/styles/common/buttons/FilterChip.css';

export const placeholder = style({
  padding: '3rem 0',
  textAlign: 'center',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

/* -- totals ------------------------------------------------------------- */

export const totals = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.5rem',
});

export const totalCard = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.75rem 1rem',
});

export const totalLabel = style({
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.025em',
  color: solid(vars.rgb.fgMuted),
});

export const totalValue = style({
  marginTop: '0.125rem',
  fontSize: '1.125rem',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  color: solid(vars.rgb.fg),
});

/* -- filters ------------------------------------------------------------ */

/** Bled out over the sheet padding so the row can scroll edge to edge. */
export const filterBar = style([
  chipBar,
  { margin: '1rem -0.25rem 0', paddingLeft: '0.25rem', paddingRight: '0.25rem' },
]);

/* -- rows --------------------------------------------------------------- */

export const list = style({ marginTop: '0.25rem' });

export const row = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem',
  borderBottom: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.75rem 0',
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

const badgeBase = style({
  marginTop: '0.125rem',
  display: 'flex',
  height: '2rem',
  width: '2rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  fontSize: '0.75rem',
  fontWeight: 700,
});

export const kindBadge = styleVariants({
  payment: [
    badgeBase,
    { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) },
  ],
  connection: [
    badgeBase,
    { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) },
  ],
  pause: [badgeBase, { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) }],
});

export const rowBody = style({ minWidth: 0, flex: 1 });

export const rowTitle = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

const rowFlagBase = style({ marginLeft: '0.5rem', fontSize: '11px', fontWeight: 500 });

export const rowFlag = styleVariants({
  pending: [rowFlagBase, { color: solid(vars.rgb.warn) }],
  failed: [rowFlagBase, { color: solid(vars.rgb.danger) }],
});

export const rowDetail = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

const rowAmountBase = style({
  flexShrink: 0,
  alignSelf: 'center',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
});

export const rowAmount = styleVariants({
  positive: [rowAmountBase, { color: solid(vars.rgb.fg) }],
  negative: [rowAmountBase, { color: solid(vars.rgb.danger) }],
});

export const rowDelete = style({
  marginRight: '-0.375rem',
  display: 'flex',
  height: '2rem',
  width: '2rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  borderRadius: vars.radius.pill,
  color: solid(vars.rgb.fgMuted),
  selectors: {
    '&:active': {
      backgroundColor: solid(vars.rgb.dangerSoft),
      color: solid(vars.rgb.danger),
    },
  },
});

/* -- footer ------------------------------------------------------------- */

export const alert = style({
  marginTop: '0.75rem',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.danger),
});

export const truncationNotice = style({
  marginTop: '0.5rem',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.75rem 1rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const exportButton = style({
  marginTop: '1rem',
  display: 'flex',
  minHeight: '52px',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.875rem 1rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
  selectors: {
    '&:active:not(:disabled)': { opacity: 0.7 },
    '&:disabled': { opacity: 0.5 },
  },
});
