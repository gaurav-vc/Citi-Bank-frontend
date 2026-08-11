import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Building, Building2, MapPin, Text, Hash, FileDigit, Wallet, CheckCircle } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export default function DepartmentPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [siteIdFilter, setSiteIdFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [departmentHead, setDepartmentHead] = useState("");
  const [costCenterCode, setCostCenterCode] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("0.0");
  const [approvalLimit, setApprovalLimit] = useState("0.0");
  const [isActive, setIsActive] = useState(true);
  const [siteId, setSiteId] = useState("");

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery({
    queryKey: ["departments"],
    queryFn: api.getDepartments,
  });

  const { data: orgs = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
    enabled: user?.role === "super_admin",
  });

  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const loading = isLoadingDepts || isLoadingSites || isLoadingOrgs;

  const [selectedOrgId, setSelectedOrgId] = useState("");

  const filteredSites = useMemo(() => {
    if (user?.role === "super_admin" && selectedOrgId) {
      return sites.filter((s: any) => s.organization === Number(selectedOrgId));
    }
    return sites;
  }, [sites, user?.role, selectedOrgId]);

  useEffect(() => {
    if (filteredSites.length === 1 && !siteId) {
      setSiteId(String(filteredSites[0].id));
    }
  }, [filteredSites, siteId]);

  const filteredRows = useMemo(() => {
    return departments.filter((row: any) => {
      if (siteIdFilter !== "all" && row.site !== Number(siteIdFilter)) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (row.name || "").toLowerCase().includes(q) ||
        (row.code || "").toLowerCase().includes(q) ||
        (row.department_head || "").toLowerCase().includes(q)
      );
    });
  }, [departments, siteIdFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editId) {
        return api.updateDepartment(editId, data);
      }
      return api.createDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Success", description: "Department saved successfully." });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save department.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({ title: "Success", description: "Department deleted successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to delete department.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setIsFormOpen(false);
    setEditId(null);
    setName("");
    setCode("");
    setDescription("");
    setDepartmentHead("");
    setCostCenterCode("");
    setBudgetLimit("0.0");
    setApprovalLimit("0.0");
    setIsActive(true);
    setSiteId("");
  };

  const handleEdit = (row: any) => {
    setEditId(row.id);
    setName(row.name || "");
    setCode(row.code || "");
    setDescription(row.description || "");
    setDepartmentHead(row.department_head || "");
    setCostCenterCode(row.cost_center_code || "");
    setBudgetLimit(row.budget_limit || "0.0");
    setApprovalLimit(row.approval_limit || "0.0");
    setIsActive(row.is_active !== false);
    setSiteId(row.site ? String(row.site) : "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Required Field", description: "Department Name is required", variant: "destructive" });
      return;
    }
    
    let finalSiteId = siteId;
    if (!finalSiteId && user?.role !== "super_admin") {
      if (user?.profile?.site_id) {
        finalSiteId = String(user.profile.site_id);
      } else if (filteredSites.length > 0) {
        finalSiteId = String(filteredSites[0].id);
      }
    }

    if (!finalSiteId) {
      toast({ title: "Required Field", description: "You must assign the department to a specific site.", variant: "destructive" });
      return;
    }
    
    const payload = {
      site: Number(finalSiteId),
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      department_head: departmentHead.trim() || undefined,
      cost_center_code: costCenterCode.trim() || undefined,
      budget_limit: budgetLimit,
      approval_limit: approvalLimit,
      is_active: isActive,
    };
    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization's departments, budget limits, and approval routing.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-200 dark:shadow-none flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Department</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments..."
              className="pl-10 h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl text-sm"
            />
          </div>
          <div className="relative">
            <select
              value={siteIdFilter}
              onChange={(e) => setSiteIdFilter(e.target.value)}
              className="h-10 px-4 pr-10 appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sites</option>
              {sites.map((site: any) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden rounded-xl bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Department Name</th>
                <th className="px-5 py-4 whitespace-nowrap">Code</th>
                <th className="px-5 py-4 whitespace-nowrap">Head</th>
                <th className="px-5 py-4 whitespace-nowrap">Cost Center</th>
                <th className="px-5 py-4 whitespace-nowrap">Status</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
                      Loading departments...
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No departments found.
                  </td>
                </tr>
              ) : (
                filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                          <Building className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {row.name}
                          </div>
                          {row.description && (
                            <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                              {row.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">
                      {row.code || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {row.department_head || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {row.cost_center_code || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-none ${row.is_active ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-950/30' : 'border-slate-200 text-slate-500 bg-slate-50 dark:bg-slate-900'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          onClick={() => handleEdit(row)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(row.id, row.name)} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredRows.length > PAGE_SIZE && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <DataTablePagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredRows.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
                onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredRows.length / PAGE_SIZE), p + 1))}
                onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit Department Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-0 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Building className="h-4 w-4" />
                </div>
                {editId ? "Update Department" : "Add New Department"}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1.5 text-muted-foreground">
                Configure department details, head assignments, and budget limits.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Text className="h-3.5 w-3.5" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department Name <span className="text-red-500">*</span></Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Facilities Management" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department Code</Label>
                    <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. FM-001" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  {user?.role === "super_admin" && (
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization (Super Admin Filter)</Label>
                      <select 
                        value={selectedOrgId} 
                        onChange={e => {
                          setSelectedOrgId(e.target.value);
                          setSiteId(""); // Reset site when org changes
                        }}
                        className="w-full h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Organizations</option>
                        {orgs.map((o: any) => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assign to Site <span className="text-red-500">*</span></Label>
                    <select 
                      value={siteId} 
                      onChange={e => setSiteId(e.target.value)}
                      required
                      disabled={user?.role !== "super_admin" && filteredSites.length === 1}
                      className="w-full h-10 px-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    >
                      <option value="">Select a Site</option>
                      {filteredSites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Brief overview of the department's function..."
                      className="w-full rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

              {/* Management & Limits */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" /> Management & Finances
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Department Head</Label>
                    <Input value={departmentHead} onChange={e => setDepartmentHead(e.target.value)} placeholder="Name of Head" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cost Center Code</Label>
                    <Input value={costCenterCode} onChange={e => setCostCenterCode(e.target.value)} placeholder="e.g. CC-100" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Budget Limit (Monthly)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <Input type="number" step="0.01" value={budgetLimit} onChange={e => setBudgetLimit(e.target.value)} className="pl-7 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approval Limit</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <Input type="number" step="0.01" value={approvalLimit} onChange={e => setApprovalLimit(e.target.value)} className="pl-7 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

              {/* Status */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Active Status</Label>
                  <p className="text-xs text-muted-foreground">Inactive departments cannot be assigned to new users or indents.</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

            </div>
            
            <DialogFooter className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="text-slate-500 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm">
                {saveMutation.isPending ? "Saving..." : (editId ? "Update Department" : "Create Department")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
