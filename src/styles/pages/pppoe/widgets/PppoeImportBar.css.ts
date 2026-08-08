import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

/**
 * The trailing 1rem is this widget's own: `Screen` gives its body no `gap`, so
 * each stacked block owns the space beneath it. A module-local widget carries
 * that itself; a shared component (SearchInput) gets wrapped by the page.
 */
export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
});

export const button = style({
  display: 'flex',
  minHeight: '44px',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface),
  padding: '0.625rem 1rem',
  fontSize: '0.9375rem',
  fontWeight: 600,
  color: solid(vars.rgb.accentText),
  boxShadow: vars.shadow.card,
  transition: 'opacity 150ms',
  selectors: {
    '&:active:not(:disabled)': { opacity: 0.7 },
    '&:disabled': { opacity: 0.45, cursor: 'not-allowed' },
  },
});

const message = {
  fontSize: '0.75rem',
  lineHeight: '1rem',
} as const;

export const hint = style({ ...message, color: solid(vars.rgb.fgMuted) });

export const success = style({ ...message, color: solid(vars.rgb.ok) });

export const error = style({
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.625rem 0.875rem',
  fontSize: '0.8125rem',
  lineHeight: '1.125rem',
  color: solid(vars.rgb.danger),
});
