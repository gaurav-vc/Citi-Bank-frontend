import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface PermissionRouteProps {
  children: React.ReactNode;
  roles: UserRole[];
  permissionKey?: string;
  action?: 'view' | 'create' | 'update' | 'delete';
}

export function PermissionRoute({
  children,
  roles,
  permissionKey,
  action = 'view',
}: PermissionRouteProps) {
  const { user, isLoading } = useAuth();

  const renderError = (reason: string) => (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl border-2 border-rose-500 max-w-lg w-full">
        <h2 className="text-xl font-bold text-rose-600 mb-2 flex items-center gap-2">
          <span className="text-2xl">⚠️</span> Access Denied
        </h2>
        <div className="text-slate-700 font-mono text-sm bg-slate-100 p-3 rounded border space-y-2">
          <p><strong>Reason:</strong> {reason}</p>
          <p><strong>User Role:</strong> {user?.role}</p>
          <p><strong>Required Roles:</strong> {roles.join(', ')}</p>
          <p><strong>Required Permission Key:</strong> {permissionKey || 'None'}</p>
          <p><strong>Required Action:</strong> {action}</p>
        </div>
        <button 
          onClick={() => window.location.href = '/dashboard'}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 w-full font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

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

  // Bypass all checks for super_admin
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }

  // Explicitly restrict Budget Planning from non-permitted roles
  if (permissionKey === 'procurement:budgets' && !['super_admin', 'finance_executive', 'finance_manager', 'facility_manager', 'project_head', 'cxo'].includes(user.role)) {
    return renderError("User role not in hardcoded allowed list for procurement:budgets");
  }

  const keys = user.permissions ? Object.keys(user.permissions) : [];
  const hasDbPermissions = keys.length > 1 || (keys.length === 1 && keys[0] !== 'core:dashboard');

  // Always allow admin/client_admin to access Setup pages (Users & Roles, Role Permissions)
  // These are management pages not tied to module-level DB permissions
  if ((user.role === 'admin' || user.role === 'client_admin') &&
      permissionKey && ['core:users', 'core:settings'].includes(permissionKey)) {
    return <>{children}</>;
  }

  // DB-FIRST: When user has permissions from the database, use ONLY those
  if (hasDbPermissions && permissionKey) {
    // Dashboard always accessible
    if (permissionKey === 'core:dashboard') return <>{children}</>;
    const userFeaturePerms = user.permissions![permissionKey];
    if (userFeaturePerms && userFeaturePerms[action] === true) {
      return <>{children}</>;
    }
    // Permission key exists in DB but access denied, OR key not in permissions at all
    return renderError(`Database permissions check failed. Feature permissions for '${permissionKey}' are missing or action '${action}' is false.`);
  }

  // ROLE FALLBACK: User has no DB permissions — fall back to static role list
  const effectiveRole = (user.role === 'cxo_citi' || user.role === 'cxo_emb') ? 'cxo' : user.role;
  if (!roles.includes(effectiveRole as UserRole)) {
    return renderError(`Role fallback check failed. Effective role '${effectiveRole}' is not in the required roles list.`);
  }

  return <>{children}</>;
}
