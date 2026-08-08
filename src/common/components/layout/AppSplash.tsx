import * as styles from '@/common/components/layout/AppSplash.css';
import { srOnly } from '@/common/styles/A11y.css';

/**
 * Shown while the session is being restored. Reuses the login page's brand tile
 * so the splash resolves into that page rather than cutting to it, and animates
 * as a signal meter — the app's own subject.
 */
export function AppSplash() {
  return (
    <div role="status" aria-live="polite" className={styles.root}>
      <div className={styles.brand}>
        <div aria-hidden className={styles.glow} />

        <div className={styles.tile}>
          <span className={styles.bar[1]} />
          <span className={styles.bar[2]} />
          <span className={styles.bar[3]} />
          <span className={styles.bar[4]} />
        </div>
      </div>

      <p className={styles.wordmark}>PPPoE Manager</p>
      <span className={srOnly}>Loading</span>
    </div>
  );
}
