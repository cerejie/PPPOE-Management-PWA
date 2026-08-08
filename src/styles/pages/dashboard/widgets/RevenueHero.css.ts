import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { accentGradient } from '@/styles/global/Token.utils';

/**
 * The hero sits on the brand gradient in both themes, so its foreground is
 * deliberately white-on-gradient rather than a theme token — a token here would
 * flip to dark text on a surface that never becomes light.
 */
const onGradient = '#fff';
const veil = 'rgb(255 255 255 / 0.15)';

export const hero = style({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: vars.radius.xxl,
  backgroundImage: accentGradient,
  padding: '1.25rem',
  color: onGradient,
  boxShadow: vars.shadow.float,
});

/** Two discs bleeding off opposite corners, purely decorative. */
const blob = style({
  pointerEvents: 'none',
  position: 'absolute',
  height: '10rem',
  width: '10rem',
  borderRadius: vars.radius.pill,
});

export const blobLight = style([
  blob,
  { right: '-2.5rem', top: '-3.5rem', backgroundColor: 'rgb(255 255 255 / 0.1)' },
]);

export const blobDark = style([
  blob,
  { bottom: '-4rem', left: '-2rem', backgroundColor: 'rgb(0 0 0 / 0.1)' },
]);

export const headline = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const caption = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,
  color: 'rgb(255 255 255 / 0.75)',
});

export const amount = style({
  marginTop: '0.25rem',
  fontSize: '2.25rem',
  lineHeight: '2.5rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  fontVariantNumeric: 'tabular-nums',
});

export const addButton = style({
  display: 'flex',
  height: '2.75rem',
  width: '2.75rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: 'rgb(255 255 255 / 0.2)',
  color: onGradient,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  selectors: { '&:active': { opacity: 0.7 } },
});

export const pills = style({
  position: 'relative',
  marginTop: '1.25rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

const pillBase = style({
  borderRadius: vars.radius.pill,
  backgroundColor: veil,
  padding: '0.25rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 600,
  color: onGradient,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
});

export const pill = pillBase;

export const pillLink = style([pillBase, { selectors: { '&:active': { opacity: 0.7 } } }]);
