import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

export const root = style({ position: 'relative' });

export const icon = style({
  pointerEvents: 'none',
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  color: solid(vars.rgb.fgMuted),
});

export const input = style({
  display: 'block',
  width: '100%',
  borderRadius: vars.radius.lg,
  borderWidth: '1px',
  borderColor: solid(vars.rgb.line),
  backgroundColor: solid(vars.rgb.surface),
  padding: '0.75rem 1rem 0.75rem 2.75rem',
  fontSize: '1rem',
  color: solid(vars.rgb.fg),
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
  selectors: {
    '&::placeholder': { color: alpha(vars.rgb.fgMuted, 0.7) },
    '&:focus': {
      borderColor: solid(vars.rgb.accent),
      boxShadow: `0 0 0 4px ${alpha(vars.rgb.accent, 0.15)}`,
    },
  },
});
