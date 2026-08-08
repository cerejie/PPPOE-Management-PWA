import { style } from '@vanilla-extract/css';
import { bar as chipBar } from '@/styles/common/buttons/FilterChip.css';

/**
 * Bled out over the screen padding so the chips scroll edge to edge, and
 * carrying the gap to whatever follows — `Screen` gives its body no `gap`, so
 * each stacked block owns the space beneath it. Same shape as the clients and
 * rooms filter bars.
 */
export const bar = style([
  chipBar,
  { margin: '0 -1rem 1rem', paddingLeft: '1rem', paddingRight: '1rem' },
]);
