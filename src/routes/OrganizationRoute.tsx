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

  if (ORGANIZATION_BYPASS_ROLES.includes(user.role)) {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Missing Organization Context</h1>
          <p className="text-muted-foreground">
            Your profile has not been assigned to any Organization. Please contact an administrator to bind your account to a specific Organization node.
          </p>
          <a href="/login" className="inline-block text-primary hover:underline">
            Go back to Login
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
