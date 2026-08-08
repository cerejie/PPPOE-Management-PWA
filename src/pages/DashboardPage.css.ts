import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

export const statGrid = style({
  marginTop: '1rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.75rem',
});

export const sectionHeader = style({
  margin: '1.75rem 0 0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

export const sectionTitle = style({
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});

export const sectionLink = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.accentText),
  selectors: { '&:active': { opacity: 0.6 } },
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.625rem',
});
