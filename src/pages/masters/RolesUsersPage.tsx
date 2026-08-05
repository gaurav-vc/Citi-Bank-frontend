import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { MODULE_ACCESS_SECTIONS } from "@/utils/moduleAccessSections";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Users,
  Search,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Settings,
  AlertCircle,
  Building2,
  MapPin,
  Layers,
  Check,
  X,
  Lock,
  Unlock,
  Coins,
  FileCheck,
  Activity,
  Layers3,
  Briefcase,
  HelpCircle,
  Eye,
  Trash2,
  LayoutDashboard,
  Building,
  Package,
  FileText,
  ClipboardCheck,
  Warehouse,
  BarChart3,
  UserCheck,
  Clock,
  Key
} from "lucide-react";

// Fixed list of 8 enterprise roles requested
interface EnterpriseRole {
  key: string;
  name: string;
  dbName: string;
  icon: any;
  desc: string;
}

const ALL_ENTERPRISE_ROLES: EnterpriseRole[] = [
  { key: "super_admin", name: "Super Admin", dbName: "super_admin", icon: ShieldCheck, desc: "Global Super Administrator with full system setup and tenant controls." },
  { key: "client_admin", name: "Organization Admin", dbName: "client_admin", icon: Settings, desc: "Organization Administrator with tenant configuration and setup control rights." },
  { key: "admin", name: "Admin", dbName: "admin", icon: Settings, desc: "Administrator with site setup, operational user creation, and local controls." },
  { key: "cxo", name: "CXO", dbName: "cxo", icon: Briefcase, desc: "Executive role with global visibilities, consolidated reporting, and high-level approval oversight." },
  { key: "procurement_manager", name: "Procurement Manager", dbName: "procurement_manager", icon: ShieldCheck, desc: "Reviews indents, configures contracts, approves orders, evaluates RFQs, and monitors workflows." },
  { key: "procurement_executive", name: "Procurement Executive", dbName: "procurement_executive", icon: FileText, desc: "Maintains vendor listings, creates item catalogues, floats RFQ details, and creates purchase orders." },
  { key: "finance_manager", name: "Finance Manager", dbName: "finance_manager", icon: Coins, desc: "Monitors overall budgets, sets limits, approves large invoices, and authorizes payment proposals." },
  { key: "finance_executive", name: "Finance Executive", dbName: "finance_executive", icon: FileCheck, desc: "Processes utilities bills, reviews expenses, creates payment proposals, and files GST invoices." },
  { key: "site_engineer", name: "Site Engineer", dbName: "site_engineer", icon: HammerIcon, desc: "Logs indent requests, verifies executions, logs daily site logs, and executes QC checks." },
  { key: "store_keeper", name: "Store Keeper", dbName: "store_keeper", icon: Warehouse, desc: "Handles material receipts, executes gatepass verification, audits stock balances, and logs scraps." }
];

function HammerIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2050/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 5 4 4" />
      <path d="M21.5 2a1 1 0 0 0-1.4 0L16.2 5.9 14 3.7a1 1 0 0 0-1.4 0L3.7 12.6a1 1 0 0 0 0 1.4l2.2 2.2-4.1 4.1a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l4.1-4.1 2.2 2.2a1 1 0 0 0 1.4 0l6.9-6.9a1 1 0 0 0 0-1.4l-2.2-2.2L22 3.4a1 1 0 0 0 0-1.4z" />
    </svg>
  );
}

const ACTION_KEYS = ["view", "create", "modify", "cancel", "delete"] as const;
type ActionKey = (typeof ACTION_KEYS)[number];

function blankPermissions() {
  return { view: false, create: false, modify: false, cancel: false, delete: false };
}

// Page Access configuration
const PAGE_ACCESS_ITEMS = [
  { key: "page:dashboard", label: "Dashboard", dbField: "can_view_analytics" },
  { key: "page:organizations", label: "Organizations", dbField: "can_manage_roles" },
  { key: "page:sites", label: "Sites", dbField: "can_manage_roles" },
  { key: "page:departments", label: "Departments", dbField: "can_manage_roles" },
  { key: "page:vendors", label: "Vendors", dbField: "can_manage_vendors" },
  { key: "page:indents", label: "Indents", dbField: "can_create_po" },
  { key: "page:rfqs", label: "RFQs", dbField: "can_create_po" },
  { key: "page:orders", label: "Purchase Orders", dbField: "can_create_po" },
  { key: "page:contracts", label: "Contracts", dbField: "can_manage_contracts" },
  { key: "page:inventory", label: "Inventory", dbField: "can_manage_inventory" },
  { key: "page:grn", label: "GRN", dbField: "can_manage_inventory" },
  { key: "page:budgets", label: "Budgets", dbField: "can_create_po" },
  { key: "page:expenses", label: "Expenses", dbField: "can_create_po" },
  { key: "page:invoices", label: "Invoices", dbField: "can_create_po" },
  { key: "page:payments", label: "Payments", dbField: "can_manage_payments" },
  { key: "page:reports", label: "Reports", dbField: "can_export_reports" },
  { key: "page:approvals", label: "Approvals", dbField: "can_approve_po" },
  { key: "page:workflows", label: "Workflows", dbField: "can_approve_po" }
];

export default function RolesUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const FIXED_ENTERPRISE_ROLES = useMemo(() => {
    const isSuper = currentUser?.role === 'super_admin';
    return ALL_ENTERPRISE_ROLES.filter(r => {
      if (r.dbName === 'super_admin' || r.dbName === 'client_admin') {
        return isSuper;
      }
      return true;
    });
  }, [currentUser]);
  
  // Selection states
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>("procurement_manager");
  const [activeTab, setActiveTab] = useState<"users" | "modules" | "pages" | "details">("users");

  // Filter and search states
  const [userSearch, setUserSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");

  // Tab 2 Selector: Site Filter (reused from RoleBaseAccessPage.jsx)
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Drawer / Assign modal states
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignOrgId, setAssignOrgId] = useState("");
  const [assignSiteId, setAssignSiteId] = useState("");
  const [assignDeptId, setAssignDeptId] = useState("");

  // Local draft states for batch save (resilient enterprise requirement)
  const [draftPermissions, setDraftPermissions] = useState<Record<string, { view: boolean; create: boolean; modify: boolean; cancel: boolean; delete: boolean }>>({});
  const [draftRoleCapabilities, setDraftRoleCapabilities] = useState<Record<string, boolean>>({});

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
  });

  const { data: rawProfiles = [] } = useQuery({
    queryKey: ["raw-profiles"],
    queryFn: () => {
      const BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const token = localStorage.getItem('campusspend_token');
      return fetch(`${BASE_URL}/api/profiles/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      }).then(r => r.json());
    }
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: api.getRoles,
  });

  const { data: permissionsList = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ["role-module-permissions"],
    queryFn: api.getRoleModulePermissions,
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const visibleOrgs = useMemo(() => {
    if (currentUser?.role === 'client_admin' || currentUser?.role === 'admin') {
      const userOrgId = currentUser.profile?.organization_id;
      if (userOrgId) {
        return orgs.filter(o => String(o.id) === String(userOrgId));
      }
    }
    return orgs;
  }, [orgs, currentUser]);

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: api.getDepartments,
  });

  const loading = isLoadingUsers || isLoadingRoles || isLoadingPerms;

  // Active configurations matching
  const currentRoleConfig = useMemo(() => {
    return FIXED_ENTERPRISE_ROLES.find(r => r.key === selectedRoleKey) || FIXED_ENTERPRISE_ROLES[2];
  }, [selectedRoleKey]);

  const currentDbRole = useMemo(() => {
    return roles.find(r => {
      const dbName = r.role_name.toLowerCase();
      const targetName = currentRoleConfig.dbName.toLowerCase();
      if (targetName === "site_engineer") return dbName === "site_engineer" || dbName === "site_manager";
      return dbName === targetName;
    }) || null;
  }, [roles, currentRoleConfig]);

  const selectedSite = useMemo(
    () => sites.find((s) => String(s.id) === String(selectedSiteId)) || null,
    [sites, selectedSiteId]
  );

  // Group permissions layout from RoleBaseAccessPage.jsx
  const siteModuleGroups = useMemo(() => {
    return MODULE_ACCESS_SECTIONS.map((section) => {
      const features = section.items
        .map((item) => ({ key: `${section.id}:${item.key}`, label: item.label }))
        .filter((entry) => {
          // If a site is selected, filter by site's module configuration.
          // Otherwise, fall back to showing all modules.
          if (!selectedSite) return true;
          const config = selectedSite.module_configuration || {};
          return !!config[entry.key];
        });
      return { title: section.title, features };
    }).filter((section) => section.features.length > 0);
  }, [selectedSite]);

  // Set default open status for collapsible groups
  useEffect(() => {
    if (siteModuleGroups.length > 0) {
      const defaultOpen: Record<string, boolean> = {};
      siteModuleGroups.forEach((group) => {
        defaultOpen[group.title] = true;
      });
      setOpenGroups((prev) => ({ ...defaultOpen, ...prev }));
    }
  }, [siteModuleGroups]);

  // Sync draft states from database
  useEffect(() => {
    if (!currentDbRole) return;

    // Load module permissions
    const initialPerms: Record<string, { view: boolean; create: boolean; modify: boolean; cancel: boolean; delete: boolean }> = {};
    MODULE_ACCESS_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        initialPerms[`${section.id}:${item.key}`] = blankPermissions();
      });
    });

    permissionsList
      .filter((p) => String(p.role) === String(currentDbRole.id))
      .forEach((p) => {
        initialPerms[p.module_key] = {
          view: !!p.can_view,
          create: !!p.can_create,
          modify: !!p.can_edit,
          cancel: !!p.can_approve,
          delete: !!p.can_delete,
        };
      });
    setDraftPermissions(initialPerms);

    // Load page capabilities
    const initialCaps: Record<string, boolean> = {};
    PAGE_ACCESS_ITEMS.forEach((page) => {
      initialCaps[page.dbField] = !!currentDbRole[page.dbField];
    });
    setDraftRoleCapabilities(initialCaps);
  }, [currentDbRole, permissionsList]);

  // Check if draft permissions differ from DB values
  const hasUnsavedChanges = useMemo(() => {
    if (!currentDbRole) return false;

    const capsChanged = PAGE_ACCESS_ITEMS.some((page) => {
      const original = !!currentDbRole[page.dbField];
      const draft = !!draftRoleCapabilities[page.dbField];
      return original !== draft;
    });
    if (capsChanged) return true;

    return Object.entries(draftPermissions).some(([moduleKey, perm]) => {
      const existing = permissionsList.find(
        (p) => String(p.role) === String(currentDbRole.id) && p.module_key === moduleKey
      );
      const original = existing
        ? {
            view: !!existing.can_view,
            create: !!existing.can_create,
            modify: !!existing.can_edit,
            cancel: !!existing.can_approve,
            delete: !!existing.can_delete,
          }
        : blankPermissions();
      
      return (
        original.view !== perm.view ||
        original.create !== perm.create ||
        original.modify !== perm.modify ||
        original.cancel !== perm.cancel ||
        original.delete !== perm.delete
      );
    });
  }, [draftPermissions, draftRoleCapabilities, currentDbRole, permissionsList]);

  // Counts assigned users
  const getAssignedCount = (roleName: string) => {
    const targetDb = roleName.toLowerCase();
    return users.filter((u: any) => {
      const userRole = (u.role || "").toLowerCase();
      if (targetDb === "site_engineer") return userRole === "site_engineer" || userRole === "site_manager";
      return userRole === targetDb;
    }).length;
  };

  // Assigned Users to selected role
  const assignedUsers = useMemo(() => {
    return users.map((u: any) => {
      const profile = rawProfiles.find((p: any) => String(p.user) === String(u.id)) || {};
      const org = orgs.find((o) => o.id === profile.organization);
      const site = sites.find((s) => s.id === profile.site);
      const dept = departments.find((d) => d.id === profile.department);

      return {
        id: u.id,
        name: u.name || u.username,
        email: u.email,
        role: (u.role || "").toLowerCase(),
        profileRole: (profile.role_name || "").toLowerCase(),
        orgName: org ? org.name : "-",
        orgId: org ? String(org.id) : "",
        siteName: site ? site.name : "-",
        siteId: site ? String(site.id) : "",
        deptName: dept ? dept.name : "-",
        deptId: dept ? String(dept.id) : "",
      };
    }).filter((u: any) => {
      const targetDb = currentRoleConfig.dbName.toLowerCase();
      const matchesUserRole = u.role === targetDb;
      const matchesProfileRole = u.profileRole === targetDb;
      if (targetDb === "site_engineer") {
        return matchesUserRole || matchesProfileRole || u.role === "site_manager" || u.profileRole === "site_manager";
      }
      return matchesUserRole || matchesProfileRole;
    });
  }, [users, rawProfiles, orgs, sites, departments, currentRoleConfig]);

  const filteredAssignedUsers = useMemo(() => {
    return assignedUsers.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesOrg = orgFilter === "all" || u.orgId === orgFilter;
      const matchesSite = siteFilter === "all" || u.siteId === siteFilter;
      const matchesDept = deptFilter === "all" || u.deptId === deptFilter;
      return matchesQuery && matchesOrg && matchesSite && matchesDept;
    });
  }, [assignedUsers, userSearch, orgFilter, siteFilter, deptFilter]);

  const unassignedUsers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map(u => u.id));
    return users.map((u: any) => ({
      id: u.id,
      name: u.name || u.username,
      email: u.email
    })).filter(u => !assignedIds.has(u.id));
  }, [users, assignedUsers]);

  // Mutations
  const assignUserMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      user_id: string;
      organizationId: string | number | null;
      organization_id: string | number | null;
      siteId: string | number | null;
      site_id: string | number | null;
      departmentId: string | number | null;
      department_id: string | number | null;
      role: string | null;
      role_name: string | null;
    }) => api.assignUserContext(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["raw-profiles"] });
      setIsAssignUserModalOpen(false);
      setAssignUserId("");
      setAssignOrgId("");
      setAssignSiteId("");
      setAssignDeptId("");
    },
    onError: (err: any) => {
      window.alert(`Scope assignment failed: ${err.message}`);
    }
  });

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      if (!currentDbRole) return;
      const promises: Promise<any>[] = [];

      // 1. Batch Save Module Access permissions
      Object.entries(draftPermissions).forEach(([moduleKey, perm]) => {
        const existing = permissionsList.find(
          (p) => String(p.role) === String(currentDbRole.id) && p.module_key === moduleKey
        );
        const payload = {
          can_view: perm.view,
          can_create: perm.create,
          can_edit: perm.modify,
          can_approve: perm.cancel,
          can_delete: perm.delete,
        };

        if (existing) {
          const isDifferent =
            existing.can_view !== payload.can_view ||
            existing.can_create !== payload.can_create ||
            existing.can_edit !== payload.can_edit ||
            existing.can_approve !== payload.can_approve ||
            existing.can_delete !== payload.can_delete;

          if (isDifferent) {
            promises.push(api.updateRoleModulePermission(existing.id, payload));
          }
        } else {
          const hasAny = perm.view || perm.create || perm.modify || perm.cancel || perm.delete;
          if (hasAny) {
            promises.push(
              api.saveRoleModulePermission({
                role: Number(currentDbRole.id),
                module_key: moduleKey,
                ...payload,
              })
            );
          }
        }
      });

      // 2. Batch Save Role Capabilities setting
      const capsToUpdate: Record<string, boolean> = {};
      let capsChanged = false;
      Object.entries(draftRoleCapabilities).forEach(([dbField, checked]) => {
        const original = !!currentDbRole[dbField];
        if (original !== checked) {
          capsToUpdate[dbField] = checked;
          capsChanged = true;
        }
      });

      if (capsChanged) {
        promises.push(api.updateRole(currentDbRole.id, capsToUpdate));
      }

      // 3. Batch Save custom Page Access visibility mappings
      PAGE_ACCESS_ITEMS.forEach((page) => {
        const checked = draftRoleCapabilities[page.dbField];
        const existing = permissionsList.find(
          (p) => String(p.role) === String(currentDbRole.id) && p.module_key === page.key
        );
        const payload = {
          can_view: checked,
          can_create: false,
          can_edit: false,
          can_approve: false,
          can_delete: false,
        };

        if (existing) {
          if (existing.can_view !== checked) {
            promises.push(api.updateRoleModulePermission(existing.id, payload));
          }
        } else if (checked) {
          promises.push(
            api.saveRoleModulePermission({
              role: Number(currentDbRole.id),
              module_key: page.key,
              ...payload,
            })
          );
        }
      });

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-module-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setStatusMessage("Changes successfully saved to database.");
      setTimeout(() => setStatusMessage(""), 3000);
    },
    onError: (err: any) => {
      window.alert(`Failed to save details: ${err.message}`);
    }
  });

  // Mutators for Draft Permissions (reused from RoleBaseAccessPage.jsx logic)
  const togglePermission = (featureKey: string, action: ActionKey, enabled: boolean) => {
    if (!isEditMode) return;
    setDraftPermissions((prev) => {
      const current = prev[featureKey] || blankPermissions();
      return {
        ...prev,
        [featureKey]: {
          ...current,
          [action]: enabled,
        },
      };
    });
  };

  const toggleGroupPermission = (group: any, action: ActionKey, enabled: boolean) => {
    if (!isEditMode) return;
    setDraftPermissions((prev) => {
      const next = { ...prev };
      group.features.forEach((feature: any) => {
        const current = next[feature.key] || blankPermissions();
        next[feature.key] = {
          ...current,
          [action]: enabled,
        };
      });
      return next;
    });
  };

  const handleTogglePageAccess = (dbField: string, checked: boolean) => {
    setDraftRoleCapabilities((prev) => ({
      ...prev,
      [dbField]: checked,
    }));
  };

  // Checkbox state calculations (reused logic from RoleBaseAccessPage.jsx)
  const isGroupActionChecked = (group: any, action: ActionKey) => {
    return (
      group.features.length > 0 &&
      group.features.every((feature: any) => !!draftPermissions[feature.key]?.[action])
    );
  };

  const isGroupActionIndeterminate = (group: any, action: ActionKey) => {
    const anyChecked = group.features.some((feature: any) => !!draftPermissions[feature.key]?.[action]);
    return anyChecked && !isGroupActionChecked(group, action);
  };

  const toggleGroupOpen = (groupTitle: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

  // Toolbar actions
  const handleExpandAll = () => {
    const nextOpen: Record<string, boolean> = {};
    siteModuleGroups.forEach((group) => {
      nextOpen[group.title] = true;
    });
    setOpenGroups(nextOpen);
  };

  const handleCollapseAll = () => {
    const nextOpen: Record<string, boolean> = {};
    siteModuleGroups.forEach((group) => {
      nextOpen[group.title] = false;
    });
    setOpenGroups(nextOpen);
  };

  const handleSelectAll = () => {
    const next = { ...draftPermissions };
    siteModuleGroups.forEach((group) => {
      group.features.forEach((feature) => {
        next[feature.key] = { view: true, create: true, modify: true, cancel: true, delete: true };
      });
    });
    setDraftPermissions(next);
  };

  const handleClearAll = () => {
    const next = { ...draftPermissions };
    siteModuleGroups.forEach((group) => {
      group.features.forEach((feature) => {
        next[feature.key] = blankPermissions();
      });
    });
    setDraftPermissions(next);
  };

  // Scope assign handlers
  const handleAssignUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId) return;
    
    assignUserMutation.mutate({
      userId: assignUserId,
      user_id: assignUserId,
      organizationId: assignOrgId ? Number(assignOrgId) : null,
      organization_id: assignOrgId ? Number(assignOrgId) : null,
      siteId: assignSiteId ? Number(assignSiteId) : null,
      site_id: assignSiteId ? Number(assignSiteId) : null,
      departmentId: assignDeptId ? Number(assignDeptId) : null,
      department_id: assignDeptId ? Number(assignDeptId) : null,
      role: currentRoleConfig.dbName,
      role_name: currentRoleConfig.dbName
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (window.confirm("Are you sure you want to remove this user from this role? This will clear their organization, site, and department context.")) {
      assignUserMutation.mutate({
        userId,
        user_id: userId,
        organizationId: null,
        organization_id: null,
        siteId: null,
        site_id: null,
        departmentId: null,
        department_id: null,
        role: "employee",
        role_name: "employee"
      });
    }
  };

  // Statistics summaries
  const assignedCountSummary = useMemo(() => {
    return Object.values(draftPermissions).reduce(
      (sum, p) => (ACTION_KEYS.some((action) => !!p?.[action]) ? sum + 1 : sum),
      0
    );
  }, [draftPermissions]);

  const activeModulesCount = useMemo(() => {
    return Object.values(draftPermissions).filter(p => p.view).length;
  }, [draftPermissions]);

  return (
    <MainLayout>
      <div className="surface min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        
        {/* Split Panel Layout */}
        <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto">
          
          {/* LEFT PANEL: Fixed Enterprise Roles Cards */}
          <div className="w-full xl:w-[350px] shrink-0 space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="p-4">
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  Access Roles Console
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1 leading-normal">
                  Select a profile card below to allocate users and configure permission categories.
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {FIXED_ENTERPRISE_ROLES.map((role) => {
                const count = getAssignedCount(role.dbName);
                const isSelected = selectedRoleKey === role.key;
                const RoleIcon = role.icon;

                return (
                  <div
                    key={role.key}
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (!window.confirm("You have unsaved changes. Switching roles will discard edits. Proceed?")) {
                          return;
                        }
                      }
                      setSelectedRoleKey(role.key);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between group shadow-xs ${
                      isSelected
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500/25"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 text-white dark:bg-indigo-500"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                        }`}>
                          <RoleIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-white leading-none">
                            {role.name}
                          </h3>
                          <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {role.desc}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        count > 0
                          ? "bg-indigo-50 bg-opacity-10 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                      }`}>
                        {count} User{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Tabbed Workspace Console */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Header / Active Role Banner */}
            <div className="px-6 py-5 bg-slate-50/50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  {React.createElement(currentRoleConfig.icon, { className: "h-6 w-6" })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentRoleConfig.name} Access Control
                    </h1>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-mono uppercase tracking-wider">
                      DB Target: {currentRoleConfig.dbName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed max-w-xl">
                    {currentRoleConfig.desc}
                  </p>
                </div>
              </div>

              {/* Status Message indicator */}
              <div className="flex items-center gap-2 shrink-0">
                {hasUnsavedChanges && (
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-amber-250 animate-pulse">
                    <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes in draft
                  </span>
                )}
                {statusMessage && (
                  <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1.5 rounded-md flex items-center gap-1.5 border border-emerald-250">
                    <Check className="h-3.5 w-3.5" /> {statusMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Tab Links */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-4 pt-3 bg-white dark:bg-slate-900">
              {(["users", "modules", "pages", "details"] as const).map((tab) => {
                const labels: Record<string, string> = {
                  users: "Users Assignment",
                  modules: "Module Access",
                  pages: "Page Access",
                  details: "Role Details"
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3.5 font-bold text-xs sm:text-sm border-b-2 transition-colors uppercase tracking-wider ${
                      activeTab === tab
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents Workspace */}
            <div className="p-6 flex-1 bg-white dark:bg-slate-900 min-h-[500px]">
              
              {/* TAB 1: USERS TAB */}
              {activeTab === "users" && (
                <div className="space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Search */}
                      <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          className="filter-input w-full pl-8 pr-3 py-1.5 border rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none text-xs"
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>

                      {/* Filters */}
                      <select
                        className="filter-input py-1.5 px-3 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                        value={orgFilter}
                        onChange={(e) => setOrgFilter(e.target.value)}
                      >
                        <option value="all">All Organizations</option>
                        {visibleOrgs.map((o) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>

                      <select
                        className="filter-input py-1.5 px-3 border rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                        value={siteFilter}
                        onChange={(e) => setSiteFilter(e.target.value)}
                      >
                        <option value="all">All Sites</option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => setIsAssignUserModalOpen(true)}
                      className="primary-btn flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors font-semibold shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Assign Users
                    </button>
                  </div>

                  {/* Users Assignment table list */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <table className="org-table w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                          <th className="px-5 py-3">User Profile</th>
                          <th className="px-5 py-3">Organization</th>
                          <th className="px-5 py-3">Site Context</th>
                          <th className="px-5 py-3">Department</th>
                          <th className="px-5 py-3 text-right">Scope Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {filteredAssignedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500">
                              No assigned users found matching selection filters.
                            </td>
                          </tr>
                        ) : (
                          filteredAssignedUsers.map((u) => {
                            const initials = u.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                <td className="px-5 py-3.5 flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                                    {initials}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-850 dark:text-slate-200">{u.name}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{u.email}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.orgName}</td>
                                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.siteName}</td>
                                <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">{u.deptName}</td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => handleRemoveUser(u.id)}
                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline flex items-center gap-1.5 ml-auto border border-rose-100 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/10 px-2.5 py-1 rounded-md transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" /> Remove
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MODULE ACCESS (REUSING LAYOUT FROM RoleBaseAccessPage.jsx) */}
              {activeTab === "modules" && (
                <div className="space-y-6">
                  {/* Selector & Actions Panel (reused from reference panel) */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Site Scoping selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site Scoping Filter</label>
                        <select
                          className="filter-input py-1.5 px-3 border rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                          value={selectedSiteId}
                          onChange={(e) => {
                            setSelectedSiteId(e.target.value);
                          }}
                        >
                          <option value="">Unfiltered (Show All Modules)</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Edit Mode toggle */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Modify Controls</span>
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 gap-0.5 bg-white dark:bg-slate-800">
                          <button
                            type="button"
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${
                              isEditMode
                                ? "bg-indigo-650 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                            onClick={() => setIsEditMode(true)}
                          >
                            <Lock className="inline-block h-3 w-3 mr-1" /> Edit Mode
                          </button>
                          <button
                            type="button"
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${
                              !isEditMode
                                ? "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                            onClick={() => setIsEditMode(false)}
                          >
                            <Eye className="inline-block h-3 w-3 mr-1" /> View Only
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-end gap-2.5 mt-auto">
                      <button
                        type="button"
                        className="ghost-btn text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={handleExpandAll}
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        className="ghost-btn text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                        onClick={handleCollapseAll}
                      >
                        Collapse All
                      </button>
                      <button
                        type="button"
                        className="ghost-btn text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        onClick={handleSelectAll}
                        disabled={!isEditMode}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        className="ghost-btn text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        onClick={handleClearAll}
                        disabled={!isEditMode}
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        className={`text-[10.5px] font-bold px-4 py-2 rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
                          hasUnsavedChanges
                            ? "bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/10"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                        }`}
                        onClick={() => saveChangesMutation.mutate()}
                        disabled={!hasUnsavedChanges || saveChangesMutation.isPending}
                      >
                        <Lock className="h-3.5 w-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>

                  {/* Accordon Matrix Panel (Reused exactly from RoleBaseAccessPage.jsx) */}
                  <Card className="border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <CardHeader className="px-5 py-4 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Lock className="h-4.5 w-4.5 text-indigo-500" />
                        Assigned Module Permissions
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] font-bold font-mono px-2.5">
                        {assignedCountSummary} feature(s) active
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="p-0 overflow-x-auto">
                      <table className="org-table role-access-table w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-550 border-b border-slate-150 dark:border-slate-800 tracking-wider">
                            <th className="px-5 py-3">Module Group / Feature</th>
                            <th className="px-5 py-3 text-center w-20">View</th>
                            <th className="px-5 py-3 text-center w-20">Create</th>
                            <th className="px-5 py-3 text-center w-20">Modify</th>
                            <th className="px-5 py-3 text-center w-20">Approve</th>
                            <th className="px-5 py-3 text-center w-20">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-xs">
                          {siteModuleGroups.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500">
                                No module-access features are enabled on this site context configuration.
                              </td>
                            </tr>
                          ) : (
                            siteModuleGroups.flatMap((group) => {
                              const isOpen = !!openGroups[group.title];
                              const parentRow = (
                                <tr key={`${group.title}-group`} className="role-access-group-row bg-slate-50/20 hover:bg-slate-50/40 dark:bg-slate-950/10 dark:hover:bg-slate-950/20">
                                  <td className="px-5 py-3">
                                    <button
                                      type="button"
                                      className="role-access-group-toggle text-xs"
                                      onClick={() => toggleGroupOpen(group.title)}
                                      aria-expanded={isOpen}
                                    >
                                      <span className={`role-access-caret text-[9px] ${isOpen ? "open rotate-90" : ""}`}>▸</span>
                                      <span className="font-bold text-slate-900 dark:text-white">{group.title}</span>
                                    </button>
                                  </td>
                                  {ACTION_KEYS.map((action) => (
                                    <td key={`${group.title}-${action}`} className="px-5 py-3 text-center">
                                      <label className="role-access-toggle">
                                        <input
                                          type="checkbox"
                                          checked={isGroupActionChecked(group, action)}
                                          ref={(el) => {
                                            if (!el) return;
                                            el.indeterminate = isGroupActionIndeterminate(group, action);
                                          }}
                                          onChange={(e) => toggleGroupPermission(group, action, e.target.checked)}
                                          disabled={!isEditMode}
                                        />
                                      </label>
                                    </td>
                                  ))}
                                </tr>
                              );

                              if (!isOpen) return [parentRow];

                              const childRows = group.features.map((feature) => {
                                const featurePermissions = draftPermissions[feature.key] || blankPermissions();
                                return (
                                  <tr key={feature.key} className="role-access-child-row hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                                    <td className="px-5 py-2.5 pl-9">
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-slate-700 dark:text-slate-350">{feature.label}</span>
                                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 tracking-tight select-all">{feature.key}</span>
                                      </div>
                                    </td>
                                    {ACTION_KEYS.map((action) => (
                                      <td key={`${feature.key}-${action}`} className="px-5 py-2.5 text-center">
                                        <label className="role-access-toggle">
                                          <input
                                            type="checkbox"
                                            checked={!!featurePermissions[action]}
                                            onChange={(e) => togglePermission(feature.key, action, e.target.checked)}
                                            disabled={!isEditMode}
                                          />
                                        </label>
                                      </td>
                                    ))}
                                  </tr>
                                );
                              });

                              return [parentRow, ...childRows];
                            })
                          )}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 3: PAGE ACCESS TAB */}
              {activeTab === "pages" && (
                <div className="space-y-6">
                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 leading-normal max-w-xl">
                      Toggle route visibilities for core pages. Unsaved changes are cached until you click "Save Changes".
                    </p>
                    <button
                      type="button"
                      className={`text-[11px] font-bold px-4 py-1.5 rounded-lg transition-all shadow-xs border flex items-center gap-1.5 ${
                        hasUnsavedChanges
                          ? "bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/10"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                      }`}
                      onClick={() => saveChangesMutation.mutate()}
                      disabled={!hasUnsavedChanges || saveChangesMutation.isPending}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      {saveChangesMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PAGE_ACCESS_ITEMS.map((page) => {
                      const isPageChecked = draftRoleCapabilities[page.dbField] ?? false;
                      
                      return (
                        <div
                          key={page.key}
                          className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {page.label} Page
                            </span>
                          </div>

                          <Switch
                            checked={isPageChecked}
                            onCheckedChange={(checked) => handleTogglePageAccess(page.dbField, checked)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ROLE DETAILS TAB */}
              {activeTab === "details" && (
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-55 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Members</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                        {assignedUsers.length}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-55 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Modules</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                        {activeModulesCount}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-55 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Actions Permitted</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                        {assignedCountSummary}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-55 dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xs">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Access Scope</div>
                      <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-2.5 uppercase tracking-wide">
                        {currentDbRole?.access_level || "Department"}
                      </div>
                    </div>
                  </div>

                  {/* Details Sheet */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 bg-white dark:bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-3.5 border-b border-slate-100 dark:border-slate-800">
                      System Attributes
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Role Identity Key</span>
                        <div className="text-slate-800 dark:text-slate-200 font-mono select-all bg-slate-55 dark:bg-slate-950 p-2 rounded border border-slate-150 dark:border-slate-800">
                          {currentRoleConfig.dbName}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Role Class Profile Name</span>
                        <div className="text-slate-800 dark:text-slate-200 font-mono select-all bg-slate-55 dark:bg-slate-950 p-2 rounded border border-slate-150 dark:border-slate-800">
                          {currentRoleConfig.name}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Created On (Database Record)</span>
                        <div className="text-slate-655 dark:text-slate-300 font-medium p-2">
                          {currentDbRole?.created_at ? new Date(currentDbRole.created_at).toLocaleString() : "-"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 font-medium">Record Limit Threshold (INR)</span>
                        <div className="text-slate-655 dark:text-slate-300 font-medium p-2">
                          {currentDbRole?.approval_limit ? Number(currentDbRole.approval_limit).toLocaleString() : "0.00"} INR
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* User Scope Assignment Modal */}
        {isAssignUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-indigo-500" />
                    Assign User Context
                  </h3>
                  <button
                    onClick={() => setIsAssignUserModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignUserSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select User Profile</label>
                    <select
                      className="filter-input w-full p-2.5 border rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none text-xs"
                      value={assignUserId}
                      onChange={(e) => setAssignUserId(e.target.value)}
                      required
                    >
                      <option value="">Select User...</option>
                      {unassignedUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Organization Context Scope</label>
                    <select
                      className="filter-input w-full p-2.5 border rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none text-xs"
                      value={assignOrgId}
                      onChange={(e) => {
                        setAssignOrgId(e.target.value);
                        setAssignSiteId("");
                        setAssignDeptId("");
                      }}
                    >
                      <option value="">No Organization</option>
                      {visibleOrgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Site Context Scope</label>
                    <select
                      className="filter-input w-full p-2.5 border rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none text-xs disabled:opacity-50"
                      value={assignSiteId}
                      onChange={(e) => {
                        setAssignSiteId(e.target.value);
                        setAssignDeptId("");
                      }}
                      disabled={!assignOrgId}
                    >
                      <option value="">No Site</option>
                      {sites.filter((s) => s.organization === Number(assignOrgId)).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Department Context Scope</label>
                    <select
                      className="filter-input w-full p-2.5 border rounded-lg bg-slate-50 focus:bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 outline-none text-xs disabled:opacity-50"
                      value={assignDeptId}
                      onChange={(e) => setAssignDeptId(e.target.value)}
                      disabled={!assignSiteId}
                    >
                      <option value="">No Department</option>
                      {departments.filter((d) => d.site === Number(assignSiteId)).map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  className="ghost-btn text-xs font-semibold px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-400"
                  onClick={() => setIsAssignUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs"
                  onClick={handleAssignUserSubmit}
                  disabled={assignUserMutation.isPending || !assignUserId}
                >
                  {assignUserMutation.isPending ? "Assigning..." : "Assign Context"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
