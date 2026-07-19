import { NavLink } from 'react-router-dom';

interface Tab {
  to: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
}

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const;

const tabs: Tab[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <path {...strokeProps} d="M3 12l9-8 9 8" />
        <path {...strokeProps} d="M5 10v10h5v-6h4v6h5V10" />
      </svg>
    ),
  },
  {
    to: '/clients',
    label: 'Clients',
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
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
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <rect {...strokeProps} x="3" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect {...strokeProps} x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect {...strokeProps} x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
        <rect {...strokeProps} x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
        <circle {...strokeProps} cx="12" cy="12" r="3" />
        <path
          {...strokeProps}
          d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.03 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1.11-1.56 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.56-1.03H3a2 2 0 110-4h.09a1.7 1.7 0 001.56-1.11 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h.08a1.7 1.7 0 001.03-1.56V3a2 2 0 114 0v.09a1.7 1.7 0 001.03 1.56h.08a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.08a1.7 1.7 0 001.56 1.03H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.56 1.03z"
        />
      </svg>
    ),
  },
];

/** Fixed bottom tab bar, native-app style, with safe-area inset. */
export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-safe-bottom"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex w-full max-w-app">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 ${
                isActive ? 'text-accent' : 'text-slate-400'
              } active:opacity-60`
            }
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
