import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';
import { fadeIn, sheetIn } from '@/styles/global/Motion.css';

export const root = style({
  position: 'fixed',
  inset: 0,
  // Above the sheet, which a confirm can be raised from.
  zIndex: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 1.5rem',
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
    width: '100%',
    maxWidth: '24rem',
    borderRadius: vars.radius.xl,
    backgroundColor: solid(vars.rgb.surface),
    padding: '1.5rem',
    boxShadow: vars.shadow.float,
  },
]);

export const title = style({
  fontSize: '1.125rem',
  lineHeight: '1.75rem',
  fontWeight: 700,
  color: solid(vars.rgb.fg),
});

export const message = style({
  marginTop: '0.5rem',
  fontSize: '0.875rem',
  lineHeight: 1.625,
  color: solid(vars.rgb.fgMuted),
});

export const actions = style({
  marginTop: '1.5rem',
  display: 'flex',
  gap: '0.75rem',
});

const actionBase = style({
  minHeight: '48px',
  flex: 1,
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1rem',
  fontWeight: 600,
  selectors: { '&:disabled': { opacity: 0.4, cursor: 'not-allowed' } },
});

export const cancel = style([
  actionBase,
  {
    backgroundColor: solid(vars.rgb.surface2),
    color: solid(vars.rgb.fg),
    selectors: { '&:active:not(:disabled)': { opacity: 0.7 } },
  },
]);

export const confirm = style([
  actionBase,
  {
    backgroundColor: solid(vars.rgb.danger),
    color: '#fff',
    selectors: { '&:active:not(:disabled)': { opacity: 0.8 } },
  },
]);
