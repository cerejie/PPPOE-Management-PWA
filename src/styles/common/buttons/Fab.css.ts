import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { accentGradient } from '@/styles/global/Token.utils';

/**
 * Pinned inside the same app-width column as the content so it lines up with
 * the list edge on wide screens, and lifted clear of the floating tab bar.
 */
export const anchor = style({
  pointerEvents: 'none',
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 40,
  display: 'flex',
  justifyContent: 'center',
});

export const column = style({
  display: 'flex',
  width: '100%',
  maxWidth: vars.layout.appWidth,
  justifyContent: 'flex-end',
  padding: `0 1rem ${vars.space.aboveTabbar}`,
});

export const button = style({
  pointerEvents: 'auto',
  display: 'flex',
  height: '3.5rem',
  width: '3.5rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundImage: accentGradient,
  color: '#fff',
  boxShadow: vars.shadow.float,
  transition: 'transform 150ms',
  selectors: { '&:active': { transform: 'scale(0.9)' } },
});
