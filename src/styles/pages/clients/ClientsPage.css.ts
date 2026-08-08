import { style } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { solid } from '@/styles/global/Token.utils';
import { bar as chipBar } from '@/styles/common/buttons/FilterChip.css';

/** Search box plus the sort toggle, which keeps its width as the box flexes. */
export const searchRow = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: '0.5rem',
  marginBottom: '0.75rem',
});

export const searchField = style({ flex: 1, minWidth: 0 });

/** Bled out over the screen padding so the chips scroll edge to edge. */
export const filterBar = style([
  chipBar,
  { margin: '0 -1rem 1rem', paddingLeft: '1rem', paddingRight: '1rem' },
]);

export const roomBanner = style({
  marginBottom: '0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: vars.radius.lg,
  backgroundColor: solid(vars.rgb.accentSoft),
  padding: '0.625rem 1rem',
});

export const roomBannerLabel = style({
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  fontWeight: 600,
  color: solid(vars.rgb.accentText),
});

export const roomBannerClear = style([
  roomBannerLabel,
  {
    minHeight: '36px',
    selectors: { '&:active': { opacity: 0.6 } },
  },
]);

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.625rem',
});
