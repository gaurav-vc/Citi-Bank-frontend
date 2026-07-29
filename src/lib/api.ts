const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getHeaders() {
  const token = localStorage.getItem('campusspend_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

// Organizations
export interface Organization {
  id: number;
  name: string;
  code: string;
  status: string;
  legal_name?: string;
  company_name?: string;
  entity_name?: string;
  organization_type?: string;
  industry?: string;
  gst_number?: string;
  pan_number?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: string;
  country?: string;
  region?: string;
  state?: string;
  city?: string;
  zone?: string;
  pincode?: string;
  currency?: string;
  timezone?: string;
  billing_type?: string;
  billing_cycle?: string;
  billing_term?: string;
  billing_rate?: string;
  billing_start_date?: string;
  billing_end_date?: string;
  billing_date?: string;
  project_duration?: number;
  white_label?: boolean;
  sub_domain?: string;
  approval_limit?: string;
  logo?: string;
  is_active?: boolean;
  created_at?: string;
}

export const api = {
  // Organizations
  getOrganizations: () => request<Organization[]>('/api/organizations/'),
  getOrganization: (id: string | number) => request<Organization>(`/api/organizations/${id}/`),
  createOrganization: (data: Partial<Organization>) => request<Organization>('/api/organizations/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateOrganization: (id: number | string, data: any) => request<any>(`/api/organizations/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOrganization: (id: number | string) => request<void>(`/api/organizations/${id}/`, { method: 'DELETE' }),

  // Sites
  getSites: () => request<any[]>('/api/sites/'),
  getSite: (id: string | number) => request<any>(`/api/sites/${id}/`),
  createSite: (data: any) => request<any>('/api/sites/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSite: (id: string | number, data: any) => request<any>(`/api/sites/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteSite: (id: string | number) => request<void>(`/api/sites/${id}/`, {
    method: 'DELETE'
  }),

  // Departments
  getDepartments: () => request<any[]>('/api/departments/'),
  getDepartment: (id: string | number) => request<any>(`/api/departments/${id}/`),
  createDepartment: (data: any) => request<any>('/api/departments/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateDepartment: (id: string | number, data: any) => request<any>(`/api/departments/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteDepartment: (id: string | number) => request<void>(`/api/departments/${id}/`, {
    method: 'DELETE'
  }),

  // Roles
  getRoles: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/roles/${qs}`);
  },
  getRole: (id: string | number) => request<any>(`/api/roles/${id}/`),
  createRole: (data: any) => request<any>('/api/roles/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateRole: (id: string | number, data: any) => request<any>(`/api/roles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteRole: (id: string | number) => request<void>(`/api/roles/${id}/`, {
    method: 'DELETE'
  }),

  // Role Module Permissions
  getRoleModulePermissions: () => request<any[]>('/api/role-module-permissions/'),
  saveRoleModulePermission: (data: any) => request<any>('/api/role-module-permissions/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateRoleModulePermission: (id: string | number, data: any) => request<any>(`/api/role-module-permissions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteRoleModulePermission: (id: string | number) => request<void>(`/api/role-module-permissions/${id}/`, {
    method: 'DELETE'
  }),
  syncAppRoutes: (role_id: string | number) => request<any>('/api/role-module-permissions/sync-routes/', {
    method: 'POST',
    body: JSON.stringify({ role_id })
  }),

  // Workflow Rules
  getWorkflowRules: (module: string) => request<any[]>(`/api/workflow-rules/?module=${module}`),
  createWorkflowRule: (data: any) => request<any>('/api/workflow-rules/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateWorkflowRule: (id: string | number, data: any) => request<any>(`/api/workflow-rules/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteWorkflowRule: (id: string | number) => request<void>(`/api/workflow-rules/${id}/`, {
    method: 'DELETE'
  }),

  // Users Hierarchy and profiles context mapping
  getUsers: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/users/${qs}`);
  },
  getPendingUsers: () => request<any[]>('/api/users/pending/'),
  approveUser: (id: string | number) => request<any>(`/api/users/${id}/approve/`, {
    method: 'POST'
  }),
  rejectUser: (id: string | number) => request<any>(`/api/users/${id}/reject/`, {
    method: 'POST'
  }),
  createUser: (data: any) => request<any>('/api/users/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUser: (id: string | number, data: any) => request<any>(`/api/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteUser: (id: string | number) => request<void>(`/api/users/${id}/`, {
    method: 'DELETE'
  }),
  getUsersHierarchy: () => request<any[]>('/api/setups/users-hierarchy'),
  assignUserContext: (data: {
    userId: string;
    organizationId: string | number | null;
    siteId: string | number | null;
    departmentId: string | number | null;
    role: string | null;
  }) => request<any>('/api/assign-user/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Role Access Mappings
  getRoleAccessMappings: () => request<any[]>('/api/setups/role-access-mappings/'),
  createRoleAccessMapping: (data: any) => request<any>('/api/setups/role-access-mappings/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateRoleAccessMapping: (id: string | number, data: any) => request<any>(`/api/setups/role-access-mappings/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  // Dashboard Stats/Metrics
  getDashboardMetrics: () => request<any>('/api/dashboard/metrics/'),

  // Site Admin Provisioning
  provisionSiteAdmin: (data: {
    site_id: number;
    admin_name: string;
    admin_email: string;
    admin_role: string;          // role assigned to the site admin
    module_configuration: Record<string, boolean>;
  }) => request<{
    success: boolean;
    user_created: boolean;
    email_sent: boolean;
    admin_email: string;
    admin_role: string;
    role_label: string;
    site_name: string;
    org_name: string;
    permissions_count: number;
    temp_password: string;       // always returned now
    console_mode: boolean;       // true when using Django console email backend
    warning?: string;
  }>('/api/provision-site-admin/', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

