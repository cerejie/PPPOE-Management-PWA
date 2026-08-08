import { Outlet } from 'react-router-dom';
import { useBackgroundSync } from '@/hooks/sync/useSyncStatus';
import { TabBar } from '@/common/components/layout/TabBar';
import * as styles from '@/styles/app/MainLayout.css';

/**
 * App shell: a viewport-height column with the routed page scrolling inside it
 * and the tab bar as the last row.
 *
 * The bar used to be `position: fixed`, which on an installed iOS PWA is only
 * as stable as env(safe-area-inset-bottom) is on first paint — it settled to a
 * different offset once another route forced a re-layout. As a flex row it is
 * placed by the layout itself and cannot move.
 */
export function MainLayout() {
  useBackgroundSync();
  return (
    <div className={styles.shell}>
      <div className={styles.scroller}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
