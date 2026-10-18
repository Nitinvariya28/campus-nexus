import { useState, useEffect, useCallback } from 'react';
import { fetchPostCreationOptions } from '../../services/community/communityService';
import { useAuth } from '../../context/AuthContext';

/**
 * Custom hook to load dynamic post creation options based on the authenticated user's role.
 * Endpoints: GET /api/community/posts/options/
 */
export function usePostOptions() {
  const { user } = useAuth();
  const [options, setOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPostCreationOptions();
      setOptions(data);
    } catch (err) {
      console.warn('Failed to load post creation options from backend:', err);
      setError(err?.response?.data?.error || err.message || 'Could not load form options');
      
      // Fallback defaults based on role if API is unreachable
      const role = user?.role || 'STUDENT';
      if (role === 'STUDENT') {
        setOptions({
          allowed_entity_types: ['STANDARD_POST'],
          post_types: [
            { value: 'INTERNSHIP', label: 'Internship' },
            { value: 'INTERVIEW_EXPERIENCE', label: 'Interview Experience' },
            { value: 'GENERAL', label: 'General' },
            { value: 'COMPANY_INFO', label: 'Company Info' },
          ],
          companies: [],
          tags: [],
        });
      } else if (role === 'ALUMNI') {
        setOptions({
          allowed_entity_types: ['STANDARD_POST', 'INTERVIEW_EXPERIENCE'],
          post_types: [
            { value: 'PLACEMENT_EXPERIENCE', label: 'Placement Experience' },
            { value: 'INTERVIEW_EXPERIENCE', label: 'Interview Experience' },
            { value: 'INTERNSHIP', label: 'Internship' },
            { value: 'CAREER_ADVICE', label: 'Career Advice' },
            { value: 'COMPANY_INFO', label: 'Company Info' },
            { value: 'GENERAL', label: 'General' },
          ],
          experience_types: [
            { value: 'PLACEMENT', label: 'Full-Time Placement' },
            { value: 'INTERNSHIP', label: 'Internship Drive' },
            { value: 'OTHER', label: 'Other Opportunity' },
          ],
          interview_results: [
            { value: 'SELECTED', label: 'Selected / Offered' },
            { value: 'NOT_SELECTED', label: 'Not Selected' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'NOT_DISCLOSED', label: 'Not Disclosed' },
          ],
          difficulty_levels: [
            { value: 'EASY', label: 'Easy' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HARD', label: 'Hard' },
            { value: 'VERY_HARD', label: 'Very Hard' },
          ],
          round_types: [
            { value: 'ONLINE_ASSESSMENT', label: 'Online Assessment (OA)' },
            { value: 'TECHNICAL', label: 'Technical Interview' },
            { value: 'CODING', label: 'Live Coding' },
            { value: 'SYSTEM_DESIGN', label: 'System Design' },
            { value: 'HR', label: 'HR / Behavioral' },
            { value: 'MANAGERIAL', label: 'Managerial' },
            { value: 'GROUP_DISCUSSION', label: 'Group Discussion' },
            { value: 'OTHER', label: 'Other Round' },
          ],
          round_modes: [
            { value: 'ONLINE', label: 'Online' },
            { value: 'OFFLINE', label: 'In-Person (Offline)' },
            { value: 'HYBRID', label: 'Hybrid' },
            { value: 'NOT_SPECIFIED', label: 'Not Specified' },
          ],
          common_roles: [
            'Software Development Engineer (SDE)',
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'Data Scientist',
            'Machine Learning Engineer',
            'DevOps Engineer',
            'Cloud Architect',
            'Product Manager',
            'UI/UX Designer',
            'Security Analyst / Cybersecurity',
            'Quality Assurance (QA) / SDET',
            'Data Analyst / Business Analyst',
          ],
          company_roles: [],
          companies: [],
          tags: [],
        });
      } else if (role === 'PLACEMENT_CELL') {
        setOptions({
          allowed_entity_types: ['OPPORTUNITY', 'ANNOUNCEMENT'],
          opportunity_types: [
            { value: 'FULL_TIME', label: 'Full Time' },
            { value: 'INTERNSHIP', label: 'Internship' },
            { value: 'INTERNSHIP_PERFORMANCE', label: 'Internship + PPO' },
          ],
          work_modes: [
            { value: 'ON_SITE', label: 'On-site' },
            { value: 'HYBRID', label: 'Hybrid' },
            { value: 'REMOTE', label: 'Remote' },
          ],
          employment_types: [
            { value: 'PERMANENT', label: 'Permanent' },
            { value: 'CONTRACT', label: 'Contract' },
            { value: 'SEASONAL', label: 'Seasonal' },
          ],
          announcement_types: [
            { value: 'DRIVE_SCHEDULE', label: 'Placement Drive Schedule' },
            { value: 'POLICY_UPDATE', label: 'Policy Update' },
            { value: 'SHORTLIST_RELEASE', label: 'Shortlist Release' },
            { value: 'GENERAL_NOTICE', label: 'General Notice' },
          ],
          target_audiences: [
            { value: 'ALL', label: 'All Students' },
            { value: 'FINAL_YEAR', label: 'Final Year Only' },
            { value: 'THIRD_YEAR', label: 'Third Year (Internship)' },
            { value: 'SPECIFIC_BRANCH', label: 'Specific Branch' },
          ],
          departments: [],
          batches: [],
          skills: [],
          companies: [],
          tags: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    options,
    isLoading,
    error,
    reloadOptions: loadOptions,
  };
}

export default usePostOptions;
