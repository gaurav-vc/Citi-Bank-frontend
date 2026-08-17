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

  // Bypass all checks for super_admin (they see everything they click on, but their sidebar is restricted)
  if (user.role === 'super_admin') {
    return <>{children}</>;
  }

  // Always allow admin/client_admin to access Setup pages (Users & Roles, Role Permissions)
  // These are management pages not tied to module-level DB permissions
  if ((user.role === 'admin' || user.role === 'client_admin') &&
      permissionKey && ['core:users', 'core:settings'].includes(permissionKey)) {
    return <>{children}</>;
  }

  // Explicitly block Organizations and Sites for non-admin roles, even if DB says otherwise
  if (permissionKey === 'core:organizations' || permissionKey === 'core:sites') {
    if (!['super_admin', 'client_admin', 'admin'].includes(user.role)) {
      return renderError(`Access denied. You do not have the required role to access Setup & Administration pages.`);
    }
  }

  // DB-FIRST: When permissionKey is provided, use ONLY DB permissions
  if (permissionKey) {
    // Dashboard always accessible
    if (permissionKey === 'core:dashboard') return <>{children}</>;
    
    if (user.permissions) {
      const userFeaturePerms = user.permissions[permissionKey];
      if (userFeaturePerms && userFeaturePerms[action] === true) {
        return <>{children}</>;
      }
    }
    // Permission key exists in DB but access denied, OR key not in permissions at all
    return renderError(`Database permissions check failed. Feature permissions for '${permissionKey}' are missing or action '${action}' is false.`);
  }

  // ROLE FALLBACK: If NO permissionKey is provided, it means this route relies on the 'roles' array (e.g. super-admin only routes without permission keys)
  if (roles && !roles.includes(user.role as UserRole)) {
    return renderError(`Access denied. You do not have the required role to access this page.`);
  }

  return <>{children}</>;
}
