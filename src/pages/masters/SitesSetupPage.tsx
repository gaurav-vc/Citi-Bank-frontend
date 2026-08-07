import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { Edit, Trash2, ArrowLeft } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export default function SitesSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [projectType, setProjectType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const { data: orgs = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const loading = isLoadingSites || isLoadingOrgs;

  const contextOrg = useMemo(() => {
    if (!organizationId) return null;
    return orgs.find((o) => o.id === Number(organizationId)) || null;
  }, [orgs, organizationId]);

  const rows = useMemo(() => {
    if (!organizationId) return sites;
    return sites.filter((s) => s.organization === Number(organizationId));
  }, [sites, organizationId]);

  const newSiteHref = organizationId
    ? `/masters/sites/new?organizationId=${encodeURIComponent(organizationId)}`
    : "/masters/sites/new";

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const type = row.site_type || "";
      if (projectType !== "all" && type !== projectType) return false;
      if (!q) return true;
      const siteName = row.name || "";
      const address = row.address || "";
      const contactName = row.site_manager_name || "";
      const contactEmail = row.site_manager_email || "";
      return `${siteName} ${address} ${contactName} ${contactEmail}`.toLowerCase().includes(q);
    });
  }, [rows, search, projectType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length]);

  const deleteMutation = useMutation({
    mutationFn: (siteId: number | string) => api.deleteSite(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (err: any) => {
      window.alert(`Unable to delete site: ${err.message}`);
    },
  });

  const handleDeleteSite = (row: any) => {
    if (!row?.id) return;
    if (!window.confirm(`Delete site "${row.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(row.id);
  };

  return (
    <MainLayout>
      <section className="surface org-page">
        <header className="org-page-head">
          <h1 className="text-3xl font-bold">Sites List</h1>
          <button type="button" className="primary-btn" onClick={() => navigate(newSiteHref)}>
            + Add Site
          </button>
        </header>

        {contextOrg ? (
          <section className="panel org-detail-context-banner flex items-center justify-between">
            <p>
              <strong>Organization context:</strong> {contextOrg.company_name || contextOrg.name}
              <button
                type="button"
                className="link-btn org-detail-context-clear ml-4 text-blue-600 hover:underline"
                onClick={() => navigate("/masters/sites")}
              >
                Clear filter
              </button>
            </p>
            <button
              type="button"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
              onClick={() => navigate(`/masters/organizations/${contextOrg.id}`)}
            >
              <ArrowLeft className="w-4 h-4" /> Go back to Organization
            </button>
          </section>
        ) : null}

        <section className="panel">
          <div className="sites-filter-row">
            <input
              className="filter-input"
              placeholder="Search site..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-input"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
            >
              <option value="all">Product Type</option>
              <option value="Vibe Connect">Vibe Connect</option>
              <option value="HRMS">HRMS</option>
              <option value="Vibecopilot">Vibecopilot</option>
            </select>
          </div>
        </section>

        <section className="panel org-table-wrap">
          {loading ? <p className="add-org-subtitle">Loading sites…</p> : null}
          <table className="org-table sites-table">
            <thead>
              <tr>
                <th>Site ID</th>
                <th>Company</th>
                <th>Organization ID</th>
                <th>Site / Project</th>
                <th>Address</th>
                <th>Product Type</th>
                <th>Contact</th>
                <th>Total Users</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="org-detail-muted">
                    No sites found. Click "+ Add Site" to create one.
                  </td>
                </tr>
              ) : (
                filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((row) => {
                  const orgName = row.organization_name || "";
                  const formattedDate = row.created_at
                    ? new Date(row.created_at).toLocaleString("en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    : "-";
                  return (
                    <tr key={row.id}>
                      <td>{row.id || "-"}</td>
                      <td>{orgName || "-"}</td>
                      <td>{row.organization || "-"}</td>
                      <td>{row.name}</td>
                      <td>{row.address || "-"}</td>
                      <td>
                        <span className="product-chip">{row.site_type || "-"}</span>
                      </td>
                      <td>
                        {row.site_manager_email && row.site_manager_email !== "-"
                          ? row.site_manager_email
                          : row.site_manager_name || "-"}
                      </td>
                      <td>{row.active_projects || "0"}</td>
                      <td>
                        <span className={`status ${row.is_active === false ? "inactive" : "active"}`}>
                          {row.is_active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>Admin</td>
                      <td>{formattedDate}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="link-btn org-table-view-btn text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center p-1 rounded-md hover:bg-slate-100 transition-colors"
                            title="Edit Site"
                            onClick={() =>
                              navigate(
                                `/masters/sites/new?siteId=${encodeURIComponent(row.id)}${
                                  row.organization
                                    ? `&organizationId=${encodeURIComponent(row.organization)}`
                                    : ""
                                }`
                              )
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="link-btn org-table-view-btn text-red-500 hover:text-red-700 font-medium flex items-center justify-center p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Site"
                            onClick={() => handleDeleteSite(row)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        </section>
      </section>
    </MainLayout>
  );
}
