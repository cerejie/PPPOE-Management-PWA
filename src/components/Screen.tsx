import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncChip } from '@/features/sync/SyncChip';

interface ScreenProps {
  title: string;
  /** Show a back button instead of the app title treatment. */
  back?: boolean;
  /** Extra element rendered on the right side of the header. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Standard mobile screen: fixed dark header (with safe-area top padding),
 * scrollable content. The bottom tab bar is rendered by the shell layout.
 */
export function Screen({ title, back = false, action, children }: ScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-20 bg-slate-900 pt-safe-top">
        <div className="mx-auto flex h-14 w-full max-w-app items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-1">
            {back && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white active:opacity-60"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <SyncChip />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-app flex-1 px-4 pb-28 pt-4">{children}</main>
    </div>
  );
}
