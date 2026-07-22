import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SetupLayout } from "@/layouts/SetupLayout";
import { useAuth } from "@/contexts/AuthContext";

export default function DepartmentPage() {
  const { user } = useAuth();
  const isSiteAdmin = user?.role === 'admin';
  const queryClient = useQueryClient();
  const [siteIdFilter, setSiteIdFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

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

  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const loading = isLoadingDepts || isLoadingSites;

  const filteredRows = useMemo(() => {
    return departments.filter((row) => {
      if (siteIdFilter !== "all" && row.site !== Number(siteIdFilter)) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        (row.code || "").toLowerCase().includes(q) ||
        (row.department_head || "").toLowerCase().includes(q)
      );
    });
  }, [departments, siteIdFilter, search]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editId) {
        return api.updateDepartment(editId, data);
      }
      return api.createDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      resetForm();
    },
    onError: (err: any) => {
      window.alert(`Failed to save department: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (err: any) => {
      window.alert(`Failed to delete department: ${err.message}`);
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
      window.alert("Department Name is required");
      return;
    }
    const payload = {
      site: siteId ? Number(siteId) : null,
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
    <SetupLayout>
      <section className="surface org-page">
        <header className="org-page-head">
          <h1 className="text-3xl font-bold">Department Management</h1>
          {!isFormOpen && (
            <button className="primary-btn" onClick={() => setIsFormOpen(true)}>
              + Add Department
            </button>
          )}
        </header>

        {isFormOpen ? (
          <form onSubmit={handleSubmit} className="panel add-site-card">
            <h2 className="add-site-section-heading">
              {editId ? "Update Department" : "Department details"}
            </h2>
            <div className="add-org-grid two add-site-fields">
              <div className="field">
                <label>
                  Department Name <span className="required-star">*</span>
                </label>
                <input
                  className="filter-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Quality Assurance"
                  required
                />
              </div>

              <div className="field">
                <label>Department Code</label>
                <input
                  className="filter-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., DEPT-QA"
                />
              </div>

              {/* Hide site selector for admin — site is locked to their site by backend */}
              {!isSiteAdmin && (
                <div className="field">
                  <label>Select Site context</label>
                  <select
                    className="filter-input add-site-select"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                  >
                    <option value="">No site linked</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label>Cost Center Code</label>
                <input
                  className="filter-input"
                  value={costCenterCode}
                  onChange={(e) => setCostCenterCode(e.target.value)}
                  placeholder="e.g., CC-1002"
                />
              </div>

              <div className="field">
                <label>Department Head</label>
                <input
                  className="filter-input"
                  value={departmentHead}
                  onChange={(e) => setDepartmentHead(e.target.value)}
                  placeholder="e.g., Alice Vance"
                />
              </div>

              <div className="field">
                <label>Budget Limit (INR)</label>
                <input
                  className="filter-input"
                  type="number"
                  step="any"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Approval Limit (INR)</label>
                <input
                  className="filter-input"
                  type="number"
                  step="any"
                  value={approvalLimit}
                  onChange={(e) => setApprovalLimit(e.target.value)}
                />
              </div>

              <div className="field add-site-status-row">
                <label>Status</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="field add-site-full-row">
                <label>Description</label>
                <textarea
                  className="filter-input add-site-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <footer className="form-footer mt-4">
              <button type="button" className="ghost-btn" onClick={resetForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : "Save Department"}
              </button>
            </footer>
          </form>
        ) : (
          <>
            <section className="panel">
              <div className="sites-filter-row">
                <input
                  className="filter-input"
                  placeholder="Search department name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {/* Hide site filter for admin — they only see their own site */}
                {!isSiteAdmin && (
                  <select
                    className="filter-input"
                    value={siteIdFilter}
                    onChange={(e) => setSiteIdFilter(e.target.value)}
                  >
                    <option value="all">Filter by Site</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </section>

            <section className="panel org-table-wrap">
              {loading ? <p className="add-org-subtitle">Loading departments…</p> : null}
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Dept ID</th>
                    <th>Code</th>
                    <th>Department Name</th>
                    <th>Linked Site</th>
                    <th>Cost Center</th>
                    <th>Department Head</th>
                    <th>Budget Limit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4 text-muted-foreground">
                        No departments found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.code || "-"}</td>
                        <td>{row.name}</td>
                        <td>{row.site_name || "-"}</td>
                        <td>{row.cost_center_code || "-"}</td>
                        <td>{row.department_head || "-"}</td>
                        <td>{row.budget_limit || "0.00"}</td>
                        <td>
                          <span
                            className={`status ${row.is_active === false ? "inactive" : "active"}`}
                          >
                            {row.is_active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="link-btn org-table-view-btn"
                            onClick={() => handleEdit(row)}
                          >
                            Edit
                          </button>
                          <span className="org-detail-action-sep" aria-hidden="true">
                            {" "}
                            ·{" "}
                          </span>
                          <button
                            type="button"
                            className="link-btn org-table-view-btn"
                            onClick={() => handleDelete(row.id, row.name)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </section>
    </SetupLayout>
  );
}
