import {
  assignVars,
  createGlobalTheme,
  createGlobalThemeContract,
  globalStyle,
} from '@vanilla-extract/css';

/**
 * Theme contract.
 *
 * Colours are stored as bare `R G B` triples rather than finished colours, for
 * the same reason they were under Tailwind: a triple can be given an alpha at
 * the point of use (`alpha(rgb.accent, 0.15)`) without a second token for every
 * opacity the design needs. Use `solid()` / `alpha()` below — never interpolate
 * a triple into a property directly, it is not a colour on its own.
 *
 * The dark palette at the bottom is the only place the colours flip.
 */
export const vars = createGlobalThemeContract(
  {
    rgb: {
      canvas: 'canvas',
      surface: 'surface',
      surface2: 'surface-2',
      line: 'line',
      fg: 'fg',
      fgMuted: 'fg-muted',
      accent: 'accent',
      accent2: 'accent-2',
      accentSoft: 'accent-soft',
      accentText: 'accent-text',
      ok: 'ok',
      okSoft: 'ok-soft',
      warn: 'warn',
      warnSoft: 'warn-soft',
      danger: 'danger',
      dangerSoft: 'danger-soft',
    },
    shadow: {
      card: 'shadow-card',
      float: 'shadow-float',
    },
    space: {
      /** How far the tab bar sits off the bottom of the viewport. */
      tabbarDock: 'tabbar-dock',
      /** Clearance a scroll container needs so content clears the floating bar. */
      tabbar: 'tabbar',
      aboveTabbar: 'above-tabbar',
      safeTop: 'safe-top',
      safeBottom: 'safe-bottom',
    },
    radius: {
      sm: 'radius-sm',
      md: 'radius-md',
      lg: 'radius-lg',
      xl: 'radius-xl',
      xxl: 'radius-xxl',
      pill: 'radius-pill',
    },
    font: {
      sans: 'font-sans',
    },
    layout: {
      appWidth: 'app-width',
    },
  },
  // The contract values above are the CSS custom-property names themselves, so
  // the generated variables stay readable in devtools and keep the names the
  // stylesheet used before the migration.
  (value) => `--${value}`,
);

const light = {
  rgb: {
    canvas: '245 246 249',
    surface: '255 255 255',
    surface2: '240 242 246',
    line: '226 229 236',
    fg: '14 16 22',
    fgMuted: '106 114 128',
    accent: '79 70 229',
    accent2: '147 51 234',
    accentSoft: '238 236 254',
    accentText: '67 56 202',
    ok: '21 156 74',
    okSoft: '219 250 229',
    warn: '176 82 8',
    warnSoft: '254 243 205',
    danger: '214 38 38',
    dangerSoft: '254 228 228',
  },
  shadow: {
    card: '0 1px 2px rgb(14 16 22 / 0.05), 0 10px 28px -14px rgb(14 16 22 / 0.16)',
    float: '0 6px 16px -4px rgb(14 16 22 / 0.16), 0 12px 32px -10px rgb(14 16 22 / 0.2)',
  },
  space: {
    // The home-indicator inset already supplies the gap on devices that have
    // one, so take the larger of the two rather than adding a fixed gap on top
    // of it — stacking them pushed the bar visibly high. The floor only exists
    // so the pill's shadow is not clipped where the inset is 0.
    tabbarDock: 'max(1rem, env(safe-area-inset-bottom))',
    tabbar: 'calc(4.75rem + max(1rem, env(safe-area-inset-bottom)))',
    aboveTabbar: 'calc(5.5rem + max(1rem, env(safe-area-inset-bottom)))',
    safeTop: 'env(safe-area-inset-top)',
    safeBottom: 'env(safe-area-inset-bottom)',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
    pill: '9999px',
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  layout: {
    appWidth: '480px',
  },
};

createGlobalTheme(':root', vars, light);

globalStyle(':root', {
  colorScheme: 'light dark',
});

globalStyle(':root', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      // Pin the scheme so native popups (select lists, pickers) render dark
      // too — "light dark" leaves that to the platform, which gets it wrong.
      colorScheme: 'dark',
      vars: assignVars(vars, {
        ...light,
        rgb: {
          canvas: '9 9 12',
          surface: '22 23 28',
          surface2: '32 34 41',
          line: '42 44 53',
          fg: '244 245 249',
          fgMuted: '141 146 157',
          accent: '109 106 249',
          accent2: '176 96 253',
          accentSoft: '32 31 62',
          accentText: '179 176 254',
          ok: '52 200 110',
          okSoft: '17 47 31',
          warn: '245 165 36',
          warnSoft: '56 40 12',
          danger: '250 116 116',
          dangerSoft: '63 25 27',
        },
        shadow: {
          card: '0 1px 2px rgb(0 0 0 / 0.5), 0 10px 28px -14px rgb(0 0 0 / 0.7)',
          float: '0 6px 16px -4px rgb(0 0 0 / 0.6), 0 12px 32px -10px rgb(0 0 0 / 0.8)',
        },
      }),
    },
  },
});
