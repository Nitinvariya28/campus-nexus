import React, { useState, useMemo, useRef } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Send,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Check,
  Briefcase,
} from 'lucide-react';
import RoundDetailRow from '../RoundDetailRow';
import CompanyCombobox from '../../common/CompanyCombobox';
import RoleCombobox from '../../common/RoleCombobox';

const EXPERIENCE_TYPES = [
  { value: 'PLACEMENT', label: 'Full-Time Placement' },
  { value: 'INTERNSHIP', label: 'Internship Drive' },
  { value: 'OTHER', label: 'Other Opportunity' },
];

const INTERVIEW_RESULTS = [
  { value: 'SELECTED', label: 'Selected / Offer Extended' },
  { value: 'NOT_SELECTED', label: 'Not Selected' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'NOT_DISCLOSED', label: 'Not Disclosed' },
];

const DIFFICULTY_LEVELS = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'VERY_HARD', label: 'Very Hard' },
];

/**
 * InterviewExperienceForm
 * Detailed role-adaptive interview breakdown form for Alumni.
 * Features CompanyCombobox, exact backend choices, and compact tabbed round builder.
 */
export default function InterviewExperienceForm({
  options,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const companies = useMemo(() => options?.companies || [], [options?.companies]);
  const roundTypes = useMemo(() => options?.round_types || [], [options?.round_types]);
  const roundModes = useMemo(() => options?.round_modes || [], [options?.round_modes]);

  // Step Wizard State (1: Company & Outcome, 2: Narrative, 3: Rounds)
  const [currentStep, setCurrentStep] = useState(1);
  const step3EnteredAtRef = useRef(0);

  // Form Fields
  const [companyId, setCompanyId] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [experienceType, setExperienceType] = useState('PLACEMENT');
  const [result, setResult] = useState('SELECTED');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [experience, setExperience] = useState('');
  const [preparation, setPreparation] = useState('');
  const [rounds, setRounds] = useState([
    {
      round_number: 1,
      round_type: 'ONLINE_ASSESSMENT',
      mode: 'ONLINE',
      duration_minutes: 60,
      topics: '',
      description: '',
    },
  ]);

  const [activeRoundTab, setActiveRoundTab] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const handleAddRound = () => {
    const nextNum = rounds.length + 1;
    const newRound = {
      round_number: nextNum,
      round_type: nextNum === 2 ? 'TECHNICAL' : 'HR',
      mode: 'ONLINE',
      duration_minutes: 45,
      topics: '',
      description: '',
    };
    setRounds([...rounds, newRound]);
    setActiveRoundTab(rounds.length);
  };

  const handleUpdateRound = (index, updatedRound) => {
    const nextRounds = [...rounds];
    nextRounds[index] = updatedRound;
    setRounds(nextRounds);

    // Clear round-specific validation errors on change
    if (validationErrors[`round_${index}_topics`] || validationErrors[`round_${index}_description`]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        if (updatedRound.topics?.trim()) delete next[`round_${index}_topics`];
        if (updatedRound.description?.trim().length >= 10) delete next[`round_${index}_description`];
        return next;
      });
    }
  };

  const handleRemoveRound = (index) => {
    if (rounds.length <= 1) return;
    const filtered = rounds.filter((_, i) => i !== index).map((r, idx) => ({
      ...r,
      round_number: idx + 1,
    }));
    setRounds(filtered);
    setActiveRoundTab(Math.max(0, activeRoundTab - 1));
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!companyId) errors.companyId = 'Please select a company.';
      if (!roleTitle || !roleTitle.trim()) errors.roleTitle = 'Role title is required (e.g. SDE-1).';
    } else if (step === 2) {
      if (!experience.trim() || experience.trim().length < 15) {
        errors.experience = 'Please provide an overall journey narrative (min 15 characters).';
      }
    } else if (step === 3) {
      if (!rounds || rounds.length === 0) {
        errors.rounds = 'Please configure at least one interview round.';
      } else {
        rounds.forEach((r, idx) => {
          if (!r.topics || !r.topics.trim()) {
            errors[`round_${idx}_topics`] = `Round ${idx + 1}: Key topics covered is required.`;
          }
          if (!r.description || r.description.trim().length < 10) {
            errors[`round_${idx}_description`] = `Round ${idx + 1}: Please enter round experience & questions asked (min 10 characters).`;
          }
        });
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(3, currentStep + 1);
      if (nextStep === 3) {
        step3EnteredAtRef.current = Date.now();
      }
      setCurrentStep(nextStep);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleFinalSubmit = (e) => {
    e?.preventDefault?.();
    if (currentStep !== 3) return;

    // Safety guard: prevent immediate double-click through from Step 2 Next button (500ms window)
    if (Date.now() - step3EnteredAtRef.current < 500) {
      return;
    }

    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);

    if (!step1Valid) {
      setCurrentStep(1);
      return;
    }
    if (!step2Valid) {
      setCurrentStep(2);
      return;
    }
    if (!step3Valid) {
      // Find first round that has missing details and automatically focus its tab
      const firstErrorRoundIdx = rounds.findIndex(
        (r) => !r.topics?.trim() || !r.description?.trim() || r.description.trim().length < 10
      );
      if (firstErrorRoundIdx !== -1) {
        setActiveRoundTab(firstErrorRoundIdx);
      }
      return;
    }

    const payload = {
      entity_type: 'INTERVIEW_EXPERIENCE',
      company_id: parseInt(companyId),
      role_id: roleId,
      role_title: roleTitle.trim(),
      experience_type: experienceType,
      result: result,
      difficulty: difficulty,
      experience: experience.trim(),
      preparation: preparation.trim(),
      rounds: rounds.map((r, idx) => ({
        round_number: idx + 1,
        round_type: r.round_type || 'ONLINE_ASSESSMENT',
        mode: r.mode || 'ONLINE',
        duration_minutes: parseInt(r.duration_minutes) || 45,
        topics: (r.topics || '').trim(),
        description: (r.description || '').trim(),
      })),
    };

    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      {submitError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{typeof submitError === 'string' ? submitError : 'Failed to publish interview experience.'}</span>
        </div>
      )}

      {/* Horizontal Multi-Step Progress Stepper */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Company & Outcome' },
            { num: 2, label: 'Overall Narrative' },
            { num: 3, label: `Interview Rounds (${rounds.length})` },
          ].map((st, idx) => {
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <React.Fragment key={st.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (st.num < currentStep || validateStep(currentStep)) {
                      setCurrentStep(st.num);
                    }
                  }}
                  className="flex items-center gap-2 text-left cursor-pointer transition-colors"
                >
                  <span
                    className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white ring-2 ring-blue-100'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                  </span>
                  <span
                    className={`text-xs font-semibold hidden sm:inline ${
                      isActive ? 'text-blue-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
                {idx < 2 && <div className="flex-1 h-0.5 bg-slate-200 mx-2 sm:mx-4" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Company, Role & Outcome */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Target Company <span className="text-red-500">*</span>
            </label>
            <CompanyCombobox
              companies={companies}
              selectedCompanyId={companyId}
              onChange={({ companyId: cId }) => setCompanyId(cId || '')}
              placeholder="Search target company (e.g. Microsoft, Google)..."
            />
            {validationErrors.companyId && (
              <p className="text-2xs text-red-600 font-medium">{validationErrors.companyId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Target Role / Position <span className="text-red-500">*</span>
            </label>
            <RoleCombobox
              companyId={companyId}
              companyRoles={options?.company_roles || []}
              commonRoles={options?.common_roles || []}
              selectedRoleId={roleId}
              roleTitle={roleTitle}
              onChange={({ roleId: rId, roleTitle: rTitle }) => {
                setRoleId(rId);
                setRoleTitle(rTitle);
              }}
              hasError={!!validationErrors.roleTitle}
              placeholder="Select job role from options or type custom role (e.g. SDE-1)..."
            />
            {validationErrors.roleTitle && (
              <p className="text-2xs text-red-600 font-medium">{validationErrors.roleTitle}</p>
            )}
          </div>

          {/* Experience Channel Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Opportunity Channel
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {EXPERIENCE_TYPES.map((t) => {
                const isSelected = experienceType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setExperienceType(t.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outcome Result Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Final Result
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {INTERVIEW_RESULTS.map((r) => {
                const isSelected = result === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setResult(r.value)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? r.value === 'SELECTED'
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                          : 'bg-rose-600 text-white border-rose-600 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Gauge */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Overall Process Difficulty</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {DIFFICULTY_LEVELS.map((d) => {
                const isSelected = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDifficulty(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Narrative & Preparation */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Overall Journey & Process Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Summarize the overall hiring timeline, interview atmosphere, and key takeaways..."
              className={`w-full text-sm rounded-lg border p-3 bg-white text-slate-900 focus:outline-hidden focus:ring-2 shadow-2xs leading-relaxed ${
                validationErrors.experience
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
              }`}
            />
            {validationErrors.experience && (
              <p className="text-2xs text-red-600 font-medium">{validationErrors.experience}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Preparation Tips & Resources for Juniors
            </label>
            <textarea
              rows={4}
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              placeholder="Recommended LeetCode sheets, mock interview tips, DSA topics..."
              className="w-full text-sm rounded-lg border border-slate-300 p-3 bg-white text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* STEP 3: Rounds Breakdown with Compact Switcher */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Round Validation Error Notice */}
          {Object.keys(validationErrors).some((k) => k.startsWith('round_') || k === 'rounds') && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>
                {validationErrors.rounds ||
                  'Please complete key topics and questions asked for each round before publishing.'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {rounds.map((r, idx) => {
                const isSelected = activeRoundTab === idx;
                const roundHasError =
                  !!validationErrors[`round_${idx}_topics`] ||
                  !!validationErrors[`round_${idx}_description`];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveRoundTab(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      roundHasError
                        ? 'border-red-400 bg-red-50 text-red-700 font-semibold'
                        : isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Round {idx + 1}</span>
                    {roundHasError && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleAddRound}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-dashed border-blue-400 bg-blue-50/50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Round</span>
              </button>
            </div>
          </div>

          {rounds[activeRoundTab] && (
            <RoundDetailRow
              round={rounds[activeRoundTab]}
              index={activeRoundTab}
              totalRounds={rounds.length}
              onChange={(updated) => handleUpdateRound(activeRoundTab, updated)}
              onRemove={() => handleRemoveRound(activeRoundTab)}
              roundTypes={roundTypes}
              roundModes={roundModes}
              errors={{
                topics: validationErrors[`round_${activeRoundTab}_topics`],
                description: validationErrors[`round_${activeRoundTab}_description`],
              }}
            />
          )}
        </div>
      )}

      {/* Step Navigation & Submission Footer */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        <div>
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Interview Breakdown</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
