import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';
import { fadeIn, sheetIn } from '@/common/styles/Motion.css';

export const root = style({
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
});

export const backdrop = style([
  fadeIn,
  {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgb(0 0 0 / 0.5)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
]);

export const panel = style([
  sheetIn,
  {
    position: 'relative',
    zIndex: 10,
    maxHeight: '92dvh',
    width: '100%',
    maxWidth: vars.layout.appWidth,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    borderTopLeftRadius: vars.radius.xxl,
    borderTopRightRadius: vars.radius.xxl,
    borderTopWidth: '1px',
    borderTopColor: solid(vars.rgb.line),
    backgroundColor: solid(vars.rgb.surface),
    padding: `0.75rem 1.25rem calc(1.75rem + ${vars.space.safeBottom})`,
  },
]);

/** Full-width hit area for the grab handle, bled out over the panel padding. */
export const handleZone = style({
  margin: '-0.75rem -1.25rem 0',
  padding: '0.75rem 1.25rem 0.25rem',
  touchAction: 'none',
});

export const handle = style({
  margin: '0 auto',
  height: '0.375rem',
  width: '2.75rem',
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.line),
});

export const title = style({
  marginTop: '0.75rem',
  fontSize: '1.25rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});

export const subtitle = style({
  marginTop: '0.25rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

export const content = style({ marginTop: '1.25rem' });
