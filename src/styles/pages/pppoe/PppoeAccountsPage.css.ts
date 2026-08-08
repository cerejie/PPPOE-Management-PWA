import { style } from '@vanilla-extract/css';

/**
 * `Screen` pads its body but gives it no `gap`, so each block stacked above the
 * list carries the space beneath it. Same rhythm as the clients and rooms
 * screens: 0.75rem after the search box, 1rem after the bars.
 *
 * Only the search box is wrapped here, because `SearchInput` is shared and
 * takes no className. The two PPPoE-only widgets carry their trailing margin
 * in their own stylesheets — the filter bar's is inseparable from its bleed.
 */
export const search = style({ marginBottom: '0.75rem' });

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
});
