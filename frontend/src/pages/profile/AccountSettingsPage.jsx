import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Profile Header & Sidebar Components
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSidebar from '../../components/profile/ProfileSidebar';

// Modular Content Sections
import IdentitySection from '../../components/profile/sections/IdentitySection';
import AcademicSection from '../../components/profile/sections/AcademicSection';
import CareerSection from '../../components/profile/sections/CareerSection';
import InstitutionalTelemetrySection from '../../components/profile/sections/InstitutionalTelemetrySection';
import SkillsSection from '../../components/profile/sections/SkillsSection';
import LearningPlatformsSection from '../../components/profile/sections/LearningPlatformsSection';
import SocialLinksSection from '../../components/profile/sections/SocialLinksSection';
import AIHabitsSection from '../../components/profile/sections/AIHabitsSection';
import InterviewPreviewSection from '../../components/profile/sections/InterviewPreviewSection';
import ResumesSection from '../../components/profile/sections/ResumesSection';
import SecuritySection from '../../components/profile/sections/SecuritySection';

// Interactive Modals
import PasswordChangeModal from '../../components/profile/modals/PasswordChangeModal';
import AlumniEmailModal from '../../components/profile/modals/AlumniEmailModal';
import DeleteAccountModal from '../../components/profile/modals/DeleteAccountModal';
import AddSkillModal from '../../components/profile/modals/AddSkillModal';
import AddSocialLinkModal from '../../components/profile/modals/AddSocialLinkModal';

// Common Components
import StickySaveBar from '../../components/profile/common/StickySaveBar';

/**
 * AccountSettingsPage (Master Profile Template)
 * Orchestrates role-adaptive views, tab navigation, and modular profile sections.
 * (Base template page - ready for API integration and business logic wiring in next step)
 */
export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'STUDENT';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Active navigation tab: 'details' | 'resumes' | 'security'
  const [activeTab, setActiveTab] = useState('details');

  // Modals visibility state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddSocialModalOpen, setIsAddSocialModalOpen] = useState(false);

  // Unsaved changes state (stub)
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Base placeholder form data
  const [formData, setFormData] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Aarav Patel',
    email: user?.email || '24bce001@nirmauni.ac.in',
    bio: 'Competitive programmer and aspiring cloud architect.',
    phone: '+91 9123456789',
    location: 'Ahmedabad, Gujarat',
    semester: 4,
    department_id: 1,
    batch_id: 1,
    company_id: 1,
    role: 'Senior Cloud Solutions Architect',
    job_category: 'DEVOPS_CLOUD',
    years_of_experience: 4,
    ai_tool: 'CURSOR',
    usage_frequency: 'REGULARLY',
    usage_purpose: 'CODING',
    daily_time_range: '1_TO_2_HOURS',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsDirty(false);
    }, 600);
  };

  const handleDiscard = () => {
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Tab Bar */}
      <ProfileHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* 2. Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (30% / 4 cols): Sticky Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <ProfileSidebar
            profile={formData}
            user={user}
            userRole={userRole}
          />
        </aside>

        {/* Right Column (70% / 8 cols): Role-Adaptive Tab Content */}
        <main className="lg:col-span-8 space-y-6">
          {/* TAB 1: Profile Details */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Identity Section (All Roles) */}
              <IdentitySection
                userRole={userRole}
                formData={formData}
                onChange={handleInputChange}
              />

              {/* Student Academic Section */}
              {userRole === 'STUDENT' && (
                <>
                  <AcademicSection
                    formData={formData}
                    onChange={handleInputChange}
                  />
                  <SkillsSection
                    onAddSkill={() => setIsAddSkillModalOpen(true)}
                  />
                  <LearningPlatformsSection
                    onAddPlatform={() => setIsAddSocialModalOpen(true)}
                  />
                  <SocialLinksSection
                    onAddLink={() => setIsAddSocialModalOpen(true)}
                  />
                  <AIHabitsSection
                    formData={formData}
                    onChange={handleInputChange}
                  />
                </>
              )}

              {/* Alumni Career Section */}
              {userRole === 'ALUMNI' && (
                <>
                  <CareerSection
                    formData={formData}
                    onChange={handleInputChange}
                  />
                  <SkillsSection
                    onAddSkill={() => setIsAddSkillModalOpen(true)}
                  />
                  <SocialLinksSection
                    onAddLink={() => setIsAddSocialModalOpen(true)}
                  />
                  <LearningPlatformsSection
                    onAddPlatform={() => setIsAddSocialModalOpen(true)}
                  />
                  <InterviewPreviewSection />
                </>
              )}

              {/* Placement Cell Institutional Section */}
              {userRole === 'PLACEMENT_CELL' && (
                <InstitutionalTelemetrySection />
              )}
            </div>
          )}

          {/* TAB 2: Resumes & CV (Students & Alumni) */}
          {activeTab === 'resumes' && userRole !== 'PLACEMENT_CELL' && (
            <ResumesSection />
          )}

          {/* TAB 3: Security & Account (All Roles) */}
          {activeTab === 'security' && (
            <SecuritySection
              userRole={userRole}
              userEmail={user?.email || formData.email}
              onChangePassword={() => setIsPasswordModalOpen(true)}
              onChangeEmail={() => setIsEmailModalOpen(true)}
              onDeleteAccount={() => setIsDeleteModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* 3. Floating Bottom Action Bar on Dirty State */}
      <StickySaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />

      {/* 4. Interactive Modals */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          setIsPasswordModalOpen(false);
        }}
      />

      <AlumniEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={formData.email}
        onSubmit={(e) => {
          e.preventDefault();
          setIsEmailModalOpen(false);
        }}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => setIsDeleteModalOpen(false)}
      />

      <AddSkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        onAdd={() => setIsAddSkillModalOpen(false)}
      />

      <AddSocialLinkModal
        isOpen={isAddSocialModalOpen}
        onClose={() => setIsAddSocialModalOpen(false)}
        onAdd={() => setIsAddSocialModalOpen(false)}
      />
    </div>
  );
}
