import React, { useState, useMemo } from 'react';
import { X, Sparkles, Search, Check, Layers, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * AddSkillModal Component
 * Interactive visual skill selector with real-time search, category filters,
 * interactive card chips, and proficiency picker.
 * Strictly zero dummy data - dynamically populated from database options.
 */
export default function AddSkillModal({ isOpen, onClose, options, existingSkills = [], onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState('INTERMEDIATE');

  // Extract all categories and skills from master options
  const groupedSkills = options?.technical_skills_form?.top_20_grouped_skills || [];

  const { allSkills, categories } = useMemo(() => {
    const skillsList = [];
    const catSet = new Set();

    groupedSkills.forEach((group) => {
      const catLabel =
        group.category_name ||
        group.category_display ||
        (group.category_type && group.category_type !== 'OTHER' ? group.category_type : '') ||
        'General';

      catSet.add(catLabel);

      (group.skills || []).forEach((s) => {
        skillsList.push({
          id: s.id,
          name: s.name,
          category: catLabel,
        });
      });
    });

    return {
      allSkills: skillsList,
      categories: Array.from(catSet),
    };
  }, [groupedSkills]);

  const existingSkillIds = useMemo(() => {
    return new Set(existingSkills.map((s) => Number(s.skill_id || s.id)));
  }, [existingSkills]);

  // Filter skills by search query and selected category
  const filteredSkills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allSkills.filter((s) => {
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allSkills, searchQuery, selectedCategory]);

  const selectedSkill = useMemo(() => {
    return allSkills.find((s) => String(s.id) === String(selectedSkillId));
  }, [allSkills, selectedSkillId]);

  if (!isOpen) return null;

  const handleSelectSkill = (s) => {
    if (existingSkillIds.has(Number(s.id))) {
      toast.error(`"${s.name}" is already in your profile.`);
      return;
    }
    setSelectedSkillId(s.id);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error('Please select a skill from the list.');
      return;
    }

    if (!selectedSkill) {
      toast.error('Invalid skill selection.');
      return;
    }

    onAdd({
      skill_id: Number(selectedSkill.id),
      name: selectedSkill.name,
      category: selectedSkill.category,
      proficiency,
    });

    setSelectedSkillId('');
    setSearchQuery('');
    setSelectedCategory('ALL');
    setProficiency('INTERMEDIATE');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Add Technical Skill</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose verified skill from university master catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill (e.g. React, Python, Docker, SQL)..."
              className="w-full bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition text-2xs ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                All ({allSkills.length})
              </button>
              {categories.map((cat) => {
                const count = allSkills.filter((s) => s.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition text-2xs flex items-center gap-1 ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] opacity-75 ${selectedCategory === cat ? 'text-blue-100' : 'text-slate-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Interactive Skill Selection Cards Grid */}
          <div className="flex-1 min-h-[160px] max-h-[220px] overflow-y-auto border border-slate-200/80 rounded-xl p-2 bg-slate-50/40">
            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredSkills.map((s) => {
                  const isSelected = String(s.id) === String(selectedSkillId);
                  const isAlreadyAdded = existingSkillIds.has(Number(s.id));

                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleSelectSkill(s)}
                      className={`flex items-center justify-between text-left p-2.5 rounded-lg border transition-all text-xs ${
                        isAlreadyAdded
                          ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-medium truncate">{s.name}</div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {s.category}
                        </span>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 shrink-0">
                          Added
                        </span>
                      ) : isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400 space-y-1">
                <AlertCircle className="w-6 h-6 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">No matching skills found</p>
                <p className="text-2xs text-slate-400">Try searching with a different keyword</p>
              </div>
            )}
          </div>

          {/* Active Skill Indicator */}
          {selectedSkill && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50/80 border border-blue-200/80 text-xs">
              <span className="text-blue-900 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" /> Selected: <strong className="font-bold">{selectedSkill.name}</strong> ({selectedSkill.category})
              </span>
              <button
                type="button"
                onClick={() => setSelectedSkillId('')}
                className="text-2xs text-blue-600 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Proficiency Level Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Proficiency Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { level: 'BEGINNER', label: 'Beginner', desc: 'Foundational' },
                { level: 'INTERMEDIATE', label: 'Intermediate', desc: 'Practical' },
                { level: 'ADVANCED', label: 'Advanced', desc: 'Expert' },
              ].map(({ level, label, desc }) => {
                const isActive = proficiency === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setProficiency(level)}
                    className={`py-2 px-2 text-center rounded-xl border transition-all text-xs ${
                      isActive
                        ? level === 'ADVANCED'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold ring-1 ring-emerald-500 shadow-2xs'
                          : level === 'INTERMEDIATE'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-semibold ring-1 ring-blue-500 shadow-2xs'
                          : 'border-slate-400 bg-slate-100 text-slate-800 font-semibold ring-1 ring-slate-400 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold">{label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSkillId}
              className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                selectedSkillId
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Add to Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
