import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/auth/AuthContext';
import { LoginScreen } from '@/pages/auth/LoginScreen';
import { SettingsScreen } from '@/pages/auth/SettingsScreen';
import { DashboardScreen } from '@/pages/clients/DashboardScreen';
import { ClientsScreen } from '@/pages/clients/ClientsScreen';
import { ClientDetailScreen } from '@/pages/clients/ClientDetailScreen';
import { ClientFormScreen } from '@/pages/clients/ClientFormScreen';
import { RoomsScreen } from '@/pages/rooms/RoomsScreen';
import { PlansScreen } from '@/pages/plans/PlansScreen';
import { SyncScreen } from '@/pages/sync/SyncScreen';
import { useBackgroundSync } from '@/hooks/sync/useSyncStatus';
import { TabBar } from '@/components/common/layout/TabBar';
import { AppSplash } from '@/components/common/layout/AppSplash';

/**
 * App shell: a viewport-height column with the routed screen scrolling inside
 * it and the tab bar as the last row.
 *
 * The bar used to be `position: fixed`, which on an installed iOS PWA is only
 * as stable as env(safe-area-inset-bottom) is on first paint — it settled to a
 * different offset once another route forced a re-layout. As a flex row it is
 * placed by the layout itself and cannot move.
 */
function AuthenticatedShell() {
  useBackgroundSync();
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

function SuperAdminOnly() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

export function App() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <AppSplash />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route element={<AuthenticatedShell />}>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/clients" element={<ClientsScreen />} />
        <Route path="/clients/:id" element={<ClientDetailScreen />} />
        <Route path="/rooms" element={<RoomsScreen />} />
        <Route path="/plans" element={<PlansScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/sync" element={<SyncScreen />} />
        <Route element={<SuperAdminOnly />}>
          <Route path="/clients/new" element={<ClientFormScreen />} />
          <Route path="/clients/:id/edit" element={<ClientFormScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
