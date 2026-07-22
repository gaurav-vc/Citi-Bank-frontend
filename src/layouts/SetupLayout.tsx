import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';

interface SetupLayoutProps {
  children: React.ReactNode;
}

export const SetupLayout: React.FC<SetupLayoutProps> = ({ children }) => {
  const tabs = [
    { name: 'Users & Roles', path: '/setup/users-roles' },
    { name: 'Role Permissions', path: '/setup/modules-permissions' },
    { name: 'Organizations', path: '/masters/organizations' },
    { name: 'Sites', path: '/masters/sites' },
    { name: 'Departments', path: '/masters/departments' },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        
        {/* Top Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Setup</h1>
          <p className="text-sm text-muted-foreground">
            Manage role-based access, roles, and pending requests.
          </p>
        </div>

        {/* Horizontal Pill Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm font-semibold rounded-full transition-colors",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white"
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-transparent rounded-xl">
          {children}
        </div>
      </div>
    </MainLayout>
  );
};
