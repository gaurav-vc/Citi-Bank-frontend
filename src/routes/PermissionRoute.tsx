import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface PermissionRouteProps {
  children: React.ReactNode;
  roles: UserRole[];
  permissionKey?: string | string[];
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

  const keysToCheck = permissionKey ? (Array.isArray(permissionKey) ? permissionKey : [permissionKey]) : [];


  // DB-FIRST: When permissionKey is provided, use ONLY DB permissions
  if (keysToCheck.length > 0) {
    // Dashboard always accessible
    if (keysToCheck.includes('core:dashboard')) return <>{children}</>;
    
    if (user.permissions) {
      for (const key of keysToCheck) {
        const userFeaturePerms = user.permissions[key];
        if (userFeaturePerms && userFeaturePerms[action] === true) {
          return <>{children}</>;
        }
      }
    }
    // Permission key exists in DB but access denied, OR key not in permissions at all
    return renderError(`Database permissions check failed. Feature permissions for '${keysToCheck.join(', ')}' are missing or action '${action}' is false.`);
  }

  // ROLE FALLBACK: If NO permissionKey is provided, it means this route relies on the 'roles' array (e.g. super-admin only routes without permission keys)
  if (roles) {
    const isAllowed = roles.includes(user.role as UserRole) || 
                     (roles.includes('cxo' as UserRole) && (user.role || '').toLowerCase().includes('cxo'));
    if (!isAllowed) {
      return renderError(`Access denied. You do not have the required role to access this page.`);
    }
  }

  return <>{children}</>;
}
