import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Search, Plus, Edit, Trash2, Shield, Users, Check, X,
  ChevronRight, UserCircle2, Save, KeyRound, ShieldAlert, Eye
} from "lucide-react";

const CATEGORIES = [
  { id: "dashboard", label: "Dashboard", keys: ["core:dashboard"] },
  { id: "procurement", label: "Procurement", keys: ["procurement:indents", "procurement:items"] },
  { id: "inventory", label: "Inventory", keys: ["procurement:inventory", "procurement:grn"] },
  { id: "finance", label: "Finance", keys: ["procurement:billing", "procurement:payments", "procurement:expenses", "procurement:budgets"] },
  { id: "vendors", label: "Vendors", keys: ["procurement:vendors", "procurement:contracts"] },
  { id: "rfq", label: "RFQ", keys: ["procurement:rfqs"] },
  { id: "po", label: "PO", keys: ["procurement:orders"] },
  { id: "reports", label: "Reports", keys: ["procurement:reports", "procurement:ai"] },
  { id: "approvals", label: "Approvals", keys: ["procurement:workflows"] },
  { id: "setup", label: "Setup", keys: ["core:users", "core:organizations", "core:sites", "core:departments"] }
];

const ACTIONS = ["view", "create", "modify", "delete", "approve"] as const;
type ActionKey = typeof ACTIONS[number];

import { MainLayout } from "@/components/layout/MainLayout";
export default function SuperAdminUsersRoles() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"roles" | "users" | "permissions" | "pending">("roles");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });


  // Role form states for switches
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [crossDeptAccess, setCrossDeptAccess] = useState(false);

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Permissions matrix states
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [matrixPerms, setMatrixPerms] = useState<Record<string, Record<ActionKey, boolean>>>({});

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles", selectedOrgId, selectedSiteId],
    queryFn: () => api.getRoles({ organization_id: selectedOrgId, site_id: selectedSiteId }),
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", selectedOrgId, selectedSiteId],
    queryFn: () => api.getUsers({ organization_id: selectedOrgId, site_id: selectedSiteId }),
  });

  const { data: pendingUsers = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["pending-users"],
    queryFn: api.getPendingUsers,
  });

  const { data: permissionsList = [] } = useQuery({
    queryKey: ["role-module-permissions"],
    queryFn: api.getRoleModulePermissions,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: api.getDepartments,
  });


  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  // Load permissions when selectedRoleId or permissionsList changes
  useEffect(() => {
    if (!selectedRoleId) {
      setMatrixPerms({});
      return;
    }

    const loadedPerms: Record<string, Record<ActionKey, boolean>> = {};
    CATEGORIES.forEach(cat => {
      loadedPerms[cat.id] = { view: false, create: false, modify: false, delete: false, approve: false };
      cat.keys.forEach(key => {
        const dbPerm = permissionsList.find((p: any) => String(p.role) === String(selectedRoleId) && p.module_key === key);
        if (dbPerm) {
          if (dbPerm.can_view) loadedPerms[cat.id].view = true;
          if (dbPerm.can_create) loadedPerms[cat.id].create = true;
          if (dbPerm.can_edit) loadedPerms[cat.id].modify = true;
          if (dbPerm.can_delete) loadedPerms[cat.id].delete = true;
          if (dbPerm.can_approve) loadedPerms[cat.id].approve = true;
        }
      });
    });
    setMatrixPerms(loadedPerms);
  }, [selectedRoleId, permissionsList]);

  // Load switches state when role form opens
  useEffect(() => {
    if (editingRole) {
      setCanManageUsers(!!editingRole.can_manage_users);
      setCanApprove(!!editingRole.can_approve_po);
      setCrossDeptAccess(!!editingRole.cross_dept_access);
    } else {
      setCanManageUsers(false);
      setCanApprove(false);
      setCrossDeptAccess(false);
    }
  }, [editingRole, isRoleModalOpen]);

  // Mutators for Roles
  const saveRoleMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return api.updateRole(data.id, data);
      }
      return api.createRole(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Role details saved successfully." });
      setIsRoleModalOpen(false);
      setEditingRole(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save role.", variant: "destructive" });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Success", description: "Role removed successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to remove role.", variant: "destructive" });
    }
  });

  // Mutators for Users
  const saveUserMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.id) {
        return api.updateUser(data.id, data);
      }
      return api.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Success", description: "User details saved successfully." });
      setIsUserModalOpen(false);
      setEditingUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save user.", variant: "destructive" });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string | number) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Success", description: "User removed successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete user.", variant: "destructive" });
    }
  });

  // Pending approval/rejection mutations
  const approveUserMutation = useMutation({
    mutationFn: (id: string | number) => api.approveUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Approved", description: "User has been approved and activated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to approve user.", variant: "destructive" });
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: (id: string | number) => api.rejectUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-users"] });
      toast({ title: "Rejected", description: "Registration has been rejected." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to reject user.", variant: "destructive" });
    }
  });

  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const promises: Promise<any>[] = [];
      CATEGORIES.forEach(cat => {
        const catPerms = matrixPerms[cat.id] || { view: false, create: false, modify: false, delete: false, approve: false };
        cat.keys.forEach(key => {
          const existing = permissionsList.find((p: any) => String(p.role) === String(selectedRoleId) && p.module_key === key);
          const payload = {
            can_view: !!catPerms.view,
            can_create: !!catPerms.create,
            can_edit: !!catPerms.modify,
            can_delete: !!catPerms.delete,
            can_approve: !!catPerms.approve
          };
          if (existing) {
            promises.push(api.updateRoleModulePermission(existing.id, payload));
          } else {
            promises.push(api.saveRoleModulePermission({
              role: Number(selectedRoleId),
              module_key: key,
              ...payload
            }));
          }
        });
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-module-permissions"] });
      toast({ title: "Success", description: "Permissions saved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save permissions.", variant: "destructive" });
    }
  });

  // Filtering Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((r: any) => {
      const q = searchQuery.toLowerCase();
      return (
        r.role_name?.toLowerCase().includes(q) ||
        r.role_code?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    });
  }, [roles, searchQuery]);

  // Filtering Users
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const q = searchQuery.toLowerCase();
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const empId = (u.profile?.employee_id || "").toLowerCase();
      return name.includes(q) || email.includes(q) || empId.includes(q);
    });
  }, [users, searchQuery]);

  const generatedEmpId = useMemo(() => {
    if (editingUser) return editingUser.profile?.employee_id || "";
    const nextNum = users.length + 1;
    return `EMP${String(nextNum).padStart(3, '0')}`;
  }, [editingUser, users]);

  // Form Handlers
  const handleRoleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      role_name: formData.get("role_name"),
      role: formData.get("role_name"),
      role_code: formData.get("role_code"),
      department_id: formData.get("department") || null,
      organization_id: formData.get("organization_id") || null,
      site_id: formData.get("site_id") || null,
      access_level: formData.get("access_level") || null,
      dashboard_type: formData.get("dashboard_type") || null,
      can_manage_users: canManageUsers,
      can_approve_po: canApprove,
      cross_dept_access: crossDeptAccess,
      status: "Active",
    };

    if (editingRole) {
      payload.id = editingRole.id;
    }

    saveRoleMutation.mutate(payload);
  };

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role") || null,
      department: formData.get("department") || null,
      department_id: formData.get("department") || null,
      organization_id: formData.get("organization") || null,
      site: formData.get("site") || null,
      site_id: formData.get("site") || null,
      employee_id: formData.get("employee_id"),
      designation: formData.get("designation"),
      mobile: formData.get("mobile"),
      reporting_manager: formData.get("reporting_manager") || null,
      is_active: formData.get("is_active") === "on",
    };

    if (editingUser) {
      payload.id = editingUser.id;
    }

    saveUserMutation.mutate(payload);
  };

  const togglePermission = (catId: string, action: ActionKey, checked: boolean) => {
    setMatrixPerms(prev => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || { view: false, create: false, modify: false, delete: false, approve: false }),
        [action]: checked
      }
    }));
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      "bg-orange-100 text-orange-700 dark:bg-orange-950/35 dark:text-orange-300",
      "bg-sky-100 text-sky-700 dark:bg-sky-950/35 dark:text-sky-300",
      "bg-rose-100 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300",
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/35 dark:text-indigo-300",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <MainLayout>
<div className="p-6 space-y-0 bg-slate-50 min-h-screen">
<div className="mb-2">
<h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Users & Roles</h1>
<p className="text-muted-foreground mt-2">Manage users and roles across all organizations and sites.</p>
</div>
      <div className="surface w-full">
        
        {/* Title and Buttons Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-6">
          <div>
            {tab === "roles" && (
              <Button onClick={() => { setEditingRole(null); setIsPreviewMode(false); setIsRoleModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-4 py-2 rounded-lg">
                <Plus className="mr-1.5 h-4 w-4" /> Add Role
              </Button>
            )}
            {tab === "users" && (
              <Button onClick={() => { setEditingUser(null); setIsPreviewMode(false); setIsUserModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs px-4 py-2 rounded-lg">
                <Plus className="mr-1.5 h-4 w-4" /> Add User
              </Button>
            )}
          </div>
        </div>

        {/* Organization and Site Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Organization Filter</span>
            <select
              value={selectedOrgId}
              onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedSiteId(""); }}
              className="h-9 w-56 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="">All Organizations</option>
              {organizations.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site Filter</span>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="h-9 w-56 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="">All Sites</option>
              {sites.filter((s: any) => selectedOrgId ? String(s.organization) === String(selectedOrgId) : true).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-6">
            <button
              onClick={() => { setTab("roles"); setSearchQuery(""); }}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
                tab === "roles"
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Roles
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                tab === "roles" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
              }`}>
                {roles.length}
              </span>
            </button>
            <button
              onClick={() => { setTab("users"); setSearchQuery(""); }}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
                tab === "users"
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                tab === "users" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
              }`}>
                {users.length}
              </span>
            </button>
            <button
              onClick={() => { setTab("pending"); setSearchQuery(""); }}
              className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${
                tab === "pending"
                  ? "text-primary font-bold border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending Registrations
              {pendingUsers.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-650 dark:bg-red-950/30 dark:text-red-400">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>

          {(tab === "roles" || tab === "users") && (
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tab === "roles" ? "Search roles..." : "Search users..."}
                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-9 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Tab contents */}

        {/* Roles Tab */}
        {tab === "roles" && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Access Scope</th>
                      <th className="px-5 py-3.5 text-center">Can Approve</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground font-normal">
                          No roles found.
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role: any) => {
                        const dept = departments.find(d => String(d.id) === String(role.department_id));
                        return (
                          <tr key={role.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{role.role_name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{role.role_code || "N/A"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                              {dept ? dept.name : "-"}
                            </td>
                            <td className="px-5 py-4">
                              {role.access_level ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary border-none text-[10px] font-bold">
                                  {role.access_level}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <Switch
                                className="data-[state=checked]:bg-primary"
                                checked={!!role.can_approve_po}
                                onCheckedChange={(val) => saveRoleMutation.mutate({ ...role, can_approve_po: val, can_create_po: val })}
                              />
                            </td>
                            <td className="px-5 py-4">
                              <Badge className={`${role.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30" : "bg-slate-100 text-slate-500"} text-[10px] font-bold`}>
                                ● {role.status || "Active"}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingRole(role); setIsPreviewMode(true); setIsRoleModalOpen(true); }}
                                  className="h-auto p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Preview
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingRole(role); setIsPreviewMode(false); setIsRoleModalOpen(true); }}
                                  className="h-auto p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this role?")) {
                                      deleteRoleMutation.mutate(role.id);
                                    }
                                  }}
                                  className="h-auto p-1 text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">User</th>
                      <th className="px-5 py-3.5">Department</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-muted-foreground font-normal">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user: any) => {
                        const deptId = user.profile?.department;
                        const dept = departments.find(d => String(d.id) === String(deptId));
                        const initials = user.name
                          ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                          : "U";
                        const employeeId = user.profile?.employee_id || `USR${String(user.id).slice(0, 4).toUpperCase()}`;

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${getInitialsColor(user.name || "")}`}>
                                  {initials}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 dark:text-slate-100">{user.name}</span>
                                  <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {employeeId} | {user.email}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                              {dept ? dept.name : "-"}
                            </td>
                            <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                              {user.role ? user.role : "-"}
                            </td>
                            <td className="px-5 py-4">
                              <Badge className={`${user.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30" : "bg-slate-100 text-slate-500"} text-[10px] font-bold`}>
                                ● {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingUser(user); setIsPreviewMode(true); setIsUserModalOpen(true); }}
                                  className="h-auto p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Preview
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => { setEditingUser(user); setIsPreviewMode(false); setIsUserModalOpen(true); }}
                                  className="h-auto p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to remove this user?")) {
                                      deleteUserMutation.mutate(user.id);
                                    }
                                  }}
                                  className="h-auto p-1 text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold text-xs"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Tab */}
        {tab === "pending" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Pending Registrations</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review and approve or reject sign-ups and feature requests.
              </p>
            </div>

            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        <th className="px-5 py-3.5">Name</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Role Request</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {pendingUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-muted-foreground font-normal">
                            No pending registrations found.
                          </td>
                        </tr>
                      ) : (
                        pendingUsers.map((pUser: any) => (
                          <tr key={pUser.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-850 dark:text-slate-200">
                              {pUser.name}
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                              {pUser.email}
                            </td>
                            <td className="px-5 py-4 text-indigo-600 dark:text-indigo-400 font-bold uppercase">
                              {pUser.role}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  onClick={() => approveUserMutation.mutate(pUser.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] font-semibold rounded-md px-3"
                                >
                                  <Check className="mr-1 h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to reject and delete this registration?")) {
                                      rejectUserMutation.mutate(pUser.id);
                                    }
                                  }}
                                  variant="outline"
                                  className="h-7 text-[10px] font-semibold text-red-500 hover:text-red-750 border-red-200 rounded-md px-3 bg-white"
                                >
                                  <X className="mr-1 h-3.5 w-3.5" /> Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog for New / Edit Role */}
        <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {editingRole ? "Edit Role" : "New Role"}
              </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Please review and complete the details below.</DialogDescription>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Fields are linked to keep your hierarchy consistent.
              </p>
            </DialogHeader>
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <input type="hidden" name="can_manage_users" value={canManageUsers ? "on" : "off"} />
              <input type="hidden" name="can_approve" value={canApprove ? "on" : "off"} />
              <input type="hidden" name="cross_dept_access" value={crossDeptAccess ? "on" : "off"} />
              
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">Role Configuration</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Role Name <span className="text-primary">*</span></Label>
                    <Input name="role_name" defaultValue={editingRole?.role_name || ""} placeholder="e.g. Site Manager" required disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Role Code <span className="text-primary">*</span></Label>
                    <Input name="role_code" defaultValue={editingRole?.role_code || ""} placeholder="SITE_MGR" required disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Organization</Label>
                    <select name="organization_id" defaultValue={editingRole?.organization_id || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none disabled:opacity-75">
                      <option value="">Global / All Organizations</option>
                      {organizations.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Site</Label>
                    <select name="site_id" defaultValue={editingRole?.site_id || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none disabled:opacity-75">
                      <option value="">Global / All Sites</option>
                      {sites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department <span className="text-primary">*</span></Label>
                    <select name="department" required defaultValue={editingRole?.department_id || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none disabled:opacity-75">
                      <option value="">Select...</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Access Scope <span className="text-primary">*</span></Label>
                    <select name="access_level" required defaultValue={editingRole?.access_level || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none disabled:opacity-75">
                      <option value="">Select...</option>
                      <option value="Site">Site</option>
                      <option value="Region">Region</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Self">Self</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dashboard Type</Label>
                    <select name="dashboard_type" defaultValue={editingRole?.dashboard_type || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none disabled:opacity-75">
                      <option value="">Select...</option>
                      <option value="Default">Default</option>
                      <option value="Admin">Admin</option>
                      <option value="Executive">Executive</option>
                      <option value="Field">Field</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-650">Can Manage Users</span>
                  <Switch checked={canManageUsers} disabled={isPreviewMode} onCheckedChange={setCanManageUsers} className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-650">Can Approve</span>
                  <Switch checked={canApprove} disabled={isPreviewMode} onCheckedChange={setCanApprove} className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-650">Cross-Department Access</span>
                  <Switch checked={crossDeptAccess} disabled={isPreviewMode} onCheckedChange={setCrossDeptAccess} className="data-[state=checked]:bg-primary" />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsRoleModalOpen(false)} className="text-xs hover:bg-slate-50 rounded-lg">
                  {isPreviewMode ? "Close" : "Cancel"}
                </Button>
                {!isPreviewMode && (
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg">
                    {saveRoleMutation.isPending ? "Saving..." : "Save Role"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog for New / Edit User */}
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? "Edit User" : "New User"}
              </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Please review and complete the details below.</DialogDescription>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Fields are linked to keep your hierarchy consistent.
              </p>
            </DialogHeader>
            <form onSubmit={handleUserSubmit} className="space-y-5">
              
              {/* Section 1: Personal Information */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Personal Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Full Name <span className="text-primary">*</span></Label>
                    <Input name="name" defaultValue={editingUser?.name || ""} placeholder="e.g. Aarav Mehta" required disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Employee ID <span className="text-primary">*</span></Label>
                    <Input 
                      name="employee_id" 
                      key={generatedEmpId}
                      defaultValue={generatedEmpId} 
                      placeholder="EMP001" 
                      required 
                      disabled={isPreviewMode}
                      className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Email <span className="text-primary">*</span></Label>
                    <Input name="email" type="email" defaultValue={editingUser?.email || ""} placeholder="user@logicon.io" required disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Mobile</Label>
                    <Input name="mobile" defaultValue={editingUser?.profile?.phone_number || ""} placeholder="+91 98100 00000" disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                </div>
              </div>

              {/* Section 2: Organizational Assignment */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Organizational Assignment</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Department <span className="text-primary">*</span></Label>
                    <select name="department" required defaultValue={editingUser?.profile?.department || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none font-medium text-slate-700 disabled:opacity-75">
                      <option value="">Select...</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Designation <span className="text-primary">*</span></Label>
                    <Input name="designation" defaultValue={editingUser?.profile?.designation || ""} placeholder="Designation Name" required disabled={isPreviewMode} className="text-xs bg-slate-50 border-slate-200 rounded-lg disabled:opacity-75" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Role <span className="text-primary">*</span></Label>
                    <select name="role" required defaultValue={editingUser?.role || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none font-medium text-slate-700 disabled:opacity-75">
                      <option value="">Select...</option>
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.role_name}>{r.role_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Organization <span className="text-primary">*</span></Label>
                    <select name="organization" required defaultValue={editingUser?.profile?.organization_id || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none font-medium text-slate-700 disabled:opacity-75">
                      <option value="">Select...</option>
                      {organizations.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Site</Label>
                    <select name="site" defaultValue={editingUser?.profile?.site || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none font-medium text-slate-700 disabled:opacity-75">
                      <option value="">Select...</option>
                      {sites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Reporting Manager</Label>
                    <select name="reporting_manager" defaultValue={editingUser?.profile?.reporting_manager || ""} disabled={isPreviewMode} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 px-3 py-1 text-xs outline-none font-medium text-slate-700 disabled:opacity-75">
                      <option value="">Select...</option>
                      {users.filter(u => u.id !== editingUser?.id).map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Security */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Security</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-550">Status</span>
                    <input type="hidden" name="is_active" value={editingUser ? (editingUser.is_active ? "on" : "off") : "on"} />
                    <Switch disabled={isPreviewMode} defaultChecked={editingUser ? !!editingUser.is_active : true} onCheckedChange={(checked) => {
                      const hiddenInput = document.querySelector('input[name="is_active"]') as HTMLInputElement;
                      if (hiddenInput) hiddenInput.value = checked ? "on" : "off";
                    }} className="data-[state=checked]:bg-primary" />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)} className="text-xs hover:bg-slate-50 rounded-lg">
                  {isPreviewMode ? "Close" : "Cancel"}
                </Button>
                {!isPreviewMode && (
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg">
                    {saveUserMutation.isPending ? "Saving..." : "Save User"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
</MainLayout>
  );
}
