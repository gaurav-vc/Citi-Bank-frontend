import { useAuth } from '@/contexts/AuthContext';

export interface PermissionsResult {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export function usePermissions(moduleKey: string): PermissionsResult {
  const { user } = useAuth();

  // Super Admin has unrestricted access to everything
  if (user?.role === 'super_admin') {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
    };
  }

  // Master fallback for certain setup pages available to admins
  if (['admin', 'client_admin'].includes(user?.role || '') && 
      ['core:users', 'core:settings', 'core:documentation', 'core:organizations', 'core:sites'].includes(moduleKey)) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canApprove: true,
    };
  }

  // Dynamically check user permissions object
  if (user?.permissions) {
    const perms = user.permissions[moduleKey];
    if (perms) {
      return {
        canView: !!perms.view,
        canCreate: !!perms.create,
        // Treat modify and edit interchangeably using the defined 'update' property
        canEdit: !!perms.update,
        canDelete: !!perms.delete,
        // Fallback approve to modify if not explicitly present
        canApprove: !!(perms.approve || perms.update),
      };
    }
  }

  // Default to denied if no permissions match
  return {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
  };
}
