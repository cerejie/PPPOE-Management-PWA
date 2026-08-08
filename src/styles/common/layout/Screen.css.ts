import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

/**
 * min-height: 100% — not 100dvh. The shell already owns the viewport height and
 * this fills its scroll container, so a short screen does not become scrollable
 * by a tab bar's worth of empty space.
 */
export const root = style({
  display: 'flex',
  minHeight: '100%',
  flexDirection: 'column',
  backgroundColor: solid(vars.rgb.canvas),
});

export const header = style({
  position: 'sticky',
  top: 0,
  zIndex: 20,
  borderBottomWidth: '1px',
  borderBottomColor: alpha(vars.rgb.line, 0.7),
  backgroundColor: alpha(vars.rgb.canvas, 0.8),
  paddingTop: vars.space.safeTop,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
});

export const headerInner = style({
  margin: '0 auto',
  display: 'flex',
  minHeight: '60px',
  width: '100%',
  maxWidth: vars.layout.appWidth,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  padding: '0.5rem 1rem',
});

export const titleGroup = style({
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: '0.375rem',
});

export const backButton = style({
  marginLeft: '-0.5rem',
  display: 'flex',
  height: '2.5rem',
  width: '2.5rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.surface2),
  color: solid(vars.rgb.fg),
  selectors: { '&:active': { opacity: 0.6 } },
});

export const titleText = style({ minWidth: 0 });

const truncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const eyebrow = style({
  ...truncate,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
});

export const title = style({
  ...truncate,
  fontSize: '1.25rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});

export const actions = style({
  display: 'flex',
  flexShrink: 0,
  alignItems: 'center',
  gap: '0.5rem',
});

export const body = style({
  margin: '0 auto',
  width: '100%',
  maxWidth: vars.layout.appWidth,
  flex: 1,
  padding: `1rem 1rem ${vars.space.tabbar}`,
});
