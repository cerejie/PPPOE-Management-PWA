import { style } from '@vanilla-extract/css';

/** Price and speed sit side by side — both are short numeric fields. */
export const pairGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.75rem',
});
