import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

/**
 * The status pill used by every badge in the app. Tones map to the same
 * semantic tokens the rest of the UI uses, so "danger" reads identically on a
 * badge, a button, and a chart.
 */
const pillBase = style({
  flexShrink: 0,
  borderRadius: vars.radius.pill,
  padding: '0.25rem 0.625rem',
  fontSize: '11px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
});

export const pill = styleVariants({
  ok: [pillBase, { backgroundColor: solid(vars.rgb.okSoft), color: solid(vars.rgb.ok) }],
  warn: [pillBase, { backgroundColor: solid(vars.rgb.warnSoft), color: solid(vars.rgb.warn) }],
  danger: [
    pillBase,
    { backgroundColor: solid(vars.rgb.dangerSoft), color: solid(vars.rgb.danger) },
  ],
  accent: [
    pillBase,
    { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) },
  ],
  neutral: [
    pillBase,
    { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fgMuted) },
  ],
});

export type PillTone = keyof typeof pill;

/** Muted caption used where a badge would be noise, e.g. "no expiry". */
export const caption = style({
  flexShrink: 0,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});
