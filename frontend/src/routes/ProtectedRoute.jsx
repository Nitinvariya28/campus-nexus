import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * ProtectedRoute Guard
 * Protects private application routes (community, analytics, profiles, notifications).
 * If the user is not authenticated, redirects them to /login and preserves their intended target route in location.state.
 */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to access this page.', { id: 'auth-required' });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    // Redirect to login while capturing the current path to allow post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the requested protected route
  return <Outlet />;
}
