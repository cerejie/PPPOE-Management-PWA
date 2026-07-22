import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncChip } from '@/components/sync/indicators/SyncChip';

interface ScreenProps {
  title: string;
  /** Small line above the title, e.g. a greeting or the parent record. */
  eyebrow?: string;
  /** Show a back button instead of the app title treatment. */
  back?: boolean;
  /** Extra element rendered on the right side of the header. */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * Standard mobile screen: translucent sticky header over a scrolling body.
 * The floating tab bar and any FAB are rendered by the shell / screen itself,
 * so content is padded clear of them.
 */
export function Screen({ title, eyebrow, back = false, action, children }: ScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/80 pt-safe-top backdrop-blur-xl">
        <div className="mx-auto flex min-h-[60px] w-full max-w-app items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {back && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg active:opacity-60"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
            <div className="min-w-0">
              {eyebrow && (
                <p className="truncate text-xs font-medium text-muted">{eyebrow}</p>
              )}
              <h1 className="truncate text-xl font-bold tracking-tight text-fg">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            <SyncChip />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-app flex-1 px-4 pb-tabbar pt-4">{children}</main>
    </div>
  );
}
