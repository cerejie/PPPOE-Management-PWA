import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const list = style({ marginBottom: '1.25rem' });

const messageBase = style({
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
});

export const message = styleVariants({
  offline: [
    messageBase,
    { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) },
  ],
  error: [
    messageBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
  success: [messageBase, { backgroundColor: solid(vars.rgb.okSoft), color: solid(vars.rgb.ok) }],
});
