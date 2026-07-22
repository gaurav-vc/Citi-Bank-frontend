import React, { useMemo, useState } from "react";
import { MODULE_ACCESS_SECTIONS, allModuleKeys } from "../utils/moduleAccessSections";

interface ModuleAccessPanelProps {
  moduleState: Record<string, boolean>;
  onModuleChange: (key: string, value: boolean) => void;
  onSelectAllModules: (on: boolean) => void;
}

export default function ModuleAccessPanel({
  moduleState,
  onModuleChange,
  onSelectAllModules,
}: ModuleAccessPanelProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("Admin");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    MODULE_ACCESS_SECTIONS.reduce((acc, s) => {
      acc[s.title] = s.defaultOpen !== false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const keys = useMemo(() => allModuleKeys(), []);
  const searchLower = search.trim().toLowerCase();
  const selectAll = keys.length > 0 && keys.every((k) => moduleState[k]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleModule = (fullKey: string) => {
    onModuleChange(fullKey, !moduleState[fullKey]);
  };

  const filteredSections = useMemo(() => {
    if (!searchLower) return MODULE_ACCESS_SECTIONS;
    return MODULE_ACCESS_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((it) => it.label.toLowerCase().includes(searchLower)),
    })).filter((sec) => sec.items.length > 0);
  }, [searchLower]);

  return (
    <div className="module-access-panel space-y-4">
      <h3 className="add-site-section-heading">Module Access</h3>

      <div className="module-access-toolbar flex flex-col sm:flex-row justify-between gap-4">
        <input
          className="filter-input module-search-input w-full sm:w-64 p-2 border rounded-lg text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          placeholder="Search modules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="primary-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          + Add Module
        </button>
      </div>

      <div className="module-access-toolbar-secondary flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
        <label className="module-select-all flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={(e) => onSelectAllModules(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Select All Modules</span>
        </label>

        <div className="flex items-center gap-4">
          <button type="button" className="ghost-btn px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Bulk Import (CSV)
          </button>
          <div className="module-role-row flex items-center gap-2">
            <label htmlFor="assignRole" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Assign to Role:</label>
            <select
              id="assignRole"
              className="filter-input module-role-select p-2 border rounded-lg text-sm font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
      </div>

      <div className="module-grid-container mt-6 p-1">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-4 mb-6">
            <h4 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{section.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {section.items.map((item) => {
                const fullKey = `${section.id}:${item.key}`;
                return (
                  <label key={fullKey} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!moduleState[fullKey]}
                      onChange={() => toggleModule(fullKey)}
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800 cursor-pointer transition-all"
                    />
                    <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">{item.label}</span>
                  </label>
                );
              })}
            </div>
            {idx < filteredSections.length - 1 && (
              <hr className="border-slate-100 dark:border-slate-800/60 mt-6" />
            )}
          </div>
        ))}
        {filteredSections.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            No modules found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
