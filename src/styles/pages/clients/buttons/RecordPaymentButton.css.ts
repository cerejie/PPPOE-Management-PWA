import { style } from '@vanilla-extract/css';
import { button as formButton } from '@/styles/global/Form.css';

export const button = style([formButton.primary, { marginTop: '1rem', gap: '0.5rem' }]);
