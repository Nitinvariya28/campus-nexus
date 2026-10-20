import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profile/profileService';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorUtils';

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
import AddPlatformModal from '../../components/profile/modals/AddPlatformModal';

// Common Components
import StickySaveBar from '../../components/profile/common/StickySaveBar';

/**
 * AccountSettingsPage (Master Profile & Settings Controller)
 * Orchestrates role-adaptive views, database-driven hydration, zero dummy data,
 * and unified persistence for student, alumni, and placement cell accounts.
 */
export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || 'STUDENT';

  // Navigation tab state: 'details' | 'resumes' | 'security'
  const [activeTab, setActiveTab] = useState('details');

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Dynamic dropdown options from backend
  const [options, setOptions] = useState(null);

  // Raw profile and resumes from backend
  const [rawProfile, setRawProfile] = useState(null);
  const [resumes, setResumes] = useState([]);

  // Controlled form state
  const [formData, setFormData] = useState({
    full_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    email: user?.email || '',
    bio: '',
    phone: '',
    address: '',
    location: '',
    department_id: '',
    department: '',
    batch_id: '',
    batch: '',
    semester: '',
    company_id: '',
    company_name: '',
    company_tier: '',
    role: '',
    job_category: '',
    years_of_experience: 0,
    ai_tool: '',
    usage_frequency: '',
    usage_purpose: '',
    daily_time_range: '',
    skills: [],
    social_links: [],
    learning_platforms: [],
    interview_experiences: [],
    stats: {},
    activity: {},
    avatar_url: '',
    cover_image: '',
  });

  // Original snapshot to support discard and change tracking
  const [originalData, setOriginalData] = useState(null);

  // Modals visibility state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddSocialModalOpen, setIsAddSocialModalOpen] = useState(false);
  const [isAddPlatformModalOpen, setIsAddPlatformModalOpen] = useState(false);

  /**
   * Hydrate form state from database response
   */
  const mapProfileToForm = useCallback((profile, role, optData = null) => {
    if (!profile) return;

    if (role === 'STUDENT') {
      const identity = profile.identity || {};
      const analytics = profile.analytics_data || {};
      const primaryAI = (analytics.ai_usage && analytics.ai_usage[0]) || {};

      const currentEmail = identity.email || profile.email || user?.email || '';

      let deptId = identity.department_id || '';
      let deptName = identity.department || '';
      let batchId = identity.batch_id || '';
      let batchName = identity.batch || '';

      // Auto-deduce department and batch from student email if unassigned
      if ((!deptId || !batchId) && currentEmail) {
        const m = currentEmail.match(/^(\d{2})([a-zA-Z]{2,4})\d+/);
        if (m) {
          const sy = 2000 + parseInt(m[1], 10);
          const c = m[2].toUpperCase();
          const allDepts = optData?.academic_form?.departments || optData?.departments || [];
          const allBatches = optData?.academic_form?.batches || optData?.batches || [];
          if (!deptId) {
            const foundDept = allDepts.find((d) => d.code === c || d.name?.toLowerCase().includes(c.toLowerCase()));
            if (foundDept) {
              deptId = foundDept.id;
              deptName = foundDept.name;
            }
          }
          if (!batchId) {
            const foundBatch = allBatches.find((b) => b.start_year === sy);
            if (foundBatch) {
              batchId = foundBatch.id;
              batchName = foundBatch.name || `${foundBatch.start_year}-${foundBatch.end_year}`;
            }
          }
        }
      }

      const mapped = {
        full_name: identity.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || currentEmail.split('@')[0],
        email: currentEmail,
        bio: identity.bio || '',
        phone: identity.phone || '',
        address: identity.address || '',
        location: identity.address || '',
        department_id: deptId,
        department: deptName,
        batch_id: batchId,
        batch: batchName,
        semester: identity.semester || '',
        company_id: '',
        company_name: '',
        company_tier: '',
        role: '',
        job_category: '',
        years_of_experience: 0,
        ai_tool: primaryAI.ai_tool || '',
        usage_frequency: primaryAI.usage_frequency || '',
        usage_purpose: primaryAI.usage_purpose || '',
        daily_time_range: primaryAI.daily_time_range || '',
        skills: analytics.skills || [],
        social_links: profile.social_links || [],
        learning_platforms: analytics.learning_platforms || [],
        interview_experiences: [],
        stats: profile.stats || {},
        activity: profile.activity || {},
        avatar_url: identity.avatar_url || '',
        cover_image: identity.cover_image || profile.cover_image || user?.cover_image || '',
      };
      setFormData(mapped);
      setOriginalData(JSON.parse(JSON.stringify(mapped)));
    } else if (role === 'ALUMNI') {
      const identity = profile.identity || {};
      const currentCareer = profile.current_career || {};
      const primaryAI = (profile.ai_usage && profile.ai_usage[0]) || {};

      const currentEmail = profile.email || identity.email || user?.email || '';

      const mapped = {
        full_name: profile.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '') || currentEmail.split('@')[0],
        email: currentEmail,
        bio: identity.bio || '',
        phone: identity.phone || '',
        location: identity.location || '',
        address: identity.location || '',
        department_id: identity.department_id || identity.department?.id || '',
        department: identity.department?.name || identity.department || '',
        batch_id: identity.batch_id || identity.batch?.id || '',
        batch: identity.batch?.name || identity.batch || '',
        semester: '',
        company_id: currentCareer.company?.id || '',
        company_name: currentCareer.company?.name || '',
        company_tier: currentCareer.company?.tier || '',
        role: currentCareer.role || '',
        job_category: currentCareer.job_category || '',
        years_of_experience: currentCareer.years_of_experience ?? 0,
        ai_tool: primaryAI.ai_tool || '',
        usage_frequency: primaryAI.usage_frequency || '',
        usage_purpose: primaryAI.usage_purpose || '',
        daily_time_range: primaryAI.daily_time_range || '',
        skills: profile.skills || [],
        social_links: profile.social_links || [],
        learning_platforms: profile.learning_platforms || [],
        interview_experiences: profile.interview_experiences || [],
        stats: profile.stats || {},
        activity: profile.stats ? { recent_posts_count: profile.stats.total_posts } : {},
        avatar_url: profile.profile_photo || '',
        cover_image: profile.cover_image || identity.cover_image || user?.cover_image || '',
      };
      setFormData(mapped);
      setOriginalData(JSON.parse(JSON.stringify(mapped)));
    } else if (role === 'PLACEMENT_CELL') {
      const mapped = {
        full_name: profile.full_name || '',
        email: profile.email || '',
        bio: '',
        phone: '',
        address: '',
        location: '',
        department_id: '',
        department: '',
        batch_id: '',
        batch: '',
        semester: '',
        company_id: '',
        company_name: '',
        company_tier: '',
        role: '',
        job_category: '',
        years_of_experience: 0,
        ai_tool: '',
        usage_frequency: '',
        usage_purpose: '',
        daily_time_range: '',
        skills: [],
        social_links: [],
        learning_platforms: [],
        interview_experiences: [],
        stats: profile.stats || {},
        activity: {},
        avatar_url: profile.profile_photo || '',
        cover_image: profile.cover_image || user?.cover_image || '',
      };
      setFormData(mapped);
      setOriginalData(JSON.parse(JSON.stringify(mapped)));
    }
  }, []);

  /**
   * Fetch initial profile data, dropdown options, and resumes
   */
  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileResult, optionsResult] = await Promise.allSettled([
        profileService.getProfileMe(),
        profileService.getProfileOptions(),
      ]);

      let profileData = null;
      let optionsData = null;

      if (optionsResult.status === 'fulfilled') {
        optionsData = optionsResult.value;
        setOptions(optionsData);
      } else {
        console.warn('Failed to load profile options:', optionsResult.reason);
      }

      if (profileResult.status === 'fulfilled') {
        profileData = profileResult.value;
        setRawProfile(profileData);
        mapProfileToForm(profileData, userRole, optionsData);
      } else {
        console.error('Failed to load profile details:', profileResult.reason);
        toast.error('Failed to load profile details from server.');
      }

      // Load resumes for student & alumni
      if (userRole !== 'PLACEMENT_CELL') {
        try {
          const resumesData = await profileService.listResumes();
          setResumes(Array.isArray(resumesData) ? resumesData : []);
        } catch {
          // If resumes call fails, fallback to profile resumes or empty array
          setResumes(profileData?.resumes || []);
        }
      }
    } catch (err) {
      toast.error('Error synchronizing profile data.');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole, mapProfileToForm]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  /**
   * Top Header Logout action
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Generic input change handler
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'department_id') {
        const departments = options?.academic_form?.departments || options?.departments || [];
        const found = departments.find((d) => String(d.id) === String(value));
        if (found) next.department = found.name;
      }
      if (name === 'batch_id') {
        const batches = options?.academic_form?.batches || options?.batches || [];
        const found = batches.find((b) => String(b.id) === String(value));
        if (found) next.batch = found.name || found.batch_name || '';
      }
      return next;
    });
    setIsDirty(true);
  };

  /**
   * Skills management handlers
   */
  const handleAddSkill = (newSkill) => {
    setFormData((prev) => {
      const exists = prev.skills.some(
        (s) => Number(s.skill_id || s.id) === Number(newSkill.skill_id)
      );
      if (exists) {
        toast.error('This skill has already been added.');
        return prev;
      }
      return {
        ...prev,
        skills: [...prev.skills, newSkill],
      };
    });
    setIsDirty(true);
  };

  const handleRemoveSkill = (skillIdOrName) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter(
        (s) =>
          Number(s.skill_id || s.id) !== Number(skillIdOrName) &&
          s.name !== skillIdOrName &&
          s.skill_name !== skillIdOrName
      ),
    }));
    setIsDirty(true);
  };

  /**
   * Social links management handlers
   */
  const handleAddSocialLink = (newLink) => {
    setFormData((prev) => {
      const filtered = prev.social_links.filter((l) => l.platform !== newLink.platform);
      return {
        ...prev,
        social_links: [...filtered, newLink],
      };
    });
    setIsDirty(true);
  };

  const handleRemoveSocialLink = (platform) => {
    setFormData((prev) => ({
      ...prev,
      social_links: prev.social_links.filter((l) => l.platform !== platform),
    }));
    setIsDirty(true);
  };

  /**
   * Learning resources management handlers
   */
  const handleAddPlatform = (newPlatform) => {
    setFormData((prev) => ({
      ...prev,
      learning_platforms: [...prev.learning_platforms, newPlatform],
    }));
    setIsDirty(true);
  };

  const handleRemovePlatform = (platformKey) => {
    setFormData((prev) => ({
      ...prev,
      learning_platforms: prev.learning_platforms.filter((p) => {
        if (p.id && String(p.id) === String(platformKey)) return false;
        if (p.platform_id && String(p.platform_id) === String(platformKey)) return false;
        if (p.url && p.url === platformKey) return false;
        return true;
      }),
    }));
    setIsDirty(true);
  };

  /**
   * Discard unsaved changes
   */
  const handleDiscard = () => {
    if (originalData) {
      setFormData(JSON.parse(JSON.stringify(originalData)));
    }
    setIsDirty(false);
    toast('Changes discarded.', { icon: 'ℹ️' });
  };

  /**
   * Save Profile changes to database
   */
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      let payload = {};

      if (userRole === 'STUDENT') {
        const studentIdentity = {
          bio: formData.bio || '',
          semester: formData.semester ? Number(formData.semester) : null,
          phone: formData.phone || '',
          address: formData.address || '',
        };
        // For students, department and batch cohort are fixed and cannot be updated

        payload = {
          identity: studentIdentity,
          skills: (formData.skills || []).map((s) => ({
            skill_id: Number(s.skill_id || s.id),
            proficiency: s.proficiency || 'BEGINNER',
          })),
          social_links: (formData.social_links || []).map((sl) => ({
            platform: sl.platform,
            url: sl.url || '',
          })),
          learning_platforms: (formData.learning_platforms || []).map((lp) => {
            if (lp.platform_id) {
              return { platform_id: Number(lp.platform_id), url: lp.url || '' };
            }
            return {
              other_platform_name: lp.other_platform_name || lp.platform_name || '',
              url: lp.url || '',
            };
          }),
        };

        if (formData.ai_tool) {
          payload.ai_usage = [
            {
              ai_tool: formData.ai_tool,
              usage_frequency: formData.usage_frequency || 'REGULARLY',
              daily_time_range: formData.daily_time_range || '1_TO_2_HOURS',
              usage_purpose: formData.usage_purpose || 'CODING',
            },
          ];
        }
      } else if (userRole === 'ALUMNI') {
        const alumniIdentity = {
          full_name: formData.full_name || '',
          bio: formData.bio || '',
          phone: formData.phone || '',
          location: formData.location || '',
        };
        if (formData.department_id) {
          alumniIdentity.department_id = Number(formData.department_id);
        }
        if (formData.batch_id) {
          alumniIdentity.batch_id = Number(formData.batch_id);
        }

        const currentCareer = {
          role: formData.role || '',
          job_category: formData.job_category || '',
          years_of_experience: Number(formData.years_of_experience || 0),
        };
        if (formData.company_id) {
          currentCareer.company_id = Number(formData.company_id);
        }

        payload = {
          identity: alumniIdentity,
          current_career: currentCareer,
          skills: (formData.skills || []).map((s) => ({
            skill_id: Number(s.skill_id || s.id),
            proficiency: s.proficiency || 'BEGINNER',
          })),
          social_links: (formData.social_links || []).map((sl) => ({
            platform: sl.platform,
            url: sl.url || '',
          })),
          learning_platforms: (formData.learning_platforms || []).map((lp) => {
            if (lp.platform_id) {
              return { platform_id: Number(lp.platform_id), url: lp.url || '' };
            }
            return {
              other_platform_name: lp.other_platform_name || lp.platform_name || '',
              url: lp.url || '',
            };
          }),
        };

        if (formData.ai_tool) {
          payload.ai_usage = [
            {
              ai_tool: formData.ai_tool,
              usage_frequency: formData.usage_frequency || 'REGULARLY',
              daily_time_range: formData.daily_time_range || '1_TO_2_HOURS',
              usage_purpose: formData.usage_purpose || 'CODING',
            },
          ];
        }
      } else if (userRole === 'PLACEMENT_CELL') {
        payload = {
          identity: {
            full_name: formData.full_name || '',
          },
        };
      }

      const updated = await profileService.updateProfile(payload);
      toast.success('Profile saved successfully!');
      setRawProfile(updated);
      mapProfileToForm(updated, userRole);
      setIsDirty(false);
    } catch (err) {
      console.error('Update profile error:', err);
      const msg = err?.response?.data?.error || 'Failed to save profile changes.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Resume actions
   */
  const handleUploadResume = async (formDataPayload) => {
    try {
      setIsUploadingResume(true);
      await profileService.uploadResume(formDataPayload);
      toast.success('Resume uploaded successfully!');
      const updatedList = await profileService.listResumes();
      setResumes(Array.isArray(updatedList) ? updatedList : []);
      return true;
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to upload resume.';
      toast.error(msg);
      return false;
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      await profileService.deleteResume(resumeId);
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      toast.success('Resume deleted.');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to delete resume.';
      toast.error(msg);
    }
  };

  const handleSetPrimaryResume = async (resumeId) => {
    try {
      await profileService.setPrimaryResume(resumeId);
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          is_primary: r.id === resumeId,
        }))
      );
      toast.success('Primary placement resume updated.');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to update primary resume.';
      toast.error(msg);
    }
  };

  /**
   * Profile Avatar Upload action
   */
  const handleUploadAvatar = async (file) => {
    try {
      setIsUploadingAvatar(true);
      const uploadData = new FormData();
      uploadData.append('profile_photo', file);
      const res = await profileService.uploadAvatar(uploadData);
      toast.success('Profile photo updated successfully!');
      if (res?.avatar_url) {
        setFormData((prev) => ({ ...prev, avatar_url: res.avatar_url }));
        setOriginalData((prev) => (prev ? { ...prev, avatar_url: res.avatar_url } : prev));
      }
      await loadProfileData();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to upload profile photo.');
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Profile Cover Banner Upload & Reset actions
   */
  const handleUploadCover = async (file) => {
    try {
      setIsUploadingCover(true);
      const uploadData = new FormData();
      uploadData.append('cover_image', file);
      const res = await profileService.uploadCover(uploadData);
      toast.success('Cover photo updated successfully!');
      const newCover = res?.cover_image || res?.cover_url;
      if (newCover) {
        setFormData((prev) => ({ ...prev, cover_image: newCover }));
        setOriginalData((prev) => (prev ? { ...prev, cover_image: newCover } : prev));
      }
      await loadProfileData();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to upload cover photo.');
      toast.error(msg);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!window.confirm('Reset cover banner to default university campus photo?')) return;
    try {
      setIsUploadingCover(true);
      await profileService.deleteCover();
      toast.success('Cover banner reset to default.');
      setFormData((prev) => ({ ...prev, cover_image: '' }));
      setOriginalData((prev) => (prev ? { ...prev, cover_image: '' } : prev));
      await loadProfileData();
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to reset cover photo.');
      toast.error(msg);
    } finally {
      setIsUploadingCover(false);
    }
  };

  /**
   * Security actions
   */
  const handleChangePassword = async (credentials, onSuccess) => {
    try {
      setIsChangingPassword(true);
      await profileService.changePassword(credentials);
      toast.success('Password changed successfully.');
      if (onSuccess) onSuccess();
      setIsPasswordModalOpen(false);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to change password.');
      toast.error(msg);
      throw err;
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async (emailPayload, onSuccess) => {
    try {
      setIsChangingEmail(true);
      await profileService.changeAlumniEmail(emailPayload);
      toast.success('Personal email updated successfully.');
      setFormData((prev) => ({ ...prev, email: emailPayload.new_email }));
      setOriginalData((prev) => ({ ...prev, email: emailPayload.new_email }));
      if (onSuccess) onSuccess();
      setIsEmailModalOpen(false);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to update email address.');
      toast.error(msg);
      throw err;
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = async (confirmationText) => {
    try {
      await profileService.deleteAccount(confirmationText);
      toast.success('Account successfully deleted.');
      setIsDeleteModalOpen(false);
      logout();
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to delete account.';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Hydrating profile from database...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Tab Navigation Bar */}
      <ProfileHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* 2. Responsive 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (30% / 4 cols): Sticky Profile Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <ProfileSidebar
            profile={formData}
            user={user}
            userRole={userRole}
            stats={formData.stats || rawProfile?.stats}
            onUploadAvatar={handleUploadAvatar}
            onUploadCover={handleUploadCover}
            onDeleteCover={handleDeleteCover}
            isUploadingCover={isUploadingCover}
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
                user={user}
                formData={formData}
                onChange={handleInputChange}
                onOpenEmailModal={() => setIsEmailModalOpen(true)}
              />

              {/* Student Role Adaptive Sections */}
              {userRole === 'STUDENT' && (
                <>
                  <AcademicSection
                    formData={formData}
                    onChange={handleInputChange}
                    options={options}
                  />
                  <SkillsSection
                    skills={formData.skills}
                    onAddSkill={() => setIsAddSkillModalOpen(true)}
                    onRemoveSkill={handleRemoveSkill}
                  />
                  <LearningPlatformsSection
                    platforms={formData.learning_platforms}
                    onAddPlatform={() => setIsAddPlatformModalOpen(true)}
                    onRemovePlatform={handleRemovePlatform}
                  />
                  <SocialLinksSection
                    links={formData.social_links}
                    onAddLink={() => setIsAddSocialModalOpen(true)}
                    onRemoveLink={handleRemoveSocialLink}
                  />
                  <AIHabitsSection
                    formData={formData}
                    onChange={handleInputChange}
                    options={options}
                  />
                </>
              )}

              {/* Alumni Role Adaptive Sections */}
              {userRole === 'ALUMNI' && (
                <>
                  <CareerSection
                    formData={formData}
                    onChange={handleInputChange}
                    options={options}
                  />
                  <AcademicSection
                    formData={formData}
                    onChange={handleInputChange}
                    options={options}
                    isAlumni={true}
                    title="Alma Mater Academic Background"
                  />
                  <SkillsSection
                    skills={formData.skills}
                    onAddSkill={() => setIsAddSkillModalOpen(true)}
                    onRemoveSkill={handleRemoveSkill}
                  />
                  <SocialLinksSection
                    links={formData.social_links}
                    onAddLink={() => setIsAddSocialModalOpen(true)}
                    onRemoveLink={handleRemoveSocialLink}
                  />
                  <LearningPlatformsSection
                    platforms={formData.learning_platforms}
                    onAddPlatform={() => setIsAddPlatformModalOpen(true)}
                    onRemovePlatform={handleRemovePlatform}
                  />
                  <AIHabitsSection
                    formData={formData}
                    onChange={handleInputChange}
                    options={options}
                  />
                  <InterviewPreviewSection
                    experiences={formData.interview_experiences}
                  />
                </>
              )}

              {/* Placement Cell Institutional Governance */}
              {userRole === 'PLACEMENT_CELL' && (
                <InstitutionalTelemetrySection
                  stats={formData.stats || rawProfile?.stats}
                />
              )}
            </div>
          )}

          {/* TAB 2: Resumes & CV (Students & Alumni) */}
          {activeTab === 'resumes' && userRole !== 'PLACEMENT_CELL' && (
            <ResumesSection
              resumes={resumes}
              isUploading={isUploadingResume}
              onUpload={handleUploadResume}
              onDelete={handleDeleteResume}
              onSetPrimary={handleSetPrimaryResume}
            />
          )}

          {/* TAB 3: Security & Account (All Roles) */}
          {activeTab === 'security' && (
            <SecuritySection
              userRole={userRole}
              userEmail={user?.email || formData.email}
              isChangingPassword={isChangingPassword}
              isChangingEmail={isChangingEmail}
              onChangePassword={handleChangePassword}
              onRequestEmailOTP={profileService.requestAlumniEmailOTP}
              onChangeEmail={handleChangeEmail}
              onDeleteAccount={() => setIsDeleteModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* 3. Floating Bottom Action Bar on Dirty State */}
      <StickySaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSaveProfile}
        onDiscard={handleDiscard}
      />

      {/* 4. Interactive Modals */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
        isLoading={isChangingPassword}
      />

      <AlumniEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        currentEmail={formData.email}
        onRequestOTP={profileService.requestAlumniEmailOTP}
        onVerifyOTP={handleChangeEmail}
        onSubmit={handleChangeEmail}
        isLoading={isChangingEmail}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />

      <AddSkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        options={options}
        existingSkills={formData.skills}
        onAdd={handleAddSkill}
      />

      <AddSocialLinkModal
        isOpen={isAddSocialModalOpen}
        onClose={() => setIsAddSocialModalOpen(false)}
        options={options}
        existingPlatforms={formData.social_links}
        onAdd={handleAddSocialLink}
      />

      <AddPlatformModal
        isOpen={isAddPlatformModalOpen}
        onClose={() => setIsAddPlatformModalOpen(false)}
        options={options}
        existingPlatforms={formData.learning_platforms}
        onAdd={handleAddPlatform}
      />
    </div>
  );
}
