import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
      { key: "procurement:rfqs_compare", label: "Quotation Comparison" },
      { key: "procurement:orders", label: "Purchase Orders" },
      { key: "procurement:vendors", label: "Vendors" },
      { key: "procurement:approvals", label: "Approvals" }
    ]
  },
  {
    id: "inventory",
    title: "Inventory",
    items: [
      { key: "procurement:items", label: "Item Master" },
      { key: "procurement:inventory", label: "Stock Ledger", starred: true },
      { key: "procurement:grn", label: "GRN Entry" },
      { key: "procurement:issue_to_site", label: "Issue To Site (GDN)" },
      { key: "procurement:inventory_transfer", label: "Stock Transfer" },
      { key: "procurement:inventory_scrap", label: "Scrap Disposal" },
      { key: "procurement:inventory_rtv", label: "Return To Vendor" }
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
      { key: "procurement:billing_approvals", label: "Finance Approvals" },
      { key: "procurement:payments_proposals", label: "Payment Proposals" },
      { key: "procurement:payments", label: "Payments" },
      { key: "procurement:payments_utr", label: "UTR Management" },
      { key: "procurement:budgets", label: "Budgets" }
    ]
  },
  {
    id: "reports_analytics",
    title: "Reports & Analytics",
    items: [
      { key: "core:dashboard", label: "Dashboard", starred: true },
      { key: "procurement:reports_spend", label: "Spend Analytics" },
      { key: "procurement:reports_inventory", label: "Inventory Reports" },
      { key: "procurement:reports_invoice", label: "Invoice Reports" },
      { key: "procurement:reports_audit", label: "Audit Reports" },
      { key: "procurement:ai", label: "AI Recommendations" }
    ]
  },
  {
    id: "setup_admin",
    title: "Setup & Administration",
    items: [
      { key: "core:users", label: "Users & Roles" },
      { key: "core:settings", label: "Role Permissions" },
      { key: "core:workflows", label: "Approval Workflows" }
    ]
  }
];

const ACTION_KEYS = ["view", "create", "modify", "delete"] as const;
type ActionKey = typeof ACTION_KEYS[number];

function blankPermissions() {
  return { view: false, create: false, modify: false, delete: false, approve: false };
}

export default function ModulesPermissionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<Record<string, Record<ActionKey, boolean>>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: api.getRoles,
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
      <div className="surface w-full">

        {/* Head Area */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {user?.role === 'admin' ? 'Role Permissions' : 'Modules & Permissions'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role === 'admin'
                ? 'Set module access permissions for roles within your site.'
                : 'Control sidebar visibility and granular actions per role. Users inherit permissions from their assigned role.'}
            </p>
          </div>
        </div>

        {/* Role Config Panel */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-6 shadow-xs">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Configuring Permissions For</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="h-9 w-64 rounded-md border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-xs outline-none font-semibold text-slate-800 dark:text-slate-200"
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

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => {
                  if (selectedRoleId) setIsPreviewOpen(true);
                  else toast({ title: "Select a role", description: "Please select a role to preview.", variant: "destructive" });
                }}
                variant="outline"
                className="text-xs font-semibold h-9 border-slate-200 dark:border-slate-800"
              >
                <Eye className="mr-1.5 h-4 w-4" /> Preview as Role
              </Button>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={!selectedRoleId || syncMutation.isPending}
                variant="outline"
                className="text-xs font-semibold h-9 border-slate-200 dark:border-slate-800"
              >
                <Settings className="mr-1.5 h-4 w-4" /> {syncMutation.isPending ? "Syncing..." : "Sync App Routes"}
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!selectedRoleId || saveMutation.isPending}
                className="bg-orange-650 hover:bg-orange-700 text-white text-xs font-semibold h-9"
              >
                <Save className="mr-1.5 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
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

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Eye className="h-10 w-15 text-slate-500" />
                Role Preview: {selectedRole?.role_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                This is a live preview of the modules and sections this role will be able to view based on the current configuration.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 shadow-inner">
              <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
                {MODULE_ACCESS_SECTIONS.map((group) => {
                  const visibleItems = group.items.filter(item => permissions[item.key]?.view);
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.id} className="space-y-1">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {group.title}
                      </div>
                      <div className="space-y-0.5">
                        {visibleItems.map(item => (
                          <div key={item.key} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-white dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Star className={`h-3.5 w-3.5 ${item.starred ? "text-orange-500 fill-orange-500" : "text-slate-300 dark:text-slate-700"}`} />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {permissions[item.key]?.create && <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-green-200 text-green-700 bg-green-50 uppercase shadow-none">Create</Badge>}
                              {permissions[item.key]?.modify && <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-blue-200 text-blue-700 bg-blue-50 uppercase shadow-none">Modify</Badge>}
                              {permissions[item.key]?.delete && <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-red-200 text-red-700 bg-red-50 uppercase shadow-none">Delete</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {MODULE_ACCESS_SECTIONS.every(group => group.items.filter(item => permissions[item.key]?.view).length === 0) && (
                  <div className="p-8 text-center text-slate-400">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No modules are visible to this role.</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </MainLayout>
  );
}
