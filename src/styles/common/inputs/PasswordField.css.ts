import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';
import { field as formField } from '@/styles/global/Form.css';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const field = style([formField, { flex: 1, minWidth: 0 }]);

export const reveal = style({
  flexShrink: 0,
  // Matches the field's own top gap and height, so the pair reads as one control.
  marginTop: '0.375rem',
  minHeight: '52px',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: solid(vars.rgb.fgMuted),
  selectors: { '&:active': { opacity: 0.7 } },
});
