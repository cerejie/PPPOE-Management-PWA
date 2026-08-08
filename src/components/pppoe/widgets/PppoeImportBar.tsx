import * as styles from '@/styles/pages/pppoe/widgets/PppoeImportBar.css';
import type { PppoeAccountsPageViewModel } from '@/hooks/pppoe/usePppoeAccountsPage';

/**
 * Pulls the router's secret and profile lists in.
 *
 * The one action on this screen that genuinely needs a connection — everything
 * else queues — so unlike the rest of the app's forms this button really is
 * disabled offline, and says why.
 */
export function PppoeImportBar({ vm }: { vm: PppoeAccountsPageViewModel }) {
  return (
    <div className={styles.root}>
      <button
        type="button"
        onClick={vm.importFromRouter}
        disabled={!vm.online || vm.importing}
        className={styles.button}
      >
        {vm.importing ? 'Importing…' : 'Import from router'}
      </button>

      {!vm.online && (
        <p className={styles.hint}>
          Importing reads the router directly, so it needs a connection.
        </p>
      )}

      {vm.importSummary && <p className={styles.success}>Imported {vm.importSummary}</p>}

      {vm.importError && (
        <p role="alert" className={styles.error}>
          {vm.importError}
        </p>
      )}
    </div>
  );
}
