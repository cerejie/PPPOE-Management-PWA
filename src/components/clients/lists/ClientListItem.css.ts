import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const link = style({
  display: 'flex',
  minHeight: '72px',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '0.75rem 1rem',
  boxShadow: vars.shadow.card,
  transition: 'transform 150ms',
  selectors: { '&:active': { transform: 'scale(0.98)' } },
});

export const identity = style({
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: '0.75rem',
});

export const text = style({ minWidth: 0 });

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

export const badges = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  gap: '0.375rem',
});
