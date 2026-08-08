import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';
import { field } from '@/styles/global/Form.css';

export const section = style({
  marginTop: '1rem',
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1.25rem',
  boxShadow: vars.shadow.card,
});

export const header = style({
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const heading = style({
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: solid(vars.rgb.fg),
});

const statusPillBase = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
});

export const statusPill = styleVariants({
  connected: [statusPillBase, { backgroundColor: solid(vars.rgb.okSoft), color: solid(vars.rgb.ok) }],
  unreachable: [
    statusPillBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
});

export const intro = style({
  marginBottom: '1rem',
  fontSize: '0.75rem',
  lineHeight: 1.625,
  color: solid(vars.rgb.fgMuted),
});

export const checking = style({
  padding: '0.5rem 0',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

/* -- stored connection summary ------------------------------------------ */

export const summary = style({ marginBottom: '1rem' });

export const summaryRow = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  borderBottom: `1px solid ${alpha(vars.rgb.line, 0.6)}`,
  padding: '0.625rem 0',
  selectors: { '&:last-child': { borderBottom: 'none' } },
});

export const summaryLabel = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

export const summaryValue = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'right',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

/* -- messages ------------------------------------------------------------ */

const messageBase = style({
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
});

export const message = styleVariants({
  error: [messageBase, { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) }],
  success: [messageBase, { backgroundColor: solid(vars.rgb.okSoft), color: solid(vars.rgb.ok) }],
});

/** The stored-error banner sits above the form, so it needs the gap below it. */
export const storedError = style([message.error, { marginBottom: '1rem' }]);

/* -- form ---------------------------------------------------------------- */

export const hint = style({
  marginTop: '0.25rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const certField = style([field, { fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }]);

export const advancedToggle = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
});

export const checkboxRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.25rem 0',
});

export const checkbox = style({
  height: '1.25rem',
  width: '1.25rem',
  borderRadius: vars.radius.sm,
  borderColor: solid(vars.rgb.line),
  accentColor: solid(vars.rgb.accent),
});

export const checkboxLabel = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fg),
});

export const checkboxCaption = style({
  display: 'block',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

/** Low-emphasis text action — "Cancel", "Change credentials". */
export const textButton = style({
  width: '100%',
  padding: '0.5rem 0',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 500,
  color: solid(vars.rgb.fgMuted),
  selectors: { '&:disabled': { opacity: 0.4 } },
});
