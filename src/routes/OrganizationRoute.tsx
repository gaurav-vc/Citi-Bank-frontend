import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationRouteProps {
  children: React.ReactNode;
}

export function OrganizationRoute({ children }: OrganizationRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin / HOD role checks bypass organization restrictions if needed
  const ORGANIZATION_BYPASS_ROLES = [
    'super_admin',
    'cxo'
  ];

  if (ORGANIZATION_BYPASS_ROLES.some(role => user.role.toLowerCase().includes(role))) {
    return <>{children}</>;
  }

  // Add Debug Logging
  console.log('[OrganizationRoute Debug]', {
    role: user.role,
    organization_id: user.profile?.organization_id,
    organization_name: user.profile?.organization_name,
    profile: user.profile,
    blocked: !user.profile || !user.profile.organization_id,
    reason: !user.profile ? 'profile is null' : (!user.profile.organization_id ? 'organization_id is null/missing' : 'none')
  });

  // Restrict routes if user does not belong to any Organization context
  if (!user.profile || !user.profile.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl border-2 border-rose-500 max-w-lg w-full">
          <h2 className="text-xl font-bold text-rose-600 mb-2 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> Missing Organization Context
          </h2>
          <div className="text-slate-700 font-mono text-sm bg-slate-100 p-3 rounded border space-y-2 mb-4">
            <p><strong>Reason:</strong> Your profile has not been assigned to any Organization.</p>
            <p><strong>Current Role:</strong> {user.role}</p>
            <p><strong>Profile Attached:</strong> {user.profile ? 'Yes' : 'No'}</p>
            <p><strong>Organization ID:</strong> {user.profile?.organization_id || 'null'}</p>
            <p><strong>Bypass Roles:</strong> {ORGANIZATION_BYPASS_ROLES.join(', ')}</p>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Please contact an administrator to bind your account to a specific Organization node in the Users & Roles setup.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-bold"
            >
              Return to Dashboard
            </button>
            <a 
              href="/login"
              className="flex-1 px-4 py-2 bg-rose-100 text-rose-700 text-center rounded hover:bg-rose-200 font-bold"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
