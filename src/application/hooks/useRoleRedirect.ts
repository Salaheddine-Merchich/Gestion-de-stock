import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/application/contexts/AuthContext';

export function useRoleRedirect() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user || !profile) return;

    const isOnAuthPage = location.pathname === '/auth';
    const isOnHomePage = location.pathname === '/';
    const isOnAdminRoute = location.pathname.startsWith('/admin');
    const isOnClientRoute = location.pathname.startsWith('/client');

    // Redirect admin users
    if (profile.role === 'admin') {
      if (isOnAuthPage || (isOnHomePage && !isOnAdminRoute)) {
        navigate('/admin/dashboard', { replace: true });
      }
    }
    // Redirect client users
    else if (profile.role === 'client') {
      if (isOnAuthPage && !isOnClientRoute) {
        navigate('/client/dashboard', { replace: true });
      }
      // Don't redirect clients from home page to allow browsing products
    }
  }, [user, profile, loading, location.pathname, navigate]);
}
