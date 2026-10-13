import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout
import AppLayout from '../layouts/AppLayout';

// General Pages
import HomePage from '../pages/general/HomePage';
import AboutPage from '../pages/general/AboutPage';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage';
import ForbiddenPage from '../pages/errors/ForbiddenPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';
import ServerErrorPage from '../pages/errors/ServerErrorPage';
import MaintenancePage from '../pages/errors/MaintenancePage';
import NetworkErrorPage from '../pages/errors/NetworkErrorPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Community Pages
import CommunityFeedPage from '../pages/community/CommunityFeedPage';
import PostDetailPage from '../pages/community/PostDetailPage';
import CreatePostPage from '../pages/community/CreatePostPage';
import BookmarksPage from '../pages/community/BookmarksPage';

// Analytics Pages
import AnalyticsDashboardPage from '../pages/analytics/AnalyticsDashboardPage';
import PlacementAnalyticsPage from '../pages/analytics/PlacementAnalyticsPage';
import CompanyAnalyticsPage from '../pages/analytics/CompanyAnalyticsPage';
import SkillsAnalyticsPage from '../pages/analytics/SkillsAnalyticsPage';
import AlumniAnalyticsPage from '../pages/analytics/AlumniAnalyticsPage';

// Profile Pages
import ProfilePage from '../pages/profile/ProfilePage';
import AcademicDetailsPage from '../pages/profile/AcademicDetailsPage';
import SkillsExperiencePage from '../pages/profile/SkillsExperiencePage';
import ResumesPage from '../pages/profile/ResumesPage';
import AccountSettingsPage from '../pages/profile/AccountSettingsPage';

// Notification Pages
import NotificationsPage from '../pages/notification/NotificationsPage';
import NotificationSettingsPage from '../pages/notification/NotificationSettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* General / Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />

        {/* Authentication Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/* Community Routes */}
        <Route path="community" element={<CommunityFeedPage />} />
        <Route path="community/feed" element={<CommunityFeedPage />} />
        <Route path="community/posts/:id" element={<PostDetailPage />} />
        <Route path="community/create" element={<CreatePostPage />} />
        <Route path="community/bookmarks" element={<BookmarksPage />} />

        {/* Analytics Routes */}
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="analytics/overview" element={<AnalyticsDashboardPage />} />
        <Route path="analytics/placements" element={<PlacementAnalyticsPage />} />
        <Route path="analytics/companies" element={<CompanyAnalyticsPage />} />
        <Route path="analytics/skills" element={<SkillsAnalyticsPage />} />
        <Route path="analytics/alumni" element={<AlumniAnalyticsPage />} />

        {/* Profile Routes (Direct 2-column workflow) */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/academics" element={<AcademicDetailsPage />} />
        <Route path="profile/experience" element={<SkillsExperiencePage />} />
        <Route path="profile/resumes" element={<ResumesPage />} />
        <Route path="profile/settings" element={<AccountSettingsPage />} />

        {/* Notification Routes */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notifications/settings" element={<NotificationSettingsPage />} />

        {/* Explicit Error Routes */}
        <Route path="404" element={<NotFoundPage />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="401" element={<UnauthorizedPage />} />
        <Route path="500" element={<ServerErrorPage />} />
        <Route path="503" element={<MaintenancePage />} />
        <Route path="offline" element={<NetworkErrorPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
