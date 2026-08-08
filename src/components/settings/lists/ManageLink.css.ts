import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { alpha, solid } from '@/common/styles/Token.utils';

export const link = style({
  display: 'flex',
  minHeight: '60px',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  borderBottom: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.75rem 0',
  selectors: {
    '&:last-child': { borderBottom: 'none' },
    '&:active': { opacity: 0.6 },
  },
});

export const text = style({ display: 'block', minWidth: 0 });

export const label = style({
  display: 'block',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const hint = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const chevron = style({
  flexShrink: 0,
  color: solid(vars.rgb.fgMuted),
});
