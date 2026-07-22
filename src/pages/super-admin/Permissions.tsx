import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronRight, Settings, ShieldCheck, Eye, EyeOff, Save, Check, Star } from "lucide-react";

interface ModuleItem {
  key: string;
  label: string;
  starred?: boolean;
}

interface ModuleSection {
  id: string;
  title: string;
  items: ModuleItem[];
}

const MODULE_ACCESS_SECTIONS: ModuleSection[] = [
  {
    id: "procurement",
    title: "Procurement",
    items: [
      { key: "procurement:indents", label: "Indents", starred: true },
      { key: "procurement:rfqs", label: "RFQs" },
      { key: "procurement:rfqs", label: "Quotation Comparison" },
      { key: "procurement:orders", label: "Purchase Orders" },
      { key: "procurement:vendors", label: "Vendors" },
      { key: "procurement:indents", label: "Approvals" }
    ]
  },
  {
    id: "inventory",
    title: "Inventory",
    items: [
      { key: "procurement:items", label: "Item Master" },
      { key: "procurement:inventory", label: "Stock Ledger", starred: true },
      { key: "procurement:grn", label: "GRN Entry" },
      { key: "procurement:inventory", label: "Issue To Site (GDN)" },
      { key: "procurement:inventory", label: "Stock Transfer" },
      { key: "procurement:inventory", label: "Scrap Disposal" },
      { key: "procurement:inventory", label: "Return To Vendor" }
    ]
  },
  {
    id: "qc_execution",
    title: "QC & Execution",
    items: [
      { key: "procurement:qc", label: "Quality Inspection", starred: true }
    ]
  },
  {
    id: "finance_billing",
    title: "Finance & Billing",
    items: [
      { key: "procurement:billing", label: "Invoices", starred: true },
      { key: "procurement:billing", label: "Finance Approvals" },
      { key: "procurement:payments", label: "Payment Proposals" },
      { key: "procurement:payments", label: "Payments" },
      { key: "procurement:payments", label: "UTR Management" },
      { key: "procurement:budgets", label: "Budgets" }
    ]
  },
  {
    id: "reports_analytics",
    title: "Reports & Analytics",
    items: [
      { key: "core:dashboard", label: "Dashboard", starred: true },
      { key: "procurement:reports", label: "Spend Analytics" },
      { key: "procurement:reports", label: "Inventory Reports" },
      { key: "procurement:reports", label: "Invoice Reports" },
      { key: "procurement:reports", label: "Audit Reports" },
      { key: "procurement:ai", label: "AI Recommendations" }
    ]
  }
];

const ACTION_KEYS = ["view", "create", "modify", "delete"] as const;
type ActionKey = typeof ACTION_KEYS[number];

function blankPermissions() {
  return { view: false, create: false, modify: false, delete: false, approve: false };
}

import { MainLayout } from "@/components/layout/MainLayout";
export default function SuperAdminPermissions() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<Record<string, Record<ActionKey, boolean>>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const filteredSites = selectedOrgId ? sites.filter((s: any) => String(s.organization) === String(selectedOrgId)) : sites;

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles", selectedOrgId, selectedSiteId],
    queryFn: () => api.getRoles({ organization_id: selectedOrgId, site_id: selectedSiteId }),
  });

  const { data: permissionsList = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ["role-module-permissions"],
    queryFn: api.getRoleModulePermissions,
  });

  const selectedRole = useMemo(() => {
    return roles.find(r => String(r.id) === String(selectedRoleId)) || null;
  }, [roles, selectedRoleId]);

  // Sync state from database permissions list when selected role changes
  useEffect(() => {
    if (!selectedRoleId) {
      setPermissions({});
      return;
    }

    const loadedPerms: Record<string, Record<ActionKey, boolean>> = {};
    MODULE_ACCESS_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        const matched = permissionsList.find(
          (p: any) => String(p.role) === String(selectedRoleId) && p.module_key === item.key
        );

        loadedPerms[item.key] = {
          view: matched ? !!matched.can_view : false,
          create: matched ? !!matched.can_create : false,
          modify: matched ? !!matched.can_edit : false,
          delete: matched ? !!matched.can_delete : false
        };
      });
    });

    setPermissions(loadedPerms);

    // Default open all groups
    const defaultOpen: Record<string, boolean> = {};
    MODULE_ACCESS_SECTIONS.forEach((group) => {
      defaultOpen[group.title] = true;
    });
    setOpenGroups(defaultOpen);
  }, [selectedRoleId, permissionsList]);

  // Batch Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) return;
      const promises: Promise<any>[] = [];

      Object.entries(permissions).forEach(([moduleKey, perm]) => {
        const existing = permissionsList.find(
          (p: any) => String(p.role) === String(selectedRoleId) && p.module_key === moduleKey
        );

        const payload = {
          can_view: perm.view,
          can_create: perm.create,
          can_edit: perm.modify,
          can_delete: perm.delete,
          can_approve: perm.modify // fallback mapping
        };

        if (existing) {
          const changed =
            existing.can_view !== payload.can_view ||
            existing.can_create !== payload.can_create ||
            existing.can_edit !== payload.can_edit ||
            existing.can_delete !== payload.can_delete;

          if (changed) {
            promises.push(api.updateRoleModulePermission(existing.id, payload));
          }
        } else {
          const hasAny = perm.view || perm.create || perm.modify || perm.delete;
          if (hasAny) {
            promises.push(
              api.saveRoleModulePermission({
                role: Number(selectedRoleId),
                module_key: moduleKey,
                ...payload
              })
            );
          }
        }
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

  const togglePermission = (featureKey: string, action: ActionKey, enabled: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [featureKey]: {
        ...(prev[featureKey] || { view: false, create: false, modify: false, delete: false }),
        [action]: enabled,
      },
    }));
  };

  const toggleGroupPermission = (group: ModuleSection, action: ActionKey, enabled: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      group.items.forEach((feature) => {
        next[feature.key] = {
          ...(next[feature.key] || { view: false, create: false, modify: false, delete: false }),
          [action]: enabled,
        };
      });
      return next;
    });
  };

  const isGroupActionChecked = (group: ModuleSection, action: ActionKey) => {
    return group.items.length > 0 && group.items.every((feature) => !!permissions[feature.key]?.[action]);
  };

  const isGroupActionIndeterminate = (group: ModuleSection, action: ActionKey) => {
    const anyChecked = group.items.some((feature) => !!permissions[feature.key]?.[action]);
    return anyChecked && !isGroupActionChecked(group, action);
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoleId) return;
      return api.syncAppRoutes(selectedRoleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-module-permissions"] });
      toast({ title: "Success", description: "App routes synced and permissions granted successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to sync app routes.", variant: "destructive" });
    }
  });

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Global Role Permissions</h1>
        </div>
        <div className="surface w-full">



          {/* Role Config Panel */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6 shadow-xs">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Organization</span>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedSiteId(""); }}
                      className="h-9 w-48 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">All Organizations</option>
                      {organizations.map((org: any) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Site</span>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="h-9 w-48 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <option value="">All Sites</option>
                      {filteredSites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        className="h-9 w-48 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="">Select role...</option>
                        {roles.map((r: any) => (
                          <option key={r.id} value={r.id}>{r.role_name}</option>
                        ))}
                      </select>
                      {selectedRole && (
                        <Badge className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                          {selectedRole.access_level || "Site"} scope
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={() => syncMutation.mutate()}
                    disabled={!selectedRoleId || syncMutation.isPending}
                    variant="outline"
                    className="w-36 text-xs font-semibold h-9 border-slate-200 dark:border-slate-800"
                  >
                    <Settings className="mr-1.5 h-4 w-4" /> {syncMutation.isPending ? "Syncing..." : "Sync App Routes"}
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!selectedRoleId || saveMutation.isPending}
                    className="w-36 bg-primary hover:bg-primary/90 text-white text-xs font-semibold h-9 rounded-lg"
                  >
                    <Save className="mr-1.5 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table Matrix */}
          {!selectedRoleId ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <ShieldCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-xs text-muted-foreground">Select a role above to configure modules and action permissions.</p>
            </div>
          ) : (
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        <th className="px-5 py-3.5 w-[30%]">Module</th>
                        <th className="px-5 py-3.5 text-center w-[17.5%]">View</th>
                        <th className="px-5 py-3.5 text-center w-[17.5%]">Create</th>
                        <th className="px-5 py-3.5 text-center w-[17.5%]">Modify</th>
                        <th className="px-5 py-3.5 text-center w-[17.5%]">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {MODULE_ACCESS_SECTIONS.flatMap((group) => {
                        const isOpen = !!openGroups[group.title];
                        const parentRow = (
                          <tr key={`${group.id}-parent`} className="bg-slate-50/35 hover:bg-slate-50/50 dark:bg-slate-950/10 dark:hover:bg-slate-950/20 border-b border-slate-200/50">
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => setOpenGroups(p => ({ ...p, [group.title]: !isOpen }))}
                                className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold"
                              >
                                <span className={`text-[10px] transition-transform ${isOpen ? "rotate-90" : ""}`}>▸</span>
                                <span className="uppercase tracking-wide text-[10px]">{group.title}</span>
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-semibold text-slate-500">{group.items.length}</span>
                              </button>
                            </td>
                            {ACTION_KEYS.map((action) => (
                              <td key={`${group.id}-${action}`} className="px-5 py-3.5 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isGroupActionChecked(group, action)}
                                    ref={(el) => {
                                      if (el) el.indeterminate = isGroupActionIndeterminate(group, action);
                                    }}
                                    onChange={(e) => toggleGroupPermission(group, action, e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-350 dark:border-slate-800 text-orange-600 focus:ring-orange-500"
                                  />
                                </label>
                              </td>
                            ))}
                          </tr>
                        );

                        if (!isOpen) return [parentRow];

                        const childRows = group.items.map((feature) => {
                          const featurePerms = permissions[feature.key] || { view: false, create: false, modify: false, delete: false };
                          return (
                            <tr key={feature.key} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors">
                              <td className="px-5 py-3 pl-9">
                                <div className="flex items-center gap-2">
                                  <Star className={`h-3.5 w-3.5 ${feature.starred ? "text-orange-500 fill-orange-500" : "text-slate-300 dark:text-slate-700"}`} />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{feature.label}</span>
                                </div>
                              </td>
                              {ACTION_KEYS.map((action) => (
                                <td key={`${feature.key}-${action}`} className="px-5 py-3 text-center">
                                  <Switch
                                    checked={!!featurePerms[action]}
                                    onCheckedChange={(checked) => togglePermission(feature.key, action, checked)}
                                  />
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
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
