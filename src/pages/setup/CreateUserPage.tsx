import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function CreateUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // State for manually generated or resolved fields
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: api.getRoles,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: api.getDepartments,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  // Get current user details if editing
  const editingUser = useMemo(() => {
    if (!isEdit) return null;
    return users.find((u: any) => String(u.id) === String(id)) || null;
  }, [users, id, isEdit]);

  // Sync state if editing
  useEffect(() => {
    if (editingUser) {
      setMfaEnabled(editingUser.profile?.mfa_enabled !== false);
      setIsActive(!!editingUser.is_active);
    }
  }, [editingUser]);

  // Generate next Employee ID
  const generatedEmpId = useMemo(() => {
    if (editingUser) return editingUser.profile?.employee_id || "";
    const nextNum = users.length + 1;
    return `EMP${String(nextNum).padStart(3, '0')}`;
  }, [editingUser, users]);

  // Mutator
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return api.updateUser(id!, data);
      }
      return api.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Success", description: isEdit ? "User updated successfully." : "User created successfully." });
      navigate("/setup/users-roles");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to save user.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      department: formData.get("department"),
      department_id: formData.get("department"),
      site: formData.get("site"),
      site_id: formData.get("site"),
      employee_id: formData.get("employee_id"),
      designation: formData.get("designation"),
      mobile: formData.get("mobile"),
      reporting_manager: formData.get("reporting_manager") || null,
      mfa_enabled: mfaEnabled,
      is_active: isActive,
    };

    saveMutation.mutate(payload);
  };

  return (
    <MainLayout>
      <div className="surface min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        
        {/* Breadcrumbs */}
        <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5 font-medium">
          <span>Dashboard</span>
          <ChevronRight className="h-3 w-3" />
          <span>Setup</span>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:underline cursor-pointer" onClick={() => navigate("/setup/users-roles")}>Users & Roles</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-semibold">{isEdit ? "Edit User" : "New User"}</span>
        </div>

        {/* Head Bar */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/setup/users-roles")} className="h-9 w-9 border-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEdit ? "Edit User" : "New User"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fields are linked to keep your hierarchy consistent.
            </p>
          </div>
        </div>

        {/* Form Box */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-2xl shadow-xs">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: Personal Information */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Personal Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Full Name *</Label>
                    <Input name="name" defaultValue={editingUser?.name || ""} placeholder="e.g. Aarav Mehta" required className="text-xs bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Employee ID *</Label>
                    <Input 
                      name="employee_id" 
                      key={generatedEmpId}
                      defaultValue={generatedEmpId} 
                      placeholder="EMP001" 
                      required 
                      className="text-xs bg-slate-50 border-slate-200" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Email *</Label>
                    <Input name="email" type="email" defaultValue={editingUser?.email || ""} placeholder="user@logicon.io" required className="text-xs bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Mobile</Label>
                    <Input name="mobile" defaultValue={editingUser?.profile?.phone_number || ""} placeholder="+91 98100 00000" className="text-xs bg-slate-50 border-slate-200" />
                  </div>
                </div>
              </div>

              {/* Section 2: Organizational Assignment */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Organizational Assignment</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Department *</Label>
                    <select name="department" defaultValue={editingUser?.profile?.department || ""} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-55 px-3 py-1 text-xs outline-none font-medium text-slate-700">
                      <option value="">Select...</option>
                      {departments.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Designation *</Label>
                    <Input name="designation" defaultValue={editingUser?.profile?.designation || ""} placeholder="Designation Name" required className="text-xs bg-slate-50 border-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Role *</Label>
                    <select name="role" defaultValue={editingUser?.role || ""} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-55 px-3 py-1 text-xs outline-none font-medium text-slate-700">
                      <option value="">Select...</option>
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.role_name}>{r.role_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Region *</Label>
                    <select name="region" className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-55 px-3 py-1 text-xs outline-none font-medium text-slate-700">
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Site</Label>
                    <select name="site" defaultValue={editingUser?.profile?.site || ""} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-55 px-3 py-1 text-xs outline-none font-medium text-slate-700">
                      <option value="">Select...</option>
                      {sites.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-550 dark:text-slate-400">Reporting Manager</Label>
                    <select name="reporting_manager" defaultValue={editingUser?.profile?.reporting_manager || ""} className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-55 px-3 py-1 text-xs outline-none font-medium text-slate-700">
                      <option value="">Select...</option>
                      {users.filter(u => u.id !== editingUser?.id).map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Security */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Security</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-550">MFA Enabled</span>
                    <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-550">Status</span>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => navigate("/setup/users-roles")} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} className="bg-orange-650 hover:bg-orange-700 text-white text-xs font-semibold">
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </MainLayout>
  );
}
