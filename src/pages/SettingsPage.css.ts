import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';
import { button } from '@/common/styles/Form.css';

export const signOutButton = style([button.danger, { marginTop: '1.5rem' }]);

/** Why the button above is disabled while offline. */
export const signOutHint = style({
  marginTop: '0.5rem',
  textAlign: 'center',
  fontSize: '0.75rem',
  lineHeight: '1rem',
  color: solid(vars.rgb.fgMuted),
});

export const signOutError = style({
  marginTop: '0.75rem',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.dangerSoft),
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  color: solid(vars.rgb.danger),
});
