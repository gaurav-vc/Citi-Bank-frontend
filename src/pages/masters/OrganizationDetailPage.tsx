import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Organization } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";

function formatAddress(org: Organization) {
  const parts = [org.zone, org.city, org.state, org.region, org.country].filter((p) => p && p !== "-");
  return parts.length ? parts.join(", ") : "No registered address on file.";
}

function activeRegionTags(org: Organization) {
  const tags = new Set<string>();
  if (org.region && org.region !== "-") tags.add(org.region);
  return Array.from(tags);
}

function defaultActivity(org: Organization) {
  return [
    { action: "Updated subdomain configuration", who: "Admin", when: "3 hours ago" },
    { action: "Modified billing cycle", who: "Admin", when: "2 hours ago" },
    { action: "Provisioning check completed", who: "Admin", when: "Yesterday" },
    { action: "User directory sync", who: "Admin", when: "2 days ago" },
  ];
}

function normalizeSubdomainInput(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [subdomainDraft, setSubdomainDraft] = useState("");
  const [customSubdomainOn, setCustomSubdomainOn] = useState(false);
  const [contactEmailDraft, setContactEmailDraft] = useState("");
  const [contactPhoneDraft, setContactPhoneDraft] = useState("");
  const [subdomainMessage, setSubdomainMessage] = useState("");
  const [contactHint, setContactHint] = useState("");

  const { data: org, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => (orgId ? api.getOrganization(orgId) : Promise.reject("No orgId")),
    enabled: !!orgId,
  });

  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ["sites"],
    queryFn: api.getSites,
  });

  useEffect(() => {
    if (!org) return;
    const hasSub = !!org.sub_domain && org.sub_domain !== "-";
    setCustomSubdomainOn(hasSub);
    setSubdomainDraft(hasSub ? org.sub_domain! : "");
    setContactEmailDraft(org.contact_email || "");
    setContactPhoneDraft(org.contact_phone || "");
    setSubdomainMessage("");
    setContactHint("");
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Organization>) => {
      if (!orgId) throw new Error("No orgId");
      return api.updateOrganization(orgId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (err: any) => {
      window.alert(`Failed to update organization: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!orgId) throw new Error("No orgId");
      return api.deleteOrganization(orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      navigate("/masters/organizations");
    },
    onError: (err: any) => {
      window.alert(`Failed to delete organization: ${err.message}`);
    },
  });

  const orgSites = useMemo(() => {
    if (!orgId) return [];
    return sites.filter((s) => s.organization === Number(orgId));
  }, [sites, orgId]);

  const regions = useMemo(() => (org ? activeRegionTags(org) : []), [org]);

  if (isLoadingOrg || isLoadingSites) {
    return (
      <MainLayout>
        <section className="surface org-page">
          <p className="add-org-subtitle">Loading organization detail…</p>
        </section>
      </MainLayout>
    );
  }

  if (!org) {
    return (
      <MainLayout>
        <section className="surface org-page">
          <div className="panel org-detail-empty">
            <h1>Organization not found</h1>
            <p>No organization matches this link. It may have been removed or the URL is incorrect.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate("/masters/organizations")}
            >
              Back to organizations
            </button>
          </div>
        </section>
      </MainLayout>
    );
  }

  const statusKey = org.status === "Inactive" || org.is_active === false ? "inactive" : "active";
  const displaySubdomain = customSubdomainOn ? subdomainDraft : "";
  const billingSummary =
    org.billing_cycle && org.billing_cycle !== "-"
      ? `${org.billing_term && org.billing_term !== "-" ? `${org.billing_term} · ` : ""}${org.billing_cycle}`
      : "Not configured";

  const handleDelete = () => {
    if (!window.confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate();
  };

  const onStatusToggle = (checked: boolean) => {
    const next = checked ? "Active" : "Inactive";
    updateMutation.mutate({ status: next, is_active: checked });
  };

  const onCustomSubdomainToggle = (checked: boolean) => {
    setCustomSubdomainOn(checked);
    if (!checked) {
      updateMutation.mutate({ sub_domain: "-" });
      setSubdomainDraft("");
      setSubdomainMessage("Custom subdomain turned off and saved.");
    } else {
      setSubdomainMessage("Enter a subdomain and click Save subdomain.");
    }
  };

  const saveSubdomain = () => {
    if (!customSubdomainOn) return;
    const normalized = normalizeSubdomainInput(subdomainDraft);
    if (!normalized) {
      setSubdomainMessage("Use letters, numbers, or hyphens only.");
      return;
    }
    updateMutation.mutate({ sub_domain: normalized });
    setSubdomainDraft(normalized);
    setSubdomainMessage("Subdomain saved successfully.");
  };

  const saveContact = () => {
    updateMutation.mutate({
      contact_email: contactEmailDraft.trim() || "-",
      contact_phone: contactPhoneDraft.trim() || "-",
    });
    setContactHint("Contact details saved successfully.");
  };

  const sitesQuery = `organizationId=${encodeURIComponent(org.id)}`;

  return (
    <MainLayout>
      <section className="surface org-detail-page">
        <nav className="org-detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/masters/organizations">Organizations</Link>
          <span className="org-detail-breadcrumb-sep" aria-hidden="true">
            /
          </span>
          <span className="org-detail-breadcrumb-current">{org.company_name || org.name}</span>
        </nav>

        <header className="org-detail-hero">
          <div className="org-detail-hero-main">
            <div className="org-detail-title-row">
              <div className="org-detail-icon" aria-hidden="true">
                <span>◎</span>
              </div>
              <div className="org-detail-title-block">
                <h1 className="org-detail-title">{org.company_name || org.name}</h1>
                <span className={`status ${statusKey} org-detail-status-pill`}>
                  {org.is_active === false || org.status === "Inactive" ? "Inactive" : "Active"}
                </span>
              </div>
            </div>
            <p className="org-detail-lede">
              {org.legal_name || `${org.name} operates under ${org.entity_name || "-"} with footprint in ${org.country || "-"}.`}
            </p>
          </div>
          <div className="org-detail-hero-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate(`/masters/organizations/${org.id}/edit`)}
            >
              Edit organization
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate(`/masters/sites?${sitesQuery}`)}
            >
              Manage Site
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate(`/masters/sites/new?${sitesQuery}`)}
            >
              + Add Site
            </button>
            <button
              type="button"
              className="danger-btn org-detail-delete"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </header>

        <div className="org-detail-layout">
          <div className="org-detail-main">
            <section className="panel org-detail-card">
              <h2 className="org-detail-card-title">Organization identity</h2>
              <div className="org-detail-kv-grid">
                <div className="org-detail-kv">
                  <span className="org-detail-k">Organization name</span>
                  <span className="org-detail-v">{org.name}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Company name</span>
                  <span className="org-detail-v">{org.company_name || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Entity name</span>
                  <span className="org-detail-v">{org.entity_name || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Total sites</span>
                  <span className="org-detail-v">
                    {orgSites.length} {orgSites.length === 1 ? "site" : "sites"}
                  </span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">White label</span>
                  <span className="org-detail-v">{org.white_label ? "Yes" : "No"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Country</span>
                  <span className="org-detail-v">{org.country || "-"}</span>
                </div>
              </div>

              <h3 className="org-detail-subhead">Geographic reach</h3>
              <div className="org-detail-tags">
                {regions.length === 0 ? (
                  <span className="org-detail-muted">No regions recorded.</span>
                ) : (
                  regions.map((r) => (
                    <span key={r} className="org-detail-region-tag">
                      {r}
                    </span>
                  ))
                )}
              </div>
              <div className="org-detail-kv-grid org-detail-kv-grid--2">
                <div className="org-detail-kv">
                  <span className="org-detail-k">Primary zone</span>
                  <span className="org-detail-v">{org.zone || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">State / province</span>
                  <span className="org-detail-v">{org.state || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">City</span>
                  <span className="org-detail-v">{org.city || "-"}</span>
                </div>
              </div>

              <h3 className="org-detail-subhead">Registered address</h3>
              <p className="org-detail-address">
                <span className="org-detail-pin" aria-hidden="true">
                  📍
                </span>
                {formatAddress(org)}
              </p>
            </section>

            <section className="panel org-detail-card">
              <div className="org-detail-card-head">
                <h2 className="org-detail-card-title">Billing &amp; solution</h2>
              </div>
              <div className="org-detail-kv-grid">
                <div className="org-detail-kv">
                  <span className="org-detail-k">Solution type</span>
                  <span className="org-detail-v">{org.organization_type || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Solution for</span>
                  <span className="org-detail-v">{org.industry || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Billing term</span>
                  <span className="org-detail-v">{org.billing_term || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Rate of billing</span>
                  <span className="org-detail-v">{org.billing_rate || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Billing cycle</span>
                  <span className="org-detail-v">{org.billing_cycle || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Start date</span>
                  <span className="org-detail-v">{org.billing_start_date || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Project duration</span>
                  <span className="org-detail-v">
                    {org.project_duration ? `${org.project_duration} months` : "-"}
                  </span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">End date</span>
                  <span className="org-detail-v">{org.billing_end_date || "-"}</span>
                </div>
                <div className="org-detail-kv">
                  <span className="org-detail-k">Billing date</span>
                  <span className="org-detail-v">{org.billing_date || "-"}</span>
                </div>
              </div>
            </section>

            <section className="panel org-detail-card org-detail-sites-card">
              <div className="org-detail-card-head">
                <h2 className="org-detail-card-title">Operational sites</h2>
                <button
                  type="button"
                  className="ghost-btn org-detail-card-action"
                  onClick={() => navigate(`/masters/sites?${sitesQuery}`)}
                >
                  Manage Site
                </button>
                <button
                  type="button"
                  className="ghost-btn org-detail-card-action"
                  onClick={() => navigate(`/masters/sites/new?${sitesQuery}`)}
                >
                  + Add Site
                </button>
              </div>
              <div className="org-table-wrap">
                <table className="org-table org-detail-sites-table">
                  <thead>
                    <tr>
                      <th>Site name</th>
                      <th>Product types</th>
                      <th>Users</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgSites.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="org-detail-muted">
                          No operational sites recorded yet. Add sites from Sites setup when you are ready.
                        </td>
                      </tr>
                    ) : (
                      orgSites.map((row) => {
                        const st = row.status === "Inactive" ? "inactive" : "active";
                        return (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>
                              <span className="product-chip org-detail-chip">
                                {row.site_type || "-"}
                              </span>
                            </td>
                            <td>{row.active_projects || "0"}</td>
                            <td>
                              <span className={`status ${st}`}>{row.status || "Active"}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="link-btn org-table-view-btn"
                                onClick={() =>
                                  navigate(
                                    `/masters/sites/new?${sitesQuery}&siteId=${encodeURIComponent(
                                      row.id
                                    )}`
                                  )
                                }
                              >
                                Manage Site
                              </button>
                              <span className="org-detail-action-sep" aria-hidden="true">
                                {" "}
                                ·{" "}
                              </span>
                              <button
                                type="button"
                                className="link-btn org-table-view-btn"
                                onClick={() => navigate(`/masters/sites?${sitesQuery}`)}
                              >
                                Open
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="org-detail-side">
            <section className="panel org-detail-card">
              <h2 className="org-detail-card-title">System configuration</h2>
              <div className="org-detail-switch-row">
                <span>Organization status</span>
                <label className="switch org-detail-switch">
                  <input
                    type="checkbox"
                    checked={org.is_active !== false && org.status !== "Inactive"}
                    onChange={(e) => onStatusToggle(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <p className="org-detail-switch-hint">
                {org.is_active !== false && org.status !== "Inactive" ? "Active" : "Inactive"}
              </p>

              <div className="org-detail-switch-row">
                <span>Custom subdomain</span>
                <label className="switch org-detail-switch">
                  <input
                    type="checkbox"
                    checked={customSubdomainOn}
                    onChange={(e) => onCustomSubdomainToggle(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
              <div className="org-detail-subdomain-field">
                <input
                  className="filter-input org-detail-subdomain-input"
                  value={displaySubdomain}
                  onChange={(e) => setSubdomainDraft(e.target.value)}
                  placeholder="subdomain"
                  aria-label="Subdomain"
                  disabled={!customSubdomainOn}
                />
                <span className="org-detail-subdomain-suffix">.orgos.app</span>
              </div>
              <div className="org-detail-subdomain-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!customSubdomainOn}
                  onClick={saveSubdomain}
                >
                  Save subdomain
                </button>
              </div>
              <p
                className={`org-detail-success-hint${
                  subdomainMessage.startsWith("Use ") ? " org-detail-hint-warn" : ""
                }`}
              >
                {subdomainMessage || "Changes are stored in backend database."}
              </p>
            </section>

            <section className="panel org-detail-card">
              <h2 className="org-detail-card-title">Primary contact</h2>
              <div className="field org-detail-field-tight">
                <label className="org-detail-inline-label" htmlFor="org-contact-email">
                  Email
                </label>
                <input
                  id="org-contact-email"
                  className="filter-input org-detail-contact-input"
                  type="email"
                  value={contactEmailDraft}
                  onChange={(e) => setContactEmailDraft(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              <div className="field org-detail-field-tight">
                <label className="org-detail-inline-label" htmlFor="org-contact-phone">
                  Phone
                </label>
                <input
                  id="org-contact-phone"
                  className="filter-input org-detail-contact-input"
                  type="tel"
                  value={contactPhoneDraft}
                  onChange={(e) => setContactPhoneDraft(e.target.value)}
                  placeholder="+1 …"
                />
              </div>
              <button
                type="button"
                className="primary-btn org-detail-save-contact"
                onClick={saveContact}
              >
                Save contact
              </button>
              {contactHint ? (
                <p className="org-detail-success-hint org-detail-contact-hint">{contactHint}</p>
              ) : null}
            </section>

            <section className="panel org-detail-card">
              <h2 className="org-detail-card-title">Audit &amp; metadata</h2>
              <div className="org-detail-kv">
                <span className="org-detail-k">Created by</span>
                <span className="org-detail-v">Admin</span>
              </div>
              <div className="org-detail-kv">
                <span className="org-detail-k">Created on</span>
                <span className="org-detail-v">
                  {org.created_at ? new Date(org.created_at).toLocaleString("en-GB") : "-"}
                </span>
              </div>
              <div className="org-detail-kv">
                <span className="org-detail-k">Billing summary</span>
                <span className="org-detail-v">{billingSummary}</span>
              </div>
            </section>

            <section className="panel org-detail-card">
              <h2 className="org-detail-card-title">Recent activity</h2>
              <ul className="org-detail-activity">
                {defaultActivity(org).map((item, idx) => (
                  <li key={`${item.action}-${idx}`}>
                    <p className="org-detail-activity-title">{item.action}</p>
                    <p className="org-detail-activity-meta">
                      {item.when} · {item.who}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <div className="org-detail-notice" role="note">
              <strong>Admin notice.</strong> Renaming an organization can affect integrations that
              use the display name. Review the API documentation before making changes in
              production.
            </div>
          </aside>
        </div>
      </section>
    </MainLayout>
  );
}
