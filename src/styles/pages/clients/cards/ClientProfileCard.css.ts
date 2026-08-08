import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

export const card = style({
  marginTop: '0.75rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '0.25rem 1.25rem',
  boxShadow: vars.shadow.card,
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  borderBottom: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.75rem 0',
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const label = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

export const value = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'right',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

/** The expiry value, which pairs its date with a badge. */
export const expiryValue = style([
  value,
  { display: 'flex', alignItems: 'center', gap: '0.5rem' },
]);

export const notes = style({
  borderTop: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.75rem 0',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});
