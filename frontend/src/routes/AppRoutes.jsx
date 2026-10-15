import React from 'react';
import { Routes, Route } from 'react-router-dom';

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

// Community Pages (Protected)
import CommunityFeedPage from '../pages/community/CommunityFeedPage';
import PostDetailPage from '../pages/community/PostDetailPage';
import CreatePostPage from '../pages/community/CreatePostPage';
import BookmarksPage from '../pages/community/BookmarksPage';

// Analytics Pages (Protected)
import AnalyticsMasterPage from '../pages/analytics/AnalyticsMasterPage';

// Profile Pages (Protected)
import ProfilePage from '../pages/profile/ProfilePage';
import AcademicDetailsPage from '../pages/profile/AcademicDetailsPage';
import SkillsExperiencePage from '../pages/profile/SkillsExperiencePage';
import ResumesPage from '../pages/profile/ResumesPage';
import AccountSettingsPage from '../pages/profile/AccountSettingsPage';

// Notification Pages (Protected)
import NotificationsPage from '../pages/notification/NotificationsPage';
import NotificationSettingsPage from '../pages/notification/NotificationSettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* 1. Global Public Route: Open to EVERYONE (Logged in or logged out) */}
        <Route index element={<HomePage />} />

        {/* 2. Guest-Only Auth Routes: Redirects to /community if already logged in */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* 3. Protected Routes: Redirects to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          {/* Community Module */}
          <Route path="community" element={<CommunityFeedPage />} />
          <Route path="community/feed" element={<CommunityFeedPage />} />
          <Route path="community/posts/:id" element={<PostDetailPage />} />
          <Route path="community/create" element={<CreatePostPage />} />
          <Route path="community/bookmarks" element={<BookmarksPage />} />

          {/* Analytics Module */}
          <Route path="analytics" element={<AnalyticsMasterPage />} />
          <Route path="analytics/overview" element={<AnalyticsMasterPage />} />
          <Route path="analytics/student" element={<AnalyticsMasterPage />} />
          <Route path="analytics/alumni" element={<AnalyticsMasterPage />} />
          <Route path="analytics/placement" element={<AnalyticsMasterPage />} />
          <Route path="analytics/*" element={<AnalyticsMasterPage />} />

          {/* Profile Module */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/academics" element={<AcademicDetailsPage />} />
          <Route path="profile/experience" element={<SkillsExperiencePage />} />
          <Route path="profile/resumes" element={<ResumesPage />} />
          <Route path="profile/settings" element={<AccountSettingsPage />} />

          {/* Notification Module */}
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="notifications/settings" element={<NotificationSettingsPage />} />
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
