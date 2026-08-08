import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { accentGradient, solid } from '@/styles/global/Token.utils';

/** Horizontal, edge-to-edge chip row. Scrolls rather than wraps on a phone. */
export const bar = style({
  display: 'flex',
  gap: '0.5rem',
  overflowX: 'auto',
  paddingBottom: '0.25rem',
  // Hidden in both engines: WebKit ignores scrollbar-width, and an overlay rail
  // here reads as a second scrollbar beside the page's own.
  scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});

const chipBase = style({
  minHeight: '38px',
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  padding: '0.375rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'background-color 150ms, color 150ms',
  selectors: { '&:active': { opacity: 0.7 } },
});

/**
 * `raised` sits on the page background and needs its own elevation; `flat` sits
 * inside a card or sheet, where a shadow would look like a second surface.
 */
export const chip = styleVariants({
  raisedIdle: [
    chipBase,
    {
      backgroundColor: solid(vars.rgb.surface),
      color: solid(vars.rgb.fgMuted),
      boxShadow: vars.shadow.card,
    },
  ],
  raisedActive: [
    chipBase,
    { backgroundImage: accentGradient, color: '#fff', boxShadow: vars.shadow.float },
  ],
  flatIdle: [
    chipBase,
    { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) },
  ],
  flatActive: [chipBase, { backgroundImage: accentGradient, color: '#fff' }],
});
