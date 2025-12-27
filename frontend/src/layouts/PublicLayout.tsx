import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const PublicLayout = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to app if already authenticated
  if (isAuthenticated && window.location.pathname === '/') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950">
      {/* Entrance animation placeholder - will be added when copying components */}
      <Outlet />
    </div>
  );
};
