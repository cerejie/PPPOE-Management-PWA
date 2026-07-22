import { NavLink } from 'react-router-dom';

interface Tab {
  to: string;
  label: string;
  icon: JSX.Element;
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const;

const tabs: Tab[] = [
  {
    to: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path {...strokeProps} d="M3 11.5l9-7.5 9 7.5" />
        <path {...strokeProps} d="M5.5 10v10h13V10" />
      </svg>
    ),
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <circle {...strokeProps} cx="9" cy="8" r="3.5" />
        <path {...strokeProps} d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
        <circle {...strokeProps} cx="17" cy="9" r="2.5" />
        <path {...strokeProps} d="M16.5 15.2c2.4.3 4.3 1.8 5 4.8" />
      </svg>
    ),
  },
  {
    to: '/rooms',
    label: 'Rooms',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <rect {...strokeProps} x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect {...strokeProps} x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect {...strokeProps} x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect {...strokeProps} x="13.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
    ),
  },
  {
    to: '/plans',
    label: 'Plans',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <rect {...strokeProps} x="2.5" y="5.5" width="19" height="13" rx="3" />
        <path {...strokeProps} d="M2.5 10h19" />
        <path {...strokeProps} d="M6.5 14.5h3" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <circle {...strokeProps} cx="12" cy="12" r="3" />
        <path
          {...strokeProps}
          d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.03 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1.11-1.56 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.56-1.03H3a2 2 0 110-4h.09a1.7 1.7 0 001.56-1.11 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h.08a1.7 1.7 0 001.03-1.56V3a2 2 0 114 0v.09a1.7 1.7 0 001.03 1.56h.08a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.08a1.7 1.7 0 001.56 1.03H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.56 1.03z"
        />
      </svg>
    ),
  },
];

/**
 * Bottom tab bar, native-app style, with safe-area inset.
 *
 * Deliberately in normal flow as the last row of the shell's flex column rather
 * than `position: fixed` — see AuthenticatedShell. The safe-area padding keeps
 * it clear of the iOS home indicator.
 */
export function TabBar() {
  return (
    <nav
      className="z-30 flex shrink-0 justify-center pb-safe-bottom"
      aria-label="Main navigation"
    >
      <div className="w-full max-w-app px-4 pb-3">
        <div className="flex items-center gap-0.5 rounded-3xl border border-line/80 bg-surface/85 p-1.5 shadow-float backdrop-blur-xl">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) =>
                `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                  isActive ? 'bg-accent-soft text-accent-text' : 'text-muted'
                } active:opacity-60`
              }
            >
              {tab.icon}
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
