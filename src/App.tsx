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

function AuthenticatedShell() {
  useBackgroundSync();
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

function SuperAdminOnly() {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <Outlet /> : <Navigate to="/" replace />;
}

export function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (!session) {
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
