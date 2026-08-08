import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';
import { bar as chipBar } from '@/styles/common/buttons/FilterChip.css';

export const search = style({ marginBottom: '0.75rem' });

/** Bled out over the screen padding so the chips scroll edge to edge. */
export const filterBar = style([
  chipBar,
  { margin: '0 -1rem 1rem', paddingLeft: '1rem', paddingRight: '1rem' },
]);

export const list = style({
  overflow: 'hidden',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.surface),
  boxShadow: vars.shadow.card,
});
