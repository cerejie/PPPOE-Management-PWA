import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth/Auth.store';
import { AppRoutes } from '@/routes/AppRoutes';
import { LoginPage } from '@/pages/auth/LoginPage';
import { AppSplash } from '@/common/components/layout/AppSplash';

export function App() {
  const loading = useAuthStore((s) => s.loading);
  const authenticated = useAuthStore((s) => Boolean(s.session) || s.userId !== null);
  const initialize = useAuthStore((s) => s.initialize);

  // The store guards against a second run, so StrictMode's double-mount and any
  // later remount both resolve to a single session restore.
  useEffect(() => initialize(), [initialize]);

  if (loading) return <AppSplash />;
  if (!authenticated) return <LoginPage />;
  return <AppRoutes />;
}
