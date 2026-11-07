import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout from '../layouts/AppLayout';

// Route Guards
import GuestRoute from './GuestRoute';
import ProtectedRoute from './ProtectedRoute';

// General / Public Pages
import HomePage from '../pages/general/HomePage';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import ServerErrorPage from '../pages/errors/ServerErrorPage';
import MaintenancePage from '../pages/errors/MaintenancePage';
import NetworkErrorPage from '../pages/errors/NetworkErrorPage';

// Auth Pages (Guest Only)
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Analytics Pages (Protected)
import AnalyticsMasterPage from '../pages/analytics/AnalyticsMasterPage';

// Community Pages (Protected)
import CommunityPage from '../pages/community/CommunityPage';
import SavedPostsPage from '../pages/community/SavedPostsPage';
import MemberDiscoveryPage from '../pages/community/MemberDiscoveryPage';

// Profile Settings Page (Protected)
import AccountSettingsPage from '../pages/profile/AccountSettingsPage';

// Notifications Page (Protected)
import NotificationsPage from '../pages/notifications/NotificationsPage';

// AI Mode Page (Protected)
import AIModePage from '../pages/ai/AIModePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* 1. Global Public Route: Open to EVERYONE (Logged in or logged out) */}
        <Route index element={<HomePage />} />

        {/* 2. Guest-Only Auth Routes: Redirects to /analytics if already logged in */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* 3. Protected Routes: Redirects to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          {/* Analytics Module */}
          <Route path="analytics" element={<AnalyticsMasterPage />} />
          <Route path="analytics/overview" element={<AnalyticsMasterPage />} />
          <Route path="analytics/student" element={<AnalyticsMasterPage />} />
          <Route path="analytics/alumni" element={<AnalyticsMasterPage />} />
          <Route path="analytics/placement" element={<AnalyticsMasterPage />} />
          <Route path="analytics/*" element={<AnalyticsMasterPage />} />

          {/* Profile Settings */}
          <Route path="profile" element={<AccountSettingsPage />} />
          <Route path="profile/settings" element={<AccountSettingsPage />} />

          {/* Community Module */}
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/feed" element={<CommunityPage />} />
          <Route path="community/create" element={<CommunityPage />} />
          <Route path="community/my-posts" element={<CommunityPage />} />
          <Route path="community/manage" element={<CommunityPage />} />
          <Route path="community/saved" element={<SavedPostsPage />} />
          <Route path="community/discover" element={<MemberDiscoveryPage />} />
          <Route path="community/*" element={<Navigate to="/community" replace />} />

          {/* Notifications Module */}
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/*" element={<NotificationsPage />} />

          {/* AI Mode Module */}
          <Route path="ai" element={<AIModePage />} />
          <Route path="ai/*" element={<AIModePage />} />
        </Route>

        {/* 4. Explicit Error Routes & Catch-All (Always accessible) */}
        <Route path="404" element={<NotFoundPage />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="401" element={<UnauthorizedPage />} />
        <Route path="500" element={<ServerErrorPage />} />
        <Route path="503" element={<MaintenancePage />} />
        <Route path="offline" element={<NetworkErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
