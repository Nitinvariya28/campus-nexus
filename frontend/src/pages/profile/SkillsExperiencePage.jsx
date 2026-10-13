import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function SkillsExperiencePage() {
  return (
    <PlaceholderCard
      moduleName="Profile"
      title="Technical Skills & Work Experience"
      route="/profile/experience"
      description="Manage technical skills with proficiency tags, current and past employment roles for alumni, professional social links (LinkedIn, GitHub), and AI tools adoption."
      endpoints={[
        "GET /api/profiles/search/skills/?q=<term> (Infinite scroll skills search)",
        "GET /api/profiles/search/companies/?q=<term> (Company autocomplete)",
        "PATCH /api/profiles/me/ (Atomic update of skills and experience array)"
      ]}
    />
  );
}
