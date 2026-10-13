import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function AcademicDetailsPage() {
  return (
    <PlaceholderCard
      moduleName="Profile"
      title="Academic Records & Credentials"
      route="/profile/academics"
      description="Detailed records of department, enrolled program, graduation batch year, roll number, semester CGPA progression, and campus milestones."
      endpoints={[
        "GET /api/profiles/me/ (Student academic records)",
        "GET /api/profiles/options/ (Selectable department and batch choices)"
      ]}
    />
  );
}
