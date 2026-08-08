import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

export const nav = style({
  zIndex: 30,
  display: 'flex',
  flexShrink: 0,
  justifyContent: 'center',
});

/**
 * One padding-bottom owns the whole bottom offset (see --tabbar-dock); it must
 * not be combined with a separate safe-area padding, or the two add up and
 * float the bar too high.
 */
export const dock = style({
  width: '100%',
  maxWidth: vars.layout.appWidth,
  padding: `0 2.5rem ${vars.space.tabbarDock}`,
});

export const pill = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.125rem',
  borderRadius: vars.radius.xl,
  borderWidth: '1px',
  borderColor: alpha(vars.rgb.line, 0.8),
  backgroundColor: alpha(vars.rgb.surface, 0.85),
  padding: '0.375rem',
  boxShadow: vars.shadow.float,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
});

const tabBase = style({
  display: 'flex',
  minHeight: '52px',
  flex: 1,
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.25rem',
  borderRadius: vars.radius.lg,
  transition: 'background-color 150ms, color 150ms',
  selectors: { '&:active': { opacity: 0.6 } },
});

export const tab = styleVariants({
  active: [
    tabBase,
    { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) },
  ],
  inactive: [tabBase, { color: solid(vars.rgb.fgMuted) }],
});

export const tabLabel = style({
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: 1,
});
