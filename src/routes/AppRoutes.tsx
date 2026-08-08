import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/app/layouts/MainLayout';
import { SuperAdminRoute } from '@/routes/ProtectedRoutes';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ClientsPage } from '@/pages/clients/ClientsPage';
import { ClientDetailPage } from '@/pages/clients/detail/ClientDetailPage';
import { ClientFormPage } from '@/pages/clients/form/ClientFormPage';
import { RoomsPage } from '@/pages/rooms/RoomsPage';
import { PlansPage } from '@/pages/plans/PlansPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { SyncPage } from '@/pages/sync/SyncPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/sync" element={<SyncPage />} />
        <Route element={<SuperAdminRoute />}>
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id/edit" element={<ClientFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
