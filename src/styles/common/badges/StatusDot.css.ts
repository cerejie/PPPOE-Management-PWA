import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

const dotBase = style({
  display: 'inline-block',
  height: '0.625rem',
  width: '0.625rem',
  flexShrink: 0,
  borderRadius: vars.radius.pill,
});

export const dot = styleVariants({
  connected: [
    dotBase,
    {
      backgroundColor: solid(vars.rgb.ok),
      boxShadow: `0 0 0 4px ${alpha(vars.rgb.ok, 0.2)}`,
    },
  ],
  disconnected: [dotBase, { backgroundColor: alpha(vars.rgb.fgMuted, 0.4) }],
});
