import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const toggleRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  cursor: 'pointer',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.875rem 1rem',
});

export const toggleLabel = style({
  display: 'block',
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const toggleHint = style({
  display: 'block',
  marginTop: '0.125rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const toggleInput = style({
  flexShrink: 0,
  width: '1.4rem',
  height: '1.4rem',
  accentColor: solid(vars.rgb.accent),
});
