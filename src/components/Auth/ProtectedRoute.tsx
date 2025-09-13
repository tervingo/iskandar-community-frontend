import React from 'react';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  fallback = <div className="auth-required">Please log in to access this content.</div>
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuthStore();

  // Give more time for auth to load in new windows
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Check if there's a token in localStorage but auth is still loading
  const hasToken = localStorage.getItem('auth_token');
  if (hasToken && !isAuthenticated) {
    // Show loading state instead of immediate auth error
    return <div className="loading">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requireAdmin && !isAdmin) {
    return <div className="access-denied">Admin access required.</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;