import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, solid } from '@/common/styles/Token.utils';

export const card = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1.25rem',
  boxShadow: vars.shadow.card,
});

export const avatar = style({
  display: 'flex',
  height: '3.5rem',
  width: '3.5rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundImage: accentGradient,
  fontSize: '1.125rem',
  fontWeight: 700,
  color: '#fff',
});

export const identity = style({ minWidth: 0, flex: 1 });

const truncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const name = style({
  ...truncate,
  fontSize: '1.125rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
  color: solid(vars.rgb.fg),
});

export const meta = style({
  ...truncate,
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});
