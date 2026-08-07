import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { allCountries, locationTree } from "@/utils/constants";
import { Eye, Edit, Trash2 } from "lucide-react";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

// We will compute hierarchical lists dynamically below.

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const { data: orgsData = [], isLoading: isOrgsLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const { data: sitesData = [], isLoading: isSitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  const orgs: any[] = Array.isArray(orgsData) ? orgsData : (orgsData as any)?.results || [];
  const sites: any[] = Array.isArray(sitesData) ? sitesData : (sitesData as any)?.results || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });

  const loading = isOrgsLoading || isSitesLoading;

  const regions = useMemo(() => {
    let list: string[] = [];
    Object.entries(locationTree).forEach(([c, rTree]) => {
      if (!country || c === country) {
        list = [...list, ...Object.keys(rTree || {})];
      }
    });
    return Array.from(new Set(list));
  }, [country]);

  const states = useMemo(() => {
    let list: string[] = [];
    Object.entries(locationTree).forEach(([c, rTree]) => {
      if (!country || c === country) {
        Object.entries(rTree || {}).forEach(([r, sTree]) => {
          if (!region || r === region) {
            list = [...list, ...Object.keys(sTree || {})];
          }
        });
      }
    });
    return Array.from(new Set(list));
  }, [country, region]);

  const cities = useMemo(() => {
    let list: string[] = [];
    Object.entries(locationTree).forEach(([c, rTree]) => {
      if (!country || c === country) {
        Object.entries(rTree || {}).forEach(([r, sTree]) => {
          if (!region || r === region) {
            Object.entries(sTree || {}).forEach(([s, cTree]) => {
              if (!stateName || s === stateName) {
                list = [...list, ...Object.keys(cTree || {})];
              }
            });
          }
        });
      }
    });
    return Array.from(new Set(list));
  }, [country, region, stateName]);

  const zones = useMemo(() => {
    let list: string[] = [];
    Object.entries(locationTree).forEach(([c, rTree]) => {
      if (!country || c === country) {
        Object.entries(rTree || {}).forEach(([r, sTree]) => {
          if (!region || r === region) {
            Object.entries(sTree || {}).forEach(([s, cTree]) => {
              if (!stateName || s === stateName) {
                Object.entries(cTree || {}).forEach(([cy, zList]) => {
                  if (!city || cy === city) {
                    list = [...list, ...(zList as string[] || [])];
                  }
                });
              }
            });
          }
        });
      }
    });
    return Array.from(new Set(list));
  }, [country, region, stateName, city]);

  const filteredRows = useMemo(() => {
    return orgs.filter((row) => {
      const q = search.toLowerCase();
      const orgName = row.name || "";
      const companyName = row.company_name || "";
      const entityName = row.entity_name || "";
      if (q && !`${orgName} ${companyName} ${entityName}`.toLowerCase().includes(q)) return false;
      if (country && row.country !== country) return false;
      if (region && row.region !== region) return false;
      if (stateName && row.state !== stateName) return false;
      if (city && row.city !== city) return false;
      if (zone && row.zone !== zone) return false;
      return true;
    });
  }, [orgs, search, country, region, stateName, city, zone]);

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setRegion("");
    setStateName("");
    setCity("");
    setZone("");
  };

  const renderRows = useMemo(() => {
    return filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((row) => {
      const totalSites = sites.filter((s) => s.organization === row.id).length;
      const formattedDate = row.created_at
        ? new Date(row.created_at).toLocaleString("en-GB", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "-";

      return (
        <tr key={row.id}>
          <td>{row.name}</td>
          <td>{row.company_name || "-"}</td>
          <td>{row.entity_name || "-"}</td>
          <td>{totalSites}</td>
          <td>{row.country || "-"}</td>
          <td>{row.region || "-"}</td>
          <td>{row.state || "-"}</td>
          <td>{row.city || "-"}</td>
          <td>{row.zone || "-"}</td>
          <td>
            <span className={`status ${row.is_active === false || row.status === "Inactive" ? "inactive" : "active"}`}>
              {row.is_active === false || row.status === "Inactive" ? "Inactive" : "Active"}
            </span>
          </td>
          <td>{formattedDate}</td>
          <td>Admin</td>
          <td>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="link-btn org-table-view-btn text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="View"
                onClick={() => navigate(`/masters/organizations/${row.id}`)}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="link-btn org-table-edit-btn text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center p-1 rounded-md hover:bg-slate-100 transition-colors"
                title="Edit"
                onClick={() => navigate(`/masters/organizations/${row.id}/edit`)}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="link-btn org-table-delete-btn text-red-500 hover:text-red-700 font-medium flex items-center justify-center p-1 rounded-md hover:bg-red-50 transition-colors"
                title="Delete"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this organization?")) {
                    deleteMutation.mutate(row.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    });
  }, [filteredRows, sites, navigate, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length]);

  return (
    <MainLayout>
      <section className="surface org-page">
        <header className="org-page-head">
          <h1 className="text-3xl font-bold">Organization List</h1>
          <button className="primary-btn" onClick={() => navigate("/masters/organizations/new")}>
            Add Organization
          </button>
        </header>

        <section className="panel">
          <h3 className="org-subhead">Filters</h3>
          <div className="org-filters">
            <input
              className="filter-input"
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="filter-input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Region</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="filter-input"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setRegion("");
                setStateName("");
                setCity("");
                setZone("");
              }}
            >
              <option value="">Country</option>
              {allCountries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="filter-input"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
            >
              <option value="">State</option>
              {states.map((item: any) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="filter-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="">City</option>
              {cities.map((item: any) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="filter-input"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              <option value="">Zone</option>
              {zones.map((item: any) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="ghost-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </section>

        <section className="panel org-table-wrap">
          {loading ? <p className="add-org-subtitle">Loading organizations…</p> : null}
          <table className="org-table">
            <thead>
              <tr>
                <th>Organization Name</th>
                <th>Company Name</th>
                <th>Entity Name</th>
                <th>Total Sites</th>
                <th>Country</th>
                <th>Region</th>
                <th>State</th>
                <th>City</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Created Date Time</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>{!loading && renderRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="text-center py-4 text-muted-foreground">No organizations found.</td>
              </tr>
            ) : renderRows}</tbody>
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
