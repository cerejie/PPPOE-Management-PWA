import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const button = style({
  display: 'flex',
  height: '2.5rem',
  width: '2.5rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  color: solid(vars.rgb.fgMuted),
  selectors: { '&:active': { backgroundColor: solid(vars.rgb.surface2) } },
});
