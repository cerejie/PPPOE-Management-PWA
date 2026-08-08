import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';
import { input } from '@/common/styles/Form.css';

export const root = style({
  position: 'relative',
  marginTop: '0.375rem',
});

export const field = style([input, { paddingRight: '2.75rem' }]);

export const chevron = style({
  pointerEvents: 'none',
  position: 'absolute',
  right: '1rem',
  top: '50%',
  height: '1.25rem',
  width: '1.25rem',
  transform: 'translateY(-50%)',
  color: solid(vars.rgb.fgMuted),
});

export const list = style({
  position: 'absolute',
  zIndex: 20,
  marginTop: '0.375rem',
  maxHeight: '15rem',
  width: '100%',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  borderRadius: vars.radius.lg,
  borderWidth: '1px',
  borderColor: solid(vars.rgb.line),
  backgroundColor: solid(vars.rgb.surface),
  padding: '0.375rem 0',
  boxShadow: vars.shadow.float,
});

export const empty = style({
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: solid(vars.rgb.fgMuted),
});

const optionBase = style({
  cursor: 'pointer',
  padding: '0.625rem 1rem',
  fontSize: '1rem',
});

export const option = styleVariants({
  active: [
    optionBase,
    { backgroundColor: solid(vars.rgb.accentSoft), color: solid(vars.rgb.accentText) },
  ],
  idle: [optionBase, { color: solid(vars.rgb.fg) }],
});

const truncate = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const optionLabel = style({ ...truncate, fontWeight: 500 });

export const optionHint = style({
  ...truncate,
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});
