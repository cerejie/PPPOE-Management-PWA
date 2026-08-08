import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth/Auth.store';

/**
 * Gate for routes only a SuperAdmin may reach. Staff who deep-link into one are
 * sent home rather than shown an error — the route simply does not exist for
 * them.
 */
export function SuperAdminRoute() {
  const isSuperAdmin = useAuthStore((s) => s.appUser?.role === 'superadmin');
  return isSuperAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
