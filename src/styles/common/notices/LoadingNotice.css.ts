import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const notice = style({
  padding: '4rem 0',
  textAlign: 'center',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});
