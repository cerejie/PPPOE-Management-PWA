import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, solid } from '@/common/styles/Token.utils';
import { field } from '@/common/styles/Form.css';

/** The amount is the number the operator checks against the cash in hand. */
export const amountInput = style([field, { fontSize: '1.125rem', fontWeight: 600 }]);

/** "Expires now / after this payment" — the reason the form is trusted. */
export const preview = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.75rem 1rem',
});

export const previewRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
});

export const previewRowSpaced = style([previewRow, { marginTop: '0.375rem' }]);

export const previewLabel = style({ color: solid(vars.rgb.fgMuted) });

export const previewValue = style({ fontWeight: 600, color: solid(vars.rgb.fg) });

export const previewValueNext = style({ fontWeight: 600, color: solid(vars.rgb.accentText) });

export const pausedNote = style({
  marginTop: '0.5rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.warn),
});

export const methodGrid = style({
  marginTop: '0.375rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '0.5rem',
});

const methodBase = style({
  minHeight: '46px',
  borderRadius: vars.radius.lg,
  padding: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'background-color 150ms, color 150ms',
  selectors: { '&:active': { opacity: 0.7 } },
});

export const methodButton = styleVariants({
  idle: [methodBase, { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) }],
  active: [
    methodBase,
    { backgroundImage: accentGradient, color: '#fff', boxShadow: vars.shadow.float },
  ],
});
