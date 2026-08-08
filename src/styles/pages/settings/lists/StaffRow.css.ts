import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  borderBottom: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.75rem 0',
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const identity = style({ minWidth: 0 });

const truncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const name = style({
  ...truncate,
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const meta = style({
  ...truncate,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

/** Marks an account the server has deactivated; it can no longer sign in. */
export const inactiveTag = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
  color: solid(vars.rgb.danger),
});
