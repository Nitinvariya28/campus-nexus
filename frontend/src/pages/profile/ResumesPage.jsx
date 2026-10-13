import React from 'react';
import PlaceholderCard from '../../components/common/PlaceholderCard';

export default function ResumesPage() {
  return (
    <PlaceholderCard
      moduleName="Profile"
      title="Resume Document Management & ATS Insights"
      route="/profile/resumes"
      description="Upload and store multi-version resumes (PDF/DOCX up to 5MB) in isolated user directories, swap active primary resume atomically, and inspect AI-driven ATS score progress and skill suggestions."
      endpoints={[
        "GET /api/resumes/ (List user resumes with primary active flag)",
        "POST /api/resumes/ (Multipart upload: PDF/DOCX up to 5MB)",
        "PATCH /api/resumes/<id>/set-primary/ (Atomic swap of primary resume)",
        "DELETE /api/resumes/<id>/ (Delete resume and promote next available)",
        "GET /api/analytics/resumes/me/ (Personal ATS score progression & missing skills)"
      ]}
    />
  );
}
