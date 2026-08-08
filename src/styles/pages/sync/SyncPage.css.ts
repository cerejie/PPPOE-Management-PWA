import { style } from '@vanilla-extract/css';
import { button } from '@/styles/global/Form.css';

export const flushButton = style([button.primary, { marginBottom: '1rem' }]);

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
});
