import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface RedirectRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

const RedirectRoute: React.FC<RedirectRouteProps> = ({ 
  children, 
  requireAdmin = false,
  redirectTo = '/home'
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuthStore();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RedirectRoute;