import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { accentGradient, solid } from '@/styles/global/Token.utils';

export const page = style({
  display: 'flex',
  minHeight: '100dvh',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: solid(vars.rgb.canvas),
  padding: `${vars.space.safeTop} 1.5rem ${vars.space.safeBottom}`,
});

export const container = style({
  margin: '0 auto',
  width: '100%',
  maxWidth: vars.layout.appWidth,
});

export const brand = style({ marginBottom: '2.5rem', textAlign: 'center' });

export const logo = style({
  margin: '0 auto 1.25rem',
  display: 'flex',
  height: '4rem',
  width: '4rem',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.xxl,
  backgroundImage: accentGradient,
  fontSize: '1.875rem',
  boxShadow: vars.shadow.float,
});

export const title = style({
  fontSize: '1.875rem',
  lineHeight: '2.25rem',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: solid(vars.rgb.fg),
});

export const tagline = style({
  marginTop: '0.375rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

/** Offline is expected here, so it reads as a warning, not a failure. */
export const offlineNotice = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.warnSoft),
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.warn),
});

export const footnote = style({
  marginTop: '2rem',
  textAlign: 'center',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});
