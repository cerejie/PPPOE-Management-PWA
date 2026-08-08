import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { alpha, solid } from '@/common/styles/Token.utils';

export const row = style({
  display: 'flex',
  alignItems: 'center',
  selectors: { '&:not(:first-child)': { borderTop: `1px solid ${solid(vars.rgb.line)}` } },
});

export const open = style({
  display: 'flex',
  minHeight: '56px',
  flex: 1,
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.625rem 1rem',
  textAlign: 'left',
  selectors: { '&:active': { backgroundColor: solid(vars.rgb.surface2) } },
});

export const identity = style({ minWidth: 0, flex: 1 });

export const name = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.fg),
});

export const meta = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '11px',
  color: solid(vars.rgb.fgMuted),
});

export const occupancy = style({
  flexShrink: 0,
  textAlign: 'right',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  fontVariantNumeric: 'tabular-nums',
  color: solid(vars.rgb.fgMuted),
});

/** Green dot: at least one client in the room is online right now. */
export const liveDot = style({
  marginRight: '0.375rem',
  display: 'inline-block',
  height: '0.375rem',
  width: '0.375rem',
  borderRadius: vars.radius.pill,
  backgroundColor: solid(vars.rgb.ok),
  verticalAlign: 'middle',
});

export const connected = style({ fontWeight: 600, color: solid(vars.rgb.fg) });

export const chevron = style({ flexShrink: 0, color: alpha(vars.rgb.fgMuted, 0.6) });

export const editButton = style({
  display: 'flex',
  height: '2.75rem',
  width: '2.75rem',
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center',
  color: solid(vars.rgb.fgMuted),
  selectors: { '&:active': { opacity: 0.6 } },
});
