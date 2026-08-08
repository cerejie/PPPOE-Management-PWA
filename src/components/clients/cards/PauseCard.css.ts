import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';

const cardBase = style({
  marginTop: '0.75rem',
  borderRadius: vars.radius.xxl,
  padding: '1.25rem',
  boxShadow: vars.shadow.card,
});

export const card = styleVariants({
  running: [cardBase, { backgroundColor: solid(vars.rgb.surface) }],
  paused: [cardBase, { backgroundColor: solid(vars.rgb.warnSoft) }],
});

export const row = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
});

export const text = style({ minWidth: 0 });

const titleBase = style({ fontWeight: 700 });

export const title = styleVariants({
  running: [titleBase, { color: solid(vars.rgb.fg) }],
  paused: [titleBase, { color: solid(vars.rgb.warn) }],
});

export const description = style({
  marginTop: '0.25rem',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

const actionBase = style({
  minHeight: '48px',
  flexShrink: 0,
  borderRadius: vars.radius.lg,
  padding: '0.75rem 1.25rem',
  fontWeight: 600,
  selectors: { '&:active': { opacity: 0.8 } },
});

export const action = styleVariants({
  pause: [actionBase, { backgroundColor: solid(vars.rgb.surface2), color: solid(vars.rgb.fg) }],
  resume: [
    actionBase,
    { backgroundColor: solid(vars.rgb.ok), color: '#fff', boxShadow: vars.shadow.float },
  ],
});
