import { style } from '@vanilla-extract/css';
import { vars } from '@/common/styles/Theme.css';
import { solid } from '@/common/styles/Token.utils';
import { bar as chipBar } from '@/common/components/buttons/FilterChip.css';

export const search = style({ marginBottom: '0.75rem' });

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
