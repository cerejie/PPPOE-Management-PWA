import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

/** Sized and bordered to match the search field it sits beside. */
const base = style({
  display: 'flex',
  width: '2.875rem',
  flexShrink: 0,
  alignSelf: 'stretch',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.lg,
  borderWidth: '1px',
  borderColor: solid(vars.rgb.line),
  transition: 'background-color 150ms, color 150ms, border-color 150ms',
  selectors: { '&:active': { opacity: 0.7 } },
});

export const button = styleVariants({
  idle: [base, { backgroundColor: solid(vars.rgb.surface), color: solid(vars.rgb.fgMuted) }],
  active: [
    base,
    {
      backgroundColor: solid(vars.rgb.accentSoft),
      borderColor: solid(vars.rgb.accentSoft),
      color: solid(vars.rgb.accentText),
    },
  ],
});

const glyphBase = style({ transition: 'transform 150ms' });

export const glyph = styleVariants({
  upright: [glyphBase],
  flipped: [glyphBase, { transform: 'rotate(180deg)' }],
});
