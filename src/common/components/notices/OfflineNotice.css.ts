import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const notice = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.warnSoft),
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.warn),
});
