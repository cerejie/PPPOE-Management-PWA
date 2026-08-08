import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { alpha, solid } from '@/common/styles/Token.utils';

export const button = style({
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: '0.75rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1rem',
  textAlign: 'left',
  boxShadow: vars.shadow.card,
  selectors: { '&:active': { backgroundColor: solid(vars.rgb.surface2) } },
});

export const text = style({ minWidth: 0, flex: 1 });

export const title = style({
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const summary = style({
  marginTop: '0.125rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const latest = style({
  flexShrink: 0,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 600,
  color: solid(vars.rgb.fgMuted),
});

export const chevron = style({
  flexShrink: 0,
  color: alpha(vars.rgb.fgMuted, 0.6),
});
