import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, solid } from '@/common/styles/Token.utils';

export const form = style({ flex: 1 });

export const error = style({
  marginTop: '0.5rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.danger),
});

export const actions = style({
  marginTop: '0.5rem',
  display: 'flex',
  gap: '0.5rem',
});

const actionBase = style({
  minHeight: '40px',
  flex: 1,
  borderRadius: vars.radius.md,
  padding: '0 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  selectors: {
    '&:active:not(:disabled)': { opacity: 0.7 },
    '&:disabled': { opacity: 0.5 },
  },
});

export const save = style([actionBase, { backgroundImage: accentGradient, color: '#fff' }]);

export const cancel = style([
  actionBase,
  { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) },
]);
