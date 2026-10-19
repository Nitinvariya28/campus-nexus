import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

/**
 * SkillsSection Component
 * Interactive chip badges with ADVANCED, INTERMEDIATE, and BEGINNER proficiency indicators.
 */
export default function SkillsSection({ skills, onAddSkill, onRemoveSkill }) {
  const sampleSkills = skills && skills.length > 0 ? skills : [
    { id: 1, name: 'Python', proficiency: 'ADVANCED' },
    { id: 2, name: 'React', proficiency: 'INTERMEDIATE' },
    { id: 3, name: 'Docker', proficiency: 'BEGINNER' },
    { id: 4, name: 'SQL', proficiency: 'ADVANCED' },
  ];

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

      <div className="flex flex-wrap gap-2.5">
        {sampleSkills.map((skill) => (
          <div
            key={skill.id || skill.name}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 shadow-2xs"
          >
            <span>{skill.name}</span>
            <span
              className={`px-2 py-0.5 text-2xs font-semibold rounded-full border ${getProficiencyClass(
                skill.proficiency
              )}`}
            >
              {skill.proficiency}
            </span>
            <button
              type="button"
              onClick={() => onRemoveSkill && onRemoveSkill(skill.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm hover:bg-slate-200 transition"
              title="Remove skill"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
