import { globalStyle } from '@vanilla-extract/css';
import { vars } from '@/styles/global/Theme.css';
import { alpha, solid } from '@/styles/global/Token.utils';

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: solid(vars.rgb.line),
});

globalStyle('html', {
  // Native-app feel: no rubber-band overscroll chrome, no tap highlight.
  overscrollBehaviorY: 'none',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: solid(vars.rgb.canvas),
  lineHeight: 1.5,
});

globalStyle('body', {
  margin: 0,
  backgroundColor: solid(vars.rgb.canvas),
  color: solid(vars.rgb.fg),
  fontFamily: vars.font.sans,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
  // Prevent iOS text inflation in landscape.
  WebkitTextSizeAdjust: '100%',
});

globalStyle('h1, h2, h3, h4, p, figure, blockquote, dl, dd', {
  margin: 0,
});

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit',
  color: 'inherit',
  margin: 0,
});

globalStyle('button', {
  background: 'none',
  padding: 0,
  cursor: 'pointer',
});

globalStyle('img, svg, video, canvas', {
  display: 'block',
  maxWidth: '100%',
});

globalStyle('ul, ol', {
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'none',
});

// Hide scrollbars inside horizontal chip rows.
globalStyle('::-webkit-scrollbar', {
  display: 'none',
});

globalStyle('input, select, textarea', {
  // 16px+ prevents iOS zoom-on-focus.
  fontSize: '16px',
});

// Native date pickers render a light-on-light icon in dark mode.
globalStyle("input[type='date']::-webkit-calendar-picker-indicator", {
  '@media': {
    '(prefers-color-scheme: dark)': {
      filter: 'invert(1)',
      opacity: 0.65,
    },
  },
});

/*
 * Selects: drop the platform arrow for one that matches our icon set, and theme
 * the popup list. The chevron colours are baked into the data URI because url()
 * cannot read a CSS variable — keep them in step with --fg-muted. Horizontal
 * padding comes from the select recipe in Form.css.ts, which outranks an
 * element selector.
 */
const chevron = (stroke: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23${stroke}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

globalStyle('select', {
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: chevron('6a7280'),
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  backgroundSize: '1.15rem',
  '@media': {
    '(prefers-color-scheme: dark)': {
      backgroundImage: chevron('8d929d'),
    },
  },
});

globalStyle('select option', {
  // Chrome/Edge on Windows and Linux honour these; macOS draws it natively.
  backgroundColor: solid(vars.rgb.surface),
  color: solid(vars.rgb.fg),
});

globalStyle('::placeholder', {
  color: alpha(vars.rgb.fgMuted, 0.7),
});
