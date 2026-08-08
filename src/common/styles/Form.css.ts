import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { accentGradient, alpha, solid } from '@/common/styles/Token.utils';

// Shared form styling, so every input in the app looks identical and the theme
// tokens are only wired up once.

export const label = style({
  display: 'block',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
});

export const input = style({
  display: 'block',
  width: '100%',
  borderRadius: vars.radius.lg,
  borderWidth: '1px',
  borderColor: solid(vars.rgb.line),
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  color: solid(vars.rgb.fg),
  outline: 'none',
  transition: 'border-color 150ms, background-color 150ms, box-shadow 150ms',
  selectors: {
    '&::placeholder': { color: alpha(vars.rgb.fgMuted, 0.7) },
    '&:focus': {
      borderColor: solid(vars.rgb.accent),
      backgroundColor: solid(vars.rgb.surface),
      boxShadow: `0 0 0 4px ${alpha(vars.rgb.accent, 0.15)}`,
    },
  },
});

/** An input with the standard gap under its label. */
export const field = style([input, { marginTop: '0.375rem' }]);

/**
 * Selects need room for the chevron drawn in Global.css.ts, and should read as
 * a button rather than a text box.
 */
export const select = style([
  field,
  {
    cursor: 'pointer',
    paddingRight: '2.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

const buttonBase = style({
  display: 'flex',
  minHeight: '52px',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  fontWeight: 600,
  transition: 'opacity 150ms',
  selectors: {
    '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
  },
});

export const button = styleVariants({
  primary: [
    buttonBase,
    {
      backgroundImage: accentGradient,
      color: '#fff',
      boxShadow: vars.shadow.float,
      selectors: {
        '&:active:not(:disabled)': { opacity: 0.8 },
        '&:disabled': { opacity: 0.4, boxShadow: 'none' },
      },
    },
  ],
  secondary: [
    buttonBase,
    {
      backgroundColor: solid(vars.rgb.surface2),
      color: solid(vars.rgb.fg),
      selectors: {
        '&:active:not(:disabled)': { opacity: 0.7 },
      },
    },
  ],
  danger: [
    buttonBase,
    {
      backgroundColor: solid(vars.rgb.dangerSoft),
      color: solid(vars.rgb.danger),
      selectors: {
        '&:active:not(:disabled)': { opacity: 0.7 },
      },
    },
  ],
});

/** Card surface used for every grouped block of content. */
export const card = style({
  borderRadius: vars.radius.xl,
  backgroundColor: solid(vars.rgb.surface),
  boxShadow: vars.shadow.card,
});

/** Vertical rhythm for a form's fields — the old `space-y-4`. */
export const stack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
});

/** Tighter variant for grouped rows inside a card. */
export const stackTight = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
});

/** The "(optional)" qualifier inside a label. */
export const optional = style({
  fontWeight: 400,
  color: alpha(vars.rgb.fgMuted, 0.7),
});

/** Helper text under a field. */
export const hint = style({
  marginTop: '0.375rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

/** Inline validation / server rejection message. */
export const errorAlert = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.danger),
});

/** Neutral explanatory block, e.g. what a pause will do. */
export const infoPanel = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface2),
  padding: '0.875rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

/** A value called out inside body copy. */
export const emphasis = style({
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const paragraphGap = style({ marginTop: '0.5rem' });
