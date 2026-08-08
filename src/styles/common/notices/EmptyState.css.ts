import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const card = style({
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '2.5rem',
  textAlign: 'center',
  boxShadow: vars.shadow.card,
});

export const icon = style({ fontSize: '1.875rem', lineHeight: '2.25rem' });

export const title = style({
  marginTop: '0.75rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const message = style({
  marginTop: '0.25rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});
