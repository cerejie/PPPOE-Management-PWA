import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { alpha, solid } from '@/common/styles/Token.utils';
import { fadeIn } from '@/common/styles/Motion.css';
import { input } from '@/common/styles/Form.css';

export const root = style({
  position: 'relative',
  marginTop: '0.375rem',
});

export const trigger = style([
  input,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    textAlign: 'left',
  },
]);

/** The focus treatment held open while the calendar is showing. */
export const triggerOpen = style({
  borderColor: solid(vars.rgb.accent),
  backgroundColor: solid(vars.rgb.surface),
  boxShadow: `0 0 0 4px ${alpha(vars.rgb.accent, 0.15)}`,
});

export const valueText = style({ color: solid(vars.rgb.fg) });

export const placeholderText = style({ color: alpha(vars.rgb.fgMuted, 0.7) });

export const icon = style({
  height: '1.25rem',
  width: '1.25rem',
  flexShrink: 0,
  color: solid(vars.rgb.fgMuted),
});

export const popover = style([
  fadeIn,
  {
    position: 'absolute',
    left: '50%',
    zIndex: 30,
    marginTop: '0.5rem',
    width: '80%',
    transform: 'translateX(-50%)',
    overflow: 'hidden',
    borderRadius: vars.radius.xl,
    borderWidth: '1px',
    borderColor: solid(vars.rgb.line),
    backgroundColor: solid(vars.rgb.surface),
    boxShadow: vars.shadow.float,
  },
]);
