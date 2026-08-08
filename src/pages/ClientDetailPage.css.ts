import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';
import { button } from '@/common/styles/Form.css';

export const editButton = style({
  display: 'flex',
  height: '2.5rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
  selectors: { '&:active': { opacity: 0.6 } },
});

export const recordPaymentButton = style([button.primary, { marginTop: '1rem', gap: '0.5rem' }]);

export const sectionTitle = style({
  margin: '1.75rem 0 0.5rem',
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});
