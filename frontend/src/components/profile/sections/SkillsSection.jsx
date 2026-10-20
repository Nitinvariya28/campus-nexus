import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

/**
 * SkillsSection Component
 * Interactive chip badges with ADVANCED, INTERMEDIATE, and BEGINNER proficiency indicators.
 * Strictly zero dummy data - shows real user skills or clean empty state.
 */
export default function SkillsSection({ skills = [], onAddSkill, onRemoveSkill }) {
  const getProficiencyClass = (level) => {
    switch (level) {
      case 'ADVANCED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'BEGINNER':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Skills & Proficiencies</h2>
        </div>
        <button
          type="button"
          onClick={onAddSkill}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Skill
        </button>
      </div>

      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {skills.map((skill, index) => {
            const skillName = skill.name || skill.skill_name || 'Skill';
            const proficiency = skill.proficiency || 'BEGINNER';
            const skillKey = skill.skill_id || skill.id || index;

            return (
              <div
                key={skillKey}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-2xs"
              >
                <span>{skillName}</span>
                <span
                  className={`px-2 py-0.5 text-2xs font-semibold rounded-full border ${getProficiencyClass(
                    proficiency
                  )}`}
                >
                  {proficiency}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveSkill && onRemoveSkill(skill.skill_id || skill.id || skill.name)}
                  className="text-slate-400 hover:text-red-600 p-0.5 rounded-sm hover:bg-slate-200 transition"
                  title={`Remove ${skillName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            No technical skills added yet. Click &apos;+ Add Skill&apos; above to highlight your core engineering proficiencies.
          </p>
        </div>
      )}
    </div>
  );
}
