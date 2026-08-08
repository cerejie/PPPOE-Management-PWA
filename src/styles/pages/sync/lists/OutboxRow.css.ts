import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';

export const card = style({
  borderRadius: vars.radius.xxl,
  backgroundColor: solid(vars.rgb.surface),
  padding: '1rem',
  boxShadow: vars.shadow.card,
});

export const header = style({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const identity = style({ minWidth: 0 });

export const title = style({ fontWeight: 600, color: solid(vars.rgb.fg) });

export const subject = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.fgMuted),
});

const statusBase = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
});

/**
 * `pending` retries on its own; `failed` was rejected by the server and waits
 * for a person. The colours have to make that difference obvious.
 */
export const status = styleVariants({
  pending: [statusBase, { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) }],
  failed: [
    statusBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
});

export const error = style({
  marginTop: '0.75rem',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.5rem 0.75rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.danger),
});

export const actions = style({ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' });

const actionBase = style({
  minHeight: '46px',
  flex: 1,
  borderRadius: vars.radius.lg,
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  selectors: { '&:active': { opacity: 0.7 } },
});

export const action = styleVariants({
  retry: [
    actionBase,
    { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) },
  ],
  discard: [
    actionBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
});
