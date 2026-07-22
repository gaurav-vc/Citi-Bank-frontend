import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { toast } from "@/hooks/use-toast";

interface Site {
  id: number;
  name: string;
  code: string;
  organization_id: number;
  organization_name?: string;
}

interface Role {
  id: number;
  role_name: string;
  description?: string;
}

interface Department {
  id: number;
  site: number | null;
  name: string;
}

interface RoleAccessMapping {
  id: number;
  role: number;
  department: number | null;
  permissions: Record<string, Record<string, boolean>>;
}

interface ModuleItem {
  key: string;
  label: string;
}

interface ModuleSection {
  id: string;
  title: string;
  items: ModuleItem[];
}

const MODULE_ACCESS_SECTIONS: ModuleSection[] = [
  {
    id: "core_procurement",
    title: "Core Procurement",
    items: [
      { key: "procurement:vendors", label: "Vendors" },
      { key: "procurement:items", label: "Items & Rates" },
      { key: "procurement:rfqs", label: "RFQs" },
      { key: "procurement:orders", label: "Purchase Orders" },
      { key: "procurement:contracts", label: "Contracts" },
      { key: "procurement:indents", label: "Indents/Requisitions" }
    ]
  },
  {
    id: "finance",
    title: "Finance",
    items: [
      { key: "procurement:budgets", label: "Budgets" },
      { key: "procurement:expenses", label: "Expenses" },
      { key: "procurement:billing", label: "Invoices" },
      { key: "procurement:payments", label: "Payments" }
    ]
  },
  {
    id: "inventory",
    title: "Inventory",
    items: [
      { key: "procurement:grn", label: "GRNs" },
      { key: "procurement:inventory", label: "Stock" },
      { key: "procurement:transfers", label: "Transfers" },
      { key: "procurement:material_issue", label: "Material Issues" },
      { key: "procurement:inventory", label: "Scrap Disposal" } // Mapped to procurement:inventory in Django backend
    ]
  },
  {
    id: "workflow",
    title: "Workflow",
    items: [
      { key: "procurement:approvals", label: "Approvals" },
      { key: "procurement:workflows", label: "Workflow Engine" },
      { key: "procurement:workflow_escalations", label: "Escalations" }
    ]
  },
  {
    id: "admin",
    title: "Admin",
    items: [
      { key: "core:organizations", label: "Organizations" },
      { key: "core:sites", label: "Sites" },
      { key: "core:departments", label: "Departments" },
      { key: "core:users", label: "User Contexts" },
      { key: "core:users", label: "Role Management" } // Mapped to core:users in Django backend
    ]
  },
  {
    id: "analytics",
    title: "Analytics",
    items: [
      { key: "core:dashboard", label: "Dashboard" },
      { key: "procurement:reports", label: "Reports" },
      { key: "procurement:ai", label: "AI Spend Insights" }
    ]
  }
];

const ACTION_KEYS = ["view", "create", "modify", "cancel", "delete"] as const;
type ActionKey = typeof ACTION_KEYS[number];

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  client_admin: "Organization Admin",
  admin: "Admin",
  cxo: "CXO",
  procurement_manager: "Procurement Manager",
  procurement_executive: "Procurement Executive",
  finance_manager: "Finance Manager",
  finance_executive: "Finance Executive",
  facility_manager: "Facility Manager",
  site_engineer: "Site Engineer",
  site_keeper: "Site Keeper",
  store_keeper: "Store Keeper",
  project_head: "Project Head",
  vendor: "Vendor"
};

function blankPermissions() {
  return { view: false, create: false, modify: false, cancel: false, delete: false };
}

export default function RoleBaseAccessPage() {
  const queryClient = useQueryClient();

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<ActionKey, boolean>>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [currentMappingId, setCurrentMappingId] = useState<number | null>(null);

  // Fetch using React Query
  const { data: sites = [], isLoading: isLoadingSites } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: api.getSites
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: api.getRoles
  });

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: api.getDepartments
  });

  const { data: mappings = [], isLoading: isLoadingMappings } = useQuery<RoleAccessMapping[]>({
    queryKey: ["roleAccessMappings"],
    queryFn: api.getRoleAccessMappings
  });

  const loading = isLoadingSites || isLoadingRoles || isLoadingDepts || isLoadingMappings;

  // Selected site primary department context ID
  const selectedDeptId = useMemo(() => {
    if (!selectedSiteId) return null;
    const depts = departments.filter((d) => d.site === Number(selectedSiteId));
    return depts.length > 0 ? depts[0].id : null;
  }, [departments, selectedSiteId]);

  // Handle selected site & role updates
  useEffect(() => {
    if (!selectedSiteId || !selectedRoleId) {
      setTitle("");
      setPermissions({});
      setIsEditMode(false);
      setCurrentMappingId(null);
      return;
    }

    const roleObj = roles.find((r) => String(r.id) === selectedRoleId);
    const siteObj = sites.find((s) => String(s.id) === selectedSiteId);
    if (!roleObj || !siteObj) return;

    const displayRole = ROLE_LABELS[roleObj.role_name.toLowerCase()] || roleObj.role_name;
    setTitle(`${displayRole} - ${siteObj.name}`);

    // Look for department specific mapping
    let matchedMapping = mappings.find(
      (m) => m.role === roleObj.id && m.department === selectedDeptId
    );

    // Fallback to global mapping
    if (!matchedMapping) {
      matchedMapping = mappings.find(
        (m) => m.role === roleObj.id && m.department === null
      );
    }

    if (matchedMapping) {
      setCurrentMappingId(matchedMapping.department === selectedDeptId ? matchedMapping.id : null);
      
      const loadedPerms: Record<string, Record<ActionKey, boolean>> = {};
      MODULE_ACCESS_SECTIONS.forEach((section) => {
        section.items.forEach((item) => {
          const matchedPerms = matchedMapping?.permissions?.[item.key] || {};
          loadedPerms[item.key] = {
            view: !!matchedPerms.view,
            create: !!matchedPerms.create,
            modify: !!(matchedPerms.modify || matchedPerms.edit),
            cancel: !!matchedPerms.cancel,
            delete: !!matchedPerms.delete
          };
        });
      });
      setPermissions(loadedPerms);
      setIsEditMode(false);
    } else {
      setCurrentMappingId(null);
      const newPerms: Record<string, Record<ActionKey, boolean>> = {};
      MODULE_ACCESS_SECTIONS.forEach((section) => {
        section.items.forEach((item) => {
          newPerms[item.key] = blankPermissions();
        });
      });
      setPermissions(newPerms);
      setIsEditMode(true);
    }

    // Default open groups
    const defaultOpen: Record<string, boolean> = {};
    MODULE_ACCESS_SECTIONS.forEach((group) => {
      defaultOpen[group.title] = true;
    });
    setOpenGroups(defaultOpen);

  }, [selectedSiteId, selectedRoleId, selectedDeptId, roles, sites, mappings]);

  // Save permissions mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: number; role: number; department: number | null; permissions: any }) => {
      // Structure DB permissions to save both edit/modify to ensure backend compatibility
      const dbPermissions = Object.fromEntries(
        Object.entries(payload.permissions).map(([key, p]: [string, any]) => [
          key,
          {
            view: !!p.view,
            create: !!p.create,
            edit: !!p.modify,
            modify: !!p.modify,
            cancel: !!p.cancel,
            delete: !!p.delete
          }
        ])
      );

      if (payload.id) {
        return api.updateRoleAccessMapping(payload.id, { permissions: dbPermissions });
      }
      return api.createRoleAccessMapping({
        role: payload.role,
        department: payload.department,
        permissions: dbPermissions
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roleAccessMappings"] });
      toast({ title: "Success", description: "Mapping saved successfully." });
      setIsEditMode(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: `Failed to save mapping: ${err.message}`, variant: "destructive" });
    }
  });

  const assignedCount = useMemo(() => {
    return Object.values(permissions).reduce(
      (sum, p) => (ACTION_KEYS.some((action) => !!p?.[action]) ? sum + 1 : sum),
      0
    );
  }, [permissions]);

  const togglePermission = (featureKey: string, action: ActionKey, enabled: boolean) => {
    if (!isEditMode) return;
    setPermissions((prev) => ({
      ...prev,
      [featureKey]: {
        ...blankPermissions(),
        ...(prev[featureKey] || {}),
        [action]: enabled,
      },
    }));
  };

  const toggleGroupPermission = (group: ModuleSection, action: ActionKey, enabled: boolean) => {
    if (!isEditMode) return;
    setPermissions((prev) => {
      const next = { ...prev };
      group.items.forEach((feature) => {
        next[feature.key] = {
          ...blankPermissions(),
          ...(next[feature.key] || {}),
          [action]: enabled,
        };
      });
      return next;
    });
  };

  const handleSelectAll = () => {
    const next = { ...permissions };
    MODULE_ACCESS_SECTIONS.forEach((group) => {
      group.items.forEach((feature) => {
        next[feature.key] = { view: true, create: true, modify: true, cancel: true, delete: true };
      });
    });
    setPermissions(next);
  };

  const handleClearAll = () => {
    const next = { ...permissions };
    MODULE_ACCESS_SECTIONS.forEach((group) => {
      group.items.forEach((feature) => {
        next[feature.key] = blankPermissions();
      });
    });
    setPermissions(next);
  };

  const isGroupActionChecked = (group: ModuleSection, action: ActionKey) => {
    return group.items.length > 0 && group.items.every((feature) => !!permissions[feature.key]?.[action]);
  };

  const isGroupActionIndeterminate = (group: ModuleSection, action: ActionKey) => {
    const anyChecked = group.items.some((feature) => !!permissions[feature.key]?.[action]);
    return anyChecked && !isGroupActionChecked(group, action);
  };

  const handleSaveMapping = () => {
    if (!selectedSiteId || !selectedRoleId) return;
    saveMutation.mutate({
      id: currentMappingId || undefined,
      role: Number(selectedRoleId),
      department: selectedDeptId,
      permissions
    });
  };

  // Filter backend roles to include only our procurement roles list
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => r.role_name && ROLE_LABELS[r.role_name.toLowerCase()]);
  }, [roles]);

  return (
    <MainLayout>
      <section className="surface org-page">
        <header className="org-page-head">
          <h1 className="text-3xl font-bold text-foreground">Role base access</h1>
        </header>

        <section className="panel">
          <div className="add-org-grid three">
            <div className="field">
              <label>Title</label>
              <input
                className="filter-input"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (selectedRoleId && selectedSiteId && !isEditMode) setIsEditMode(true);
                }}
                placeholder="Enter mapping title"
              />
            </div>
            <div className="field">
              <label>Site</label>
              <select
                className="filter-input"
                value={selectedSiteId}
                onChange={(e) => {
                  setSelectedSiteId(e.target.value);
                  setSelectedRoleId("");
                }}
              >
                <option value="">Select site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} (#{site.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Role</label>
              <select
                className="filter-input"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                disabled={!selectedSiteId}
              >
                <option value="">Select role</option>
                {filteredRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {ROLE_LABELS[role.role_name.toLowerCase()]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="role-access-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsEditMode((v) => !v)}
              disabled={!selectedSiteId || !selectedRoleId}
            >
              {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
            </button>
            <button type="button" className="ghost-btn" onClick={handleSelectAll} disabled={!isEditMode || !selectedRoleId}>
              Select All
            </button>
            <button type="button" className="ghost-btn" onClick={handleClearAll} disabled={!isEditMode || !selectedRoleId}>
              Clear All
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSaveMapping}
              disabled={!isEditMode || !selectedRoleId || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save Mapping"}
            </button>
          </div>

          {loading && <p className="add-org-subtitle">Loading data from backend…</p>}
        </section>

        <section className="panel role-access-panel">
          <div className="role-access-head">
            <h2 className="text-lg font-bold text-foreground">Assigned Features</h2>
            <span className="product-chip role-access-count">{assignedCount} feature(s)</span>
          </div>
          {!selectedSiteId ? (
            <p className="org-detail-muted text-muted-foreground py-4 text-sm">Select a site first to view role-based feature access.</p>
          ) : !selectedRoleId ? (
            <p className="org-detail-muted text-muted-foreground py-4 text-sm">Select a role to see features assigned to that user type.</p>
          ) : (
            <div className="org-table-wrap">
              <table className="org-table role-access-table">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3 px-4 font-bold text-foreground">Module Group</th>
                    <th className="text-center py-3 px-2 font-bold text-foreground">View</th>
                    <th className="text-center py-3 px-2 font-bold text-foreground">Create</th>
                    <th className="text-center py-3 px-2 font-bold text-foreground">Modify</th>
                    <th className="text-center py-3 px-2 font-bold text-foreground">Cancel</th>
                    <th className="text-center py-3 px-2 font-bold text-foreground">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULE_ACCESS_SECTIONS.flatMap((group) => {
                    const isGroupOpen = !!openGroups[group.title];
                    const parentRow = (
                      <tr key={`${group.title}-group`} className="role-access-group-row bg-muted/20 font-bold border-b">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            className="role-access-group-toggle flex items-center gap-2 text-foreground font-bold cursor-pointer"
                            onClick={() => setOpenGroups((prev) => ({ ...prev, [group.title]: !isGroupOpen }))}
                          >
                            <span className={`role-access-caret inline-block transition-transform duration-150 ${isGroupOpen ? "rotate-90" : ""}`}>▸</span>
                            <span>{group.title}</span>
                          </button>
                        </td>
                        {ACTION_KEYS.map((action) => (
                          <td key={`${group.title}-${action}`} className="py-3 px-2 text-center">
                            <label className="role-access-toggle flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-primary"
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

                    if (!isGroupOpen) return [parentRow];

                    const childRows = group.items.map((feature) => {
                      const featurePermissions = permissions[feature.key] || blankPermissions();
                      return (
                        <tr key={feature.key} className="role-access-child-row border-b hover:bg-muted/5">
                          <td className="py-3 px-4">
                            <span className="role-access-child-label text-sm text-foreground pl-6">{feature.label}</span>
                          </td>
                          {ACTION_KEYS.map((action) => (
                            <td key={`${feature.key}-${action}`} className="py-3 px-2 text-center">
                              <label className="role-access-toggle flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-primary"
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
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </MainLayout>
  );
}
