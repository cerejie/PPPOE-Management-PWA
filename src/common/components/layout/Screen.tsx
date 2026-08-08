import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SyncChip } from '@/components/sync/widgets/SyncChip';
import * as styles from '@/styles/common/layout/Screen.css';

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
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.titleGroup}>
            {back && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className={styles.backButton}
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
            <div className={styles.titleText}>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              <h1 className={styles.title}>{title}</h1>
            </div>
          </div>
          <div className={styles.actions}>
            {action}
            <SyncChip />
          </div>
        </div>
      </header>

      <main className={styles.body}>{children}</main>
    </div>
  );
}
