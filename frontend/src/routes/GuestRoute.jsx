import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * GuestRoute Guard
 * Blocks authenticated users from re-entering authentication screens (login, register, forgot-password).
 * If the user is already authenticated, redirects them directly to the analytics workspace.
 */
export default function GuestRoute() {
  const { isAuthenticated } = useAuth();

  // If already logged in, redirect to analytics workspace
  if (isAuthenticated) {
    return <Navigate to="/analytics" replace />;
  }

  // If unauthenticated guest, permit access to auth screen
  return <Outlet />;
}
