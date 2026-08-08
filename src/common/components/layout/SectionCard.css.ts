import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const section = style({
  marginTop: '1rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1.25rem',
  boxShadow: vars.shadow.card,
});

export const heading = style({
  marginBottom: '1rem',
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});
