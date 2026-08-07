import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, Building, ShieldCheck, MapPin, Layers, Settings, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface Org {
  id: number;
  name: string;
  code: string;
}

interface Site {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  organization_name?: string;
}

interface Dept {
  id: number;
  site: number;
  name: string;
  description: string;
  site_name?: string;
}

interface UserHierarchy {
  user_id: string;
  user_name: string;
  email: string;
  rbac_role: string;
  organization_name?: string;
  site_name?: string;
  department_name?: string;
}

export default function EnterpriseHierarchy() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [users, setUsers] = useState<UserHierarchy[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  // Dialog Opens
  const [isOrgOpen, setIsOrgOpen] = useState(false);
  const [isSiteOpen, setIsSiteOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [permissionsPage, setPermissionsPage] = useState(1);
  const PAGE_SIZE = 12;

  // Forms State
  const [newOrg, setNewOrg] = useState({
    name: '', code: '',
    legal_name: '', company_name: '', entity_name: '', organization_type: '', industry: '',
    gst_number: '', pan_number: '', contact_email: '', contact_phone: '', website: '',
    address: '', country: '', region: '', state: '', city: '', zone: '', pincode: '',
    currency: 'INR', timezone: 'UTC', billing_type: '', billing_cycle: '', billing_term: '',
    billing_rate: '0', approval_limit: '0', white_label: false, sub_domain: '',
    billing_start_date: '', billing_end_date: '', billing_date: '', project_duration: '0', logo: '', is_active: true
  });
  const [newSite, setNewSite] = useState({
    orgId: '', name: '', code: '',
    site_type: '', site_head: '', address: '', country: '', state: '', city: '', pincode: '',
    latitude: '', longitude: '', storage_capacity: '', budget_limit: '', active_projects: '0', is_active: true
  });
  const [newDept, setNewDept] = useState({
    siteId: '', name: '', description: '',
    code: '', department_head: '', cost_center_code: '', budget_limit: '', approval_limit: '', is_active: true
  });
  const [assignUser, setAssignUser] = useState({
    userId: '',
    orgId: '',
    siteId: '',
    deptId: '',
    roleId: '',
    employee_id: '',
    designation: '',
    access_scope: 'Department',
    is_active: true
  });
  const [newRole, setNewRole] = useState({
    role_name: '', description: '',
    access_level: 'Department', approval_limit: '0',
    can_create_po: false, can_approve_po: false, can_manage_vendors: false,
    can_manage_inventory: false, can_manage_payments: false, can_manage_contracts: false,
    can_manage_users: false, can_manage_roles: false, can_export_reports: false,
    can_view_analytics: false
  });

  const [roles, setRoles] = useState<any[]>([]);
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);

  const tabs = [
    { name: 'Organizations', path: '/masters/organizations', icon: Building },
    { name: 'Sites', path: '/masters/sites', icon: MapPin },
    { name: 'Roles', path: '/masters/roles', icon: ShieldCheck },
    { name: 'Users & Contexts', path: '/masters/hierarchy', icon: Users },
    { name: 'Access Control', path: '/settings', icon: Settings },
  ];

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));

      // Load Orgs
      const orgRes = await fetch(`${base}/api/organizations/`, { headers });
      if (orgRes.ok) {
        const contentType = orgRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setOrgs(await orgRes.json());
        }
      }

      // Load Sites
      const siteRes = await fetch(`${base}/api/sites/`, { headers });
      if (siteRes.ok) {
        const contentType = siteRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setSites(await siteRes.json());
        }
      }

      // Load Depts
      const deptRes = await fetch(`${base}/api/departments/`, { headers });
      if (deptRes.ok) {
        const contentType = deptRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setDepartments(await deptRes.json());
        }
      }

      // Load Users
      const userRes = await fetch(`${base}/api/setups/users-hierarchy`, { headers });
      if (userRes.ok) {
        const contentType = userRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setUsers(await userRes.json());
        }
      }

      // Load Profiles
      const profileRes = await fetch(`${base}/api/profiles/`, { headers });
      if (profileRes.ok) {
        const contentType = profileRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setProfiles(await profileRes.json());
        }
      }

      // Load Roles
      const roleRes = await fetch(`${base}/api/roles/`, { headers });
      if (roleRes.ok) {
        const contentType = roleRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setRoles(await roleRes.json());
        }
      }

      // Load Users list
      const availUsersRes = await fetch(`${base}/api/users/`, { headers });
      if (availUsersRes.ok) {
        const contentType = availUsersRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          setAvailableUsers(await availUsersRes.json());
        }
      }

    } catch (err) {
      console.error('Error fetching enterprise configurations:', err);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/organizations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newOrg.name,
          code: newOrg.code,
          legal_name: newOrg.legal_name || null,
          company_name: newOrg.company_name || null,
          entity_name: newOrg.entity_name || null,
          organization_type: newOrg.organization_type || null,
          industry: newOrg.industry || null,
          gst_number: newOrg.gst_number || null,
          pan_number: newOrg.pan_number || null,
          contact_email: newOrg.contact_email || null,
          contact_phone: newOrg.contact_phone || null,
          website: newOrg.website || null,
          address: newOrg.address || null,
          country: newOrg.country || null,
          region: newOrg.region || null,
          state: newOrg.state || null,
          city: newOrg.city || null,
          zone: newOrg.zone || null,
          pincode: newOrg.pincode || null,
          currency: newOrg.currency,
          timezone: newOrg.timezone,
          billing_type: newOrg.billing_type || null,
          billing_cycle: newOrg.billing_cycle || null,
          billing_term: newOrg.billing_term || null,
          billing_rate: Number(newOrg.billing_rate) || 0,
          approval_limit: Number(newOrg.approval_limit) || 0,
          white_label: newOrg.white_label,
          sub_domain: newOrg.sub_domain || null,
          billing_start_date: newOrg.billing_start_date || null,
          billing_end_date: newOrg.billing_end_date || null,
          billing_date: newOrg.billing_date || null,
          project_duration: Number(newOrg.project_duration) || 0,
          logo: newOrg.logo || null,
          is_active: newOrg.is_active
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Organization created successfully' });
        setIsOrgOpen(false);
        setNewOrg({
          name: '', code: '',
          legal_name: '', company_name: '', entity_name: '', organization_type: '', industry: '',
          gst_number: '', pan_number: '', contact_email: '', contact_phone: '', website: '',
          address: '', country: '', region: '', state: '', city: '', zone: '', pincode: '',
          currency: 'INR', timezone: 'UTC', billing_type: '', billing_cycle: '', billing_term: '',
          billing_rate: '0', approval_limit: '0', white_label: false, sub_domain: '',
          billing_start_date: '', billing_end_date: '', billing_date: '', project_duration: '0', logo: '', is_active: true
        });
        fetchHierarchyData();
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          toast({ title: 'Error', description: data.error || data.detail || 'Failed to create organization', variant: 'destructive' });
        } else {
          const text = await res.text();
          toast({ title: 'Error', description: `Failed to create organization (Status ${res.status}): ${text.substring(0, 100)}`, variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/sites/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          organization: Number(newSite.orgId),
          name: newSite.name,
          code: newSite.code,
          site_type: newSite.site_type || null,
          site_head: newSite.site_head || null,
          address: newSite.address || null,
          country: newSite.country || null,
          state: newSite.state || null,
          city: newSite.city || null,
          pincode: newSite.pincode || null,
          latitude: newSite.latitude ? Number(newSite.latitude) : null,
          longitude: newSite.longitude ? Number(newSite.longitude) : null,
          storage_capacity: newSite.storage_capacity || null,
          budget_limit: Number(newSite.budget_limit) || 0,
          active_projects: Number(newSite.active_projects) || 0,
          is_active: newSite.is_active
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Site created successfully' });
        setIsSiteOpen(false);
        setNewSite({
          orgId: '', name: '', code: '',
          site_type: '', site_head: '', address: '', country: '', state: '', city: '', pincode: '',
          latitude: '', longitude: '', storage_capacity: '', budget_limit: '', active_projects: '0', is_active: true
        });
        fetchHierarchyData();
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          toast({ title: 'Error', description: data.error || data.detail || 'Failed to create site', variant: 'destructive' });
        } else {
          const text = await res.text();
          toast({ title: 'Error', description: `Failed to create site (Status ${res.status}): ${text.substring(0, 100)}`, variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/departments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newDept.name,
          description: newDept.description,
          site: Number(newDept.siteId),
          code: newDept.code || null,
          department_head: newDept.department_head || null,
          cost_center_code: newDept.cost_center_code || null,
          budget_limit: Number(newDept.budget_limit) || 0,
          approval_limit: Number(newDept.approval_limit) || 0,
          is_active: newDept.is_active
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Department created successfully' });
        setIsDeptOpen(false);
        setNewDept({
          siteId: '', name: '', description: '',
          code: '', department_head: '', cost_center_code: '', budget_limit: '', approval_limit: '', is_active: true
        });
        fetchHierarchyData();
      } else {
        const text = await res.clone().text();
        console.log('Create department failed response text:', text);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          let errorMsg = 'Failed to create department';
          if (data.error) {
            errorMsg = data.error;
          } else if (data.detail) {
            errorMsg = data.detail;
          } else if (typeof data === 'object') {
            errorMsg = Object.entries(data)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join(' | ');
          }
          toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: `Failed to create department (Status ${res.status}): ${text.substring(0, 100)}`, variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/profiles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          user: assignUser.userId || null,
          organization: assignUser.orgId ? Number(assignUser.orgId) : null,
          site: assignUser.siteId ? Number(assignUser.siteId) : null,
          department: assignUser.deptId ? Number(assignUser.deptId) : null,
          role: assignUser.roleId ? Number(assignUser.roleId) : null,
          employee_id: assignUser.employee_id || null,
          designation: assignUser.designation || null,
          access_scope: assignUser.access_scope,
          is_active: assignUser.is_active
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'User profile assignment configured successfully' });
        setIsAssignOpen(false);
        setAssignUser({
          userId: '',
          orgId: '',
          siteId: '',
          deptId: '',
          roleId: '',
          employee_id: '',
          designation: '',
          access_scope: 'Department',
          is_active: true
        });
        fetchHierarchyData();
      } else {
        const text = await res.clone().text();
        console.log('Save user profile mapping failed response text:', text);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          let errorMsg = 'Failed to assign user context';
          if (data.error) {
            errorMsg = data.error;
          } else if (data.detail) {
            errorMsg = data.detail;
          } else if (typeof data === 'object') {
            errorMsg = Object.entries(data)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join(' | ');
          }
          toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: `Failed to assign user context (Status ${res.status}): ${text.substring(0, 100)}`, variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/roles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          role_name: newRole.role_name,
          description: newRole.description,
          access_level: newRole.access_level,
          approval_limit: Number(newRole.approval_limit) || 0,
          can_create_po: newRole.can_create_po,
          can_approve_po: newRole.can_approve_po,
          can_manage_vendors: newRole.can_manage_vendors,
          can_manage_inventory: newRole.can_manage_inventory,
          can_manage_payments: newRole.can_manage_payments,
          can_manage_contracts: newRole.can_manage_contracts,
          can_manage_users: newRole.can_manage_users,
          can_manage_roles: newRole.can_manage_roles,
          can_export_reports: newRole.can_export_reports,
          can_view_analytics: newRole.can_view_analytics
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Role created successfully' });
        setIsNewRoleOpen(false);
        setNewRole({
          role_name: '', description: '',
          access_level: 'Department', approval_limit: '0',
          can_create_po: false, can_approve_po: false, can_manage_vendors: false,
          can_manage_inventory: false, can_manage_payments: false, can_manage_contracts: false,
          can_manage_users: false, can_manage_roles: false, can_export_reports: false,
          can_view_analytics: false
        });
        fetchHierarchyData();
      } else {
        const text = await res.clone().text();
        console.log('Create role failed response text:', text);
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          let errorMsg = 'Failed to create role';
          if (data.error) {
            errorMsg = data.error;
          } else if (data.detail) {
            errorMsg = data.detail;
          } else if (typeof data === 'object') {
            errorMsg = Object.entries(data)
              .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
              .join(' | ');
          }
          toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        } else {
          toast({ title: 'Error', description: `Failed to create role (Status ${res.status}): ${text.substring(0, 100)}`, variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // Static Matrix mapping for premium representation under settings page
  const permissionsMatrix = [
    { feature: 'Dashboard Overview (core:dashboard)', super_admin: true, cxo: true, manager: true, executive: true, engineer: true },
    { feature: 'Vendor Management (procurement:vendors)', super_admin: true, cxo: true, manager: true, executive: true, engineer: false },
    { feature: 'Items & Rates (procurement:items)', super_admin: true, cxo: true, manager: true, executive: true, engineer: true },
    { feature: 'Contract Controls (procurement:contracts)', super_admin: true, cxo: true, manager: true, executive: false, engineer: false },
    { feature: 'Budget Control (procurement:budgets)', super_admin: true, cxo: true, manager: true, executive: false, engineer: false },
    { feature: 'Purchase Orders (procurement:orders)', super_admin: true, cxo: true, manager: true, executive: true, engineer: false },
    { feature: 'Requisitions/Indents (procurement:indents)', super_admin: true, cxo: true, manager: true, executive: true, engineer: true },
    { feature: 'Inventory Controls (procurement:inventory)', super_admin: true, cxo: false, manager: true, executive: true, engineer: true },
    { feature: 'Approvals & Workflows (procurement:approvals)', super_admin: true, cxo: true, manager: true, executive: false, engineer: false },
    { feature: 'AI Spend Insights (procurement:ai)', super_admin: true, cxo: true, manager: true, executive: false, engineer: false },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5 border-muted">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Enterprise Control Center</h1>
            <p className="text-muted-foreground text-sm">
              Configure and administer organizational structures, boundary limits, and active user roles.
            </p>
          </div>
        </div>

        {/* Premium Horizontal Navigation Bar */}
        <div className="flex border-b border-muted overflow-x-auto gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentPath === tab.path || (tab.path === '/masters/hierarchy' && currentPath === '/masters/hierarchy');
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary font-semibold bg-primary/5 rounded-t-md"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        {currentPath === '/masters/organizations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Registered Organizations</h2>
                <p className="text-muted-foreground text-xs">Manage corporate entities and subsidiaries</p>
              </div>
              <Dialog open={isOrgOpen} onOpenChange={setIsOrgOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </DialogTrigger>
                 <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Organization</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage add organization details and actions here.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrg} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Org Name</Label>
                        <Input value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Org Code</Label>
                        <Input value={newOrg.code} onChange={e => setNewOrg({ ...newOrg, code: e.target.value })} required />
                      </div>
                      <div>
                        <Label>Legal Name</Label>
                        <Input value={newOrg.legal_name} onChange={e => setNewOrg({ ...newOrg, legal_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Company Name</Label>
                        <Input value={newOrg.company_name} onChange={e => setNewOrg({ ...newOrg, company_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Entity Name</Label>
                        <Input value={newOrg.entity_name} onChange={e => setNewOrg({ ...newOrg, entity_name: e.target.value })} />
                      </div>
                      <div>
                        <Label>Organization Type</Label>
                        <Input value={newOrg.organization_type} onChange={e => setNewOrg({ ...newOrg, organization_type: e.target.value })} />
                      </div>
                      <div>
                        <Label>Industry</Label>
                        <Input value={newOrg.industry} onChange={e => setNewOrg({ ...newOrg, industry: e.target.value })} />
                      </div>
                      <div>
                        <Label>GST Number</Label>
                        <Input value={newOrg.gst_number} onChange={e => setNewOrg({ ...newOrg, gst_number: e.target.value })} />
                      </div>
                      <div>
                        <Label>PAN Number</Label>
                        <Input value={newOrg.pan_number} onChange={e => setNewOrg({ ...newOrg, pan_number: e.target.value })} />
                      </div>
                      <div>
                        <Label>Contact Email</Label>
                        <Input type="email" value={newOrg.contact_email} onChange={e => setNewOrg({ ...newOrg, contact_email: e.target.value })} />
                      </div>
                      <div>
                        <Label>Contact Phone</Label>
                        <Input value={newOrg.contact_phone} onChange={e => setNewOrg({ ...newOrg, contact_phone: e.target.value })} />
                      </div>
                      <div>
                        <Label>Website</Label>
                        <Input value={newOrg.website} onChange={e => setNewOrg({ ...newOrg, website: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label>Address</Label>
                        <Textarea value={newOrg.address} onChange={e => setNewOrg({ ...newOrg, address: e.target.value })} />
                      </div>
                      <div>
                        <Label>Country</Label>
                        <Input value={newOrg.country} onChange={e => setNewOrg({ ...newOrg, country: e.target.value })} />
                      </div>
                      <div>
                        <Label>Region</Label>
                        <Input value={newOrg.region} onChange={e => setNewOrg({ ...newOrg, region: e.target.value })} />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input value={newOrg.state} onChange={e => setNewOrg({ ...newOrg, state: e.target.value })} />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input value={newOrg.city} onChange={e => setNewOrg({ ...newOrg, city: e.target.value })} />
                      </div>
                      <div>
                        <Label>Zone</Label>
                        <Input value={newOrg.zone} onChange={e => setNewOrg({ ...newOrg, zone: e.target.value })} />
                      </div>
                      <div>
                        <Label>Pincode</Label>
                        <Input value={newOrg.pincode} onChange={e => setNewOrg({ ...newOrg, pincode: e.target.value })} />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <Input value={newOrg.currency} onChange={e => setNewOrg({ ...newOrg, currency: e.target.value })} />
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Input value={newOrg.timezone} onChange={e => setNewOrg({ ...newOrg, timezone: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Type</Label>
                        <Input value={newOrg.billing_type} onChange={e => setNewOrg({ ...newOrg, billing_type: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Cycle</Label>
                        <Input value={newOrg.billing_cycle} onChange={e => setNewOrg({ ...newOrg, billing_cycle: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Term</Label>
                        <Input value={newOrg.billing_term} onChange={e => setNewOrg({ ...newOrg, billing_term: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Rate</Label>
                        <Input type="number" step="0.01" value={newOrg.billing_rate} onChange={e => setNewOrg({ ...newOrg, billing_rate: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Start Date</Label>
                        <Input type="date" value={newOrg.billing_start_date} onChange={e => setNewOrg({ ...newOrg, billing_start_date: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing End Date</Label>
                        <Input type="date" value={newOrg.billing_end_date} onChange={e => setNewOrg({ ...newOrg, billing_end_date: e.target.value })} />
                      </div>
                      <div>
                        <Label>Billing Date</Label>
                        <Input type="date" value={newOrg.billing_date} onChange={e => setNewOrg({ ...newOrg, billing_date: e.target.value })} />
                      </div>
                      <div>
                        <Label>Project Duration (Days)</Label>
                        <Input type="number" value={newOrg.project_duration} onChange={e => setNewOrg({ ...newOrg, project_duration: e.target.value })} />
                      </div>
                      <div>
                        <Label>Approval Limit</Label>
                        <Input type="number" step="0.01" value={newOrg.approval_limit} onChange={e => setNewOrg({ ...newOrg, approval_limit: e.target.value })} />
                      </div>
                      <div>
                        <Label>Sub Domain</Label>
                        <Input value={newOrg.sub_domain} onChange={e => setNewOrg({ ...newOrg, sub_domain: e.target.value })} />
                      </div>
                      <div>
                        <Label>Logo Link</Label>
                        <Input value={newOrg.logo} onChange={e => setNewOrg({ ...newOrg, logo: e.target.value })} />
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input type="checkbox" id="white_label" checked={newOrg.white_label} onChange={e => setNewOrg({ ...newOrg, white_label: e.target.checked })} />
                        <Label htmlFor="white_label" className="cursor-pointer">White Label Enablement</Label>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input type="checkbox" id="is_active_org" checked={newOrg.is_active} onChange={e => setNewOrg({ ...newOrg, is_active: e.target.checked })} />
                        <Label htmlFor="is_active_org" className="cursor-pointer">Active Status</Label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {orgs.map(org => {
                const orgSites = sites.filter(s => s.organization_id === org.id);
                return (
                  <Card key={org.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold">{org.name}</CardTitle>
                      <Building className="h-4.5 w-4.5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-primary">{org.code}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {orgSites.length} Active Sites Configured
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complete Org-Site Tree View</CardTitle>
                <CardDescription>Logical layout of corporate entities mapped to geographical locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orgs.map(org => {
                  const orgSites = sites.filter(s => s.organization_id === org.id);
                  return (
                    <div key={org.id} className="border-l-2 border-primary pl-4 py-1">
                      <div className="flex items-center gap-2 font-bold text-foreground">
                        <Building className="h-4 w-4 text-primary" />
                        <span>{org.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">({org.code})</span>
                      </div>
                      <div className="ml-4 mt-2 space-y-3">
                        {orgSites.map(site => {
                          const siteDepts = departments.filter(d => d.site === site.id);
                          return (
                            <div key={site.id} className="border-l border-muted pl-4 py-1">
                              <div className="flex items-center gap-2 font-medium text-foreground text-sm">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{site.name}</span>
                              </div>
                              <div className="ml-4 mt-1 space-y-1">
                                {siteDepts.map(dept => (
                                  <div key={dept.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Layers className="h-3 w-3" />
                                    <span>{dept.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {currentPath === '/masters/sites' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Campus & Site Locations</h2>
                <p className="text-muted-foreground text-xs">Configure physical sites and map departments to them</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isSiteOpen} onOpenChange={setIsSiteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Site
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Site</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage add site details and actions here.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSite} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Organization</Label>
                          <Select onValueChange={val => setNewSite({ ...newSite, orgId: val })}>
                            <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                            <SelectContent>
                              {orgs.map(o => <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Site Name</Label>
                          <Input value={newSite.name} onChange={e => setNewSite({ ...newSite, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Site Code</Label>
                          <Input value={newSite.code} onChange={e => setNewSite({ ...newSite, code: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Site Type</Label>
                          <Input value={newSite.site_type} onChange={e => setNewSite({ ...newSite, site_type: e.target.value })} />
                        </div>
                        <div>
                          <Label>Site Head</Label>
                          <Input value={newSite.site_head} onChange={e => setNewSite({ ...newSite, site_head: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <Label>Address</Label>
                          <Textarea value={newSite.address} onChange={e => setNewSite({ ...newSite, address: e.target.value })} />
                        </div>
                        <div>
                          <Label>Country</Label>
                          <Input value={newSite.country} onChange={e => setNewSite({ ...newSite, country: e.target.value })} />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input value={newSite.state} onChange={e => setNewSite({ ...newSite, state: e.target.value })} />
                        </div>
                        <div>
                          <Label>City</Label>
                          <Input value={newSite.city} onChange={e => setNewSite({ ...newSite, city: e.target.value })} />
                        </div>
                        <div>
                          <Label>Pincode</Label>
                          <Input value={newSite.pincode} onChange={e => setNewSite({ ...newSite, pincode: e.target.value })} />
                        </div>
                        <div>
                          <Label>Latitude</Label>
                          <Input type="number" step="0.000001" value={newSite.latitude} onChange={e => setNewSite({ ...newSite, latitude: e.target.value })} />
                        </div>
                        <div>
                          <Label>Longitude</Label>
                          <Input type="number" step="0.000001" value={newSite.longitude} onChange={e => setNewSite({ ...newSite, longitude: e.target.value })} />
                        </div>
                        <div>
                          <Label>Storage Capacity</Label>
                          <Input value={newSite.storage_capacity} onChange={e => setNewSite({ ...newSite, storage_capacity: e.target.value })} />
                        </div>
                        <div>
                          <Label>Budget Limit</Label>
                          <Input type="number" step="0.01" value={newSite.budget_limit} onChange={e => setNewSite({ ...newSite, budget_limit: e.target.value })} />
                        </div>
                        <div>
                          <Label>Active Projects</Label>
                          <Input type="number" value={newSite.active_projects} onChange={e => setNewSite({ ...newSite, active_projects: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 mt-6 col-span-2">
                          <input type="checkbox" id="is_active_site" checked={newSite.is_active} onChange={e => setNewSite({ ...newSite, is_active: e.target.checked })} />
                          <Label htmlFor="is_active_site" className="cursor-pointer">Active Status</Label>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Create</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDeptOpen} onOpenChange={setIsDeptOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Dept
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Department</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage add department details and actions here.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateDept} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label>Site</Label>
                          <Select onValueChange={val => setNewDept({ ...newDept, siteId: val })}>
                            <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                            <SelectContent>
                              {sites.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.organization_name})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Dept Name</Label>
                          <Input value={newDept.name} onChange={e => setNewDept({ ...newDept, name: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Dept Code</Label>
                          <Input value={newDept.code} onChange={e => setNewDept({ ...newDept, code: e.target.value })} />
                        </div>
                        <div>
                          <Label>Department Head</Label>
                          <Input value={newDept.department_head} onChange={e => setNewDept({ ...newDept, department_head: e.target.value })} />
                        </div>
                        <div>
                          <Label>Cost Center Code</Label>
                          <Input value={newDept.cost_center_code} onChange={e => setNewDept({ ...newDept, cost_center_code: e.target.value })} />
                        </div>
                        <div>
                          <Label>Budget Limit</Label>
                          <Input type="number" step="0.01" value={newDept.budget_limit} onChange={e => setNewDept({ ...newDept, budget_limit: e.target.value })} />
                        </div>
                        <div>
                          <Label>Approval Limit</Label>
                          <Input type="number" step="0.01" value={newDept.approval_limit} onChange={e => setNewDept({ ...newDept, approval_limit: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Textarea value={newDept.description} onChange={e => setNewDept({ ...newDept, description: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-2 mt-6 col-span-2">
                          <input type="checkbox" id="is_active_dept" checked={newDept.is_active} onChange={e => setNewDept({ ...newDept, is_active: e.target.checked })} />
                          <Label htmlFor="is_active_dept" className="cursor-pointer">Active Status</Label>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Create</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {sites.map(site => {
                const siteDepts = departments.filter(d => d.site === site.id);
                return (
                  <Card key={site.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold">{site.name}</CardTitle>
                      <MapPin className="h-4.5 w-4.5 text-primary" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Organization</span>
                        <p className="text-xs text-foreground font-medium">{site.organization_name || 'Global Context'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Site Code</span>
                        <p className="text-xs font-mono text-foreground">{site.code}</p>
                      </div>
                      <div className="pt-2">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Active Departments</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {siteDepts.length > 0 ? (
                            siteDepts.map(d => (
                              <span key={d.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                {d.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">No departments configured</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {currentPath === '/masters/roles' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Available System Roles</h2>
                <p className="text-muted-foreground text-xs">View default roles mapping to active permissions</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Role</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage add role details and actions here.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateRole} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Role Name</Label>
                          <Input value={newRole.role_name} onChange={e => setNewRole({ ...newRole, role_name: e.target.value })} required />
                        </div>
                        <div>
                          <Label>Access Level</Label>
                          <Select value={newRole.access_level} onValueChange={val => setNewRole({ ...newRole, access_level: val })}>
                            <SelectTrigger><SelectValue placeholder="Select Access Level" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Global">Global</SelectItem>
                              <SelectItem value="Organization">Organization</SelectItem>
                              <SelectItem value="Site">Site</SelectItem>
                              <SelectItem value="Department">Department</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Approval Limit</Label>
                          <Input type="number" step="0.01" value={newRole.approval_limit} onChange={e => setNewRole({ ...newRole, approval_limit: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Textarea value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })} />
                        </div>

                        <div className="col-span-2 font-semibold text-sm border-b pb-1">Permissions</div>

                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_create_po" checked={newRole.can_create_po} onChange={e => setNewRole({ ...newRole, can_create_po: e.target.checked })} />
                          <Label htmlFor="can_create_po" className="cursor-pointer">Can Create PO</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_approve_po" checked={newRole.can_approve_po} onChange={e => setNewRole({ ...newRole, can_approve_po: e.target.checked })} />
                          <Label htmlFor="can_approve_po" className="cursor-pointer">Can Approve PO</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_vendors" checked={newRole.can_manage_vendors} onChange={e => setNewRole({ ...newRole, can_manage_vendors: e.target.checked })} />
                          <Label htmlFor="can_manage_vendors" className="cursor-pointer">Can Manage Vendors</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_inventory" checked={newRole.can_manage_inventory} onChange={e => setNewRole({ ...newRole, can_manage_inventory: e.target.checked })} />
                          <Label htmlFor="can_manage_inventory" className="cursor-pointer">Can Manage Inventory</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_payments" checked={newRole.can_manage_payments} onChange={e => setNewRole({ ...newRole, can_manage_payments: e.target.checked })} />
                          <Label htmlFor="can_manage_payments" className="cursor-pointer">Can Manage Payments</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_contracts" checked={newRole.can_manage_contracts} onChange={e => setNewRole({ ...newRole, can_manage_contracts: e.target.checked })} />
                          <Label htmlFor="can_manage_contracts" className="cursor-pointer">Can Manage Contracts</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_users" checked={newRole.can_manage_users} onChange={e => setNewRole({ ...newRole, can_manage_users: e.target.checked })} />
                          <Label htmlFor="can_manage_users" className="cursor-pointer">Can Manage Users</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_manage_roles" checked={newRole.can_manage_roles} onChange={e => setNewRole({ ...newRole, can_manage_roles: e.target.checked })} />
                          <Label htmlFor="can_manage_roles" className="cursor-pointer">Can Manage Roles</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_export_reports" checked={newRole.can_export_reports} onChange={e => setNewRole({ ...newRole, can_export_reports: e.target.checked })} />
                          <Label htmlFor="can_export_reports" className="cursor-pointer">Can Export Reports</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="can_view_analytics" checked={newRole.can_view_analytics} onChange={e => setNewRole({ ...newRole, can_view_analytics: e.target.checked })} />
                          <Label htmlFor="can_view_analytics" className="cursor-pointer">Can View Analytics</Label>
                        </div>
                      </div>
                      <Button type="submit" className="w-full">Create</Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Assign User Context & Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Assign User contexts</DialogTitle>
                      <DialogDescription>Assign context and roles to user profile</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignUser} className="space-y-4">
                      <div>
                        <Label>User</Label>
                        <Select onValueChange={val => setAssignUser({ ...assignUser, userId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                          <SelectContent>
                            {availableUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.username} ({u.email})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Organization</Label>
                        <Select onValueChange={val => setAssignUser({ ...assignUser, orgId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                          <SelectContent>
                            {orgs.map(o => <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Site</Label>
                        <Select onValueChange={val => setAssignUser({ ...assignUser, siteId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                          <SelectContent>
                            {sites.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <Select onValueChange={val => setAssignUser({ ...assignUser, deptId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                          <SelectContent>
                            {departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>RBAC Role Mapping</Label>
                        <Select onValueChange={val => setAssignUser({ ...assignUser, roleId: val })}>
                          <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                          <SelectContent>
                            {roles.map(r => {
                              const rName = typeof r === 'object' ? r.role_name : r;
                              const rId = typeof r === 'object' ? r.id.toString() : r;
                              return <SelectItem key={rId} value={rId}>{rName}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Employee ID</Label>
                        <Input value={assignUser.employee_id} onChange={e => setAssignUser({ ...assignUser, employee_id: e.target.value })} />
                      </div>
                      <div>
                        <Label>Designation</Label>
                        <Input value={assignUser.designation} onChange={e => setAssignUser({ ...assignUser, designation: e.target.value })} />
                      </div>
                      <div>
                        <Label>Access Scope</Label>
                        <Select value={assignUser.access_scope} onValueChange={val => setAssignUser({ ...assignUser, access_scope: val })}>
                          <SelectTrigger><SelectValue placeholder="Select Access Scope" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Global">Global</SelectItem>
                            <SelectItem value="Organization">Organization</SelectItem>
                            <SelectItem value="Site">Site</SelectItem>
                            <SelectItem value="Department">Department</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <input type="checkbox" id="is_active_profile_roles" checked={assignUser.is_active} onChange={e => setAssignUser({ ...assignUser, is_active: e.target.checked })} />
                        <Label htmlFor="is_active_profile_roles" className="cursor-pointer">Active Status</Label>
                      </div>
                      <Button type="submit" className="w-full">Assign</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {roles.map(role => {
                const rName = typeof role === 'object' ? role.role_name : role;
                const rId = typeof role === 'object' ? role.id : role;
                const assignedCount = profiles.filter(p => {
                  const pRoleName = p.role_name || (p.role && p.role.role_name);
                  return pRoleName && pRoleName.toLowerCase() === rName.toLowerCase();
                }).length;
                return (
                  <Card key={rId} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-semibold">{rName}</CardTitle>
                      <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{assignedCount}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Active assigned users
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {(currentPath === '/masters/hierarchy' || currentPath === '/masters/users') && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">User Hierarchy Assignments</h2>
                <p className="text-muted-foreground text-xs">Assign user boundary contexts (Organization, Site, Department) and Roles</p>
              </div>
              <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Assign Context & Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Assign User contexts</DialogTitle>
                    <DialogDescription>Assign context and roles to user profile</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAssignUser} className="space-y-4">
                    <div>
                      <Label>User</Label>
                      <Select onValueChange={val => setAssignUser({ ...assignUser, userId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                        <SelectContent>
                          {availableUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.username} ({u.email})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Organization</Label>
                      <Select onValueChange={val => setAssignUser({ ...assignUser, orgId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Organization" /></SelectTrigger>
                        <SelectContent>
                          {orgs.map(o => <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Site</Label>
                      <Select onValueChange={val => setAssignUser({ ...assignUser, siteId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Site" /></SelectTrigger>
                        <SelectContent>
                          {sites.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select onValueChange={val => setAssignUser({ ...assignUser, deptId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>RBAC Role Mapping</Label>
                      <Select onValueChange={val => setAssignUser({ ...assignUser, roleId: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                        <SelectContent>
                          {roles.map(r => {
                            const rName = typeof r === 'object' ? r.role_name : r;
                            const rId = typeof r === 'object' ? r.id.toString() : r;
                            return <SelectItem key={rId} value={rId}>{rName}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Employee ID</Label>
                      <Input value={assignUser.employee_id} onChange={e => setAssignUser({ ...assignUser, employee_id: e.target.value })} />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input value={assignUser.designation} onChange={e => setAssignUser({ ...assignUser, designation: e.target.value })} />
                    </div>
                    <div>
                      <Label>Access Scope</Label>
                      <Select value={assignUser.access_scope} onValueChange={val => setAssignUser({ ...assignUser, access_scope: val })}>
                        <SelectTrigger><SelectValue placeholder="Select Access Scope" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Global">Global</SelectItem>
                          <SelectItem value="Organization">Organization</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="Department">Department</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <input type="checkbox" id="is_active_profile_hierarchy" checked={assignUser.is_active} onChange={e => setAssignUser({ ...assignUser, is_active: e.target.checked })} />
                      <Label htmlFor="is_active_profile_hierarchy" className="cursor-pointer">Active Status</Label>
                    </div>
                    <Button type="submit" className="w-full">Assign</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Org Context</th>
                        <th className="py-2.5 px-3">Site / Dept</th>
                        <th className="py-2.5 px-3">Active RBAC Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE).map(u => (
                        <tr key={u.user_id} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-3">
                            <p className="font-semibold text-sm">{u.user_name}</p>
                            <p className="text-[10px] text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-medium">
                            {u.organization_name || '-'}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {u.site_name ? `${u.site_name} / ${u.department_name || 'All'}` : '-'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-primary">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              {u.rbac_role || 'No Mapping'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                      <DataTablePagination
                        currentPage={usersPage}
                        totalPages={Math.ceil(users.length / PAGE_SIZE)}
                        onPageChange={setUsersPage}
                        onNextPage={() => setUsersPage((p) => Math.min(Math.ceil(users.length / PAGE_SIZE), p + 1))}
                        onPrevPage={() => setUsersPage((p) => Math.max(1, p - 1))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPath === '/settings' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-foreground">Access Control Matrix (RBAC)</h2>
              <p className="text-muted-foreground text-xs font-medium">Granular module configurations and permission mappings per role</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b bg-muted/60">
                        <th className="py-3 px-4 font-bold text-foreground">Feature Keys</th>
                        <th className="py-3 px-2 text-center font-bold text-foreground">Super Admin</th>
                        <th className="py-3 px-2 text-center font-bold text-foreground">CXO</th>
                        <th className="py-3 px-2 text-center font-bold text-foreground">Procurement Mgr</th>
                        <th className="py-3 px-2 text-center font-bold text-foreground">Procurement Exec</th>
                        <th className="py-3 px-2 text-center font-bold text-foreground">Site Eng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissionsMatrix.slice((permissionsPage - 1) * PAGE_SIZE, permissionsPage * PAGE_SIZE).map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/30">
                          <td className="py-3 px-4 font-medium">{item.feature}</td>
                          <td className="py-3 px-2 text-center">
                            {item.super_admin ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/45 mx-auto" />}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.cxo ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/45 mx-auto" />}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.manager ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/45 mx-auto" />}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.executive ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/45 mx-auto" />}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {item.engineer ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/45 mx-auto" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {permissionsMatrix.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                      <DataTablePagination
                        currentPage={permissionsPage}
                        totalPages={Math.ceil(permissionsMatrix.length / PAGE_SIZE)}
                        onPageChange={setPermissionsPage}
                        onNextPage={() => setPermissionsPage((p) => Math.min(Math.ceil(permissionsMatrix.length / PAGE_SIZE), p + 1))}
                        onPrevPage={() => setPermissionsPage((p) => Math.max(1, p - 1))}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
