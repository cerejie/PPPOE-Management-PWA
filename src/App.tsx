import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { SettingsScreen } from '@/features/auth/SettingsScreen';
import { DashboardScreen } from '@/features/clients/DashboardScreen';
import { ClientsScreen } from '@/features/clients/ClientsScreen';
import { ClientDetailScreen } from '@/features/clients/ClientDetailScreen';
import { ClientFormScreen } from '@/features/clients/ClientFormScreen';
import { RoomsScreen } from '@/features/rooms/RoomsScreen';
import { SyncScreen } from '@/features/sync/SyncScreen';
import { useBackgroundSync } from '@/features/sync/useSyncStatus';
import { TabBar } from '@/components/TabBar';

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
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
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
