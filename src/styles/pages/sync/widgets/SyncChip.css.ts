import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const chip = style({
  display: 'flex',
  minHeight: '40px',
  alignItems: 'center',
  gap: '0.5rem',
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.375rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fg),
  selectors: { '&:active': { opacity: 0.7 } },
});

const dotBase = style({
  height: '0.5rem',
  width: '0.5rem',
  flexShrink: 0,
  borderRadius: vars.radius.pill,
});

export const dot = styleVariants({
  offline: [dotBase, { backgroundColor: solid(vars.rgb.fgMuted) }],
  busy: [dotBase, { backgroundColor: solid(vars.rgb.warn) }],
  synced: [dotBase, { backgroundColor: solid(vars.rgb.ok) }],
});

export const label = style({ fontWeight: 600 });

export const failedCount = style({
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.danger),
  padding: '0.125rem 0.375rem',
  fontSize: '10px',
  fontWeight: 700,
  color: '#fff',
});
