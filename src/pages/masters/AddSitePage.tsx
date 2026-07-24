import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import ModuleAccessPanel from "@/components/ModuleAccessPanel";
import { allCountries } from "@/utils/constants";
import { buildInitialModuleState, allModuleKeys } from "@/utils/moduleAccessSections";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PROJECT_OPTIONS = ["", "HRMS", "Vibecopilot", "Vibe Connect"];

const ROLE_OPTIONS = [
  { value: 'client_admin', label: 'Organization Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'facility_manager', label: 'Facility Manager' },
  { value: 'procurement_manager', label: 'Procurement Manager' },
  { value: 'procurement_executive', label: 'Procurement Executive' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'finance_executive', label: 'Finance Executive' },
  { value: 'site_engineer', label: 'Site Engineer' },
  { value: 'store_keeper', label: 'Store Keeper' },
  { value: 'project_head', label: 'Project Head' },
  { value: 'cxo', label: 'CXO / Management' },
];

function normalizeProductOption(value: any) {
  if (!value) return "";
  const v = String(value).trim().toLowerCase();
  if (v === "vibe copilot" || v === "vibecopilot") return "Vibecopilot";
  if (v === "vibe connect") return "Vibe Connect";
  if (v === "hrms") return "HRMS";
  return "";
}

interface ProvisionResult {
  email: string;
  temp_password: string;
  email_sent: boolean;
  console_mode: boolean;
  site_name: string;
  org_name: string;
  role_label: string;
  permissions_count: number;
}

export default function AddSitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const visibleRoleOptions = useMemo(() => {
    const isSuperAdmin = user?.role === 'super_admin';
    return ROLE_OPTIONS.filter(option => {
      if (option.value === 'client_admin') return isSuperAdmin;
      return true;
    });
  }, [user]);

  const [siteName, setSiteName] = useState("");
  const [siteCode, setSiteCode] = useState("");
  const [project, setProject] = useState(PROJECT_OPTIONS[0]);
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [activationDate, setActivationDate] = useState("");
  const [statusOn, setStatusOn] = useState(true);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [adminRole, setAdminRole] = useState("admin");
  const [moduleState, setModuleState] = useState<Record<string, boolean>>(buildInitialModuleState);

  // Post-save provisioning state
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const organizationId = searchParams.get("organizationId");
  const siteId = searchParams.get("siteId");
  const isEdit = Boolean(siteId);

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: api.getOrganizations,
  });

  const contextOrg = useMemo(() => {
    if (!organizationId) return null;
    return orgs.find((o) => o.id === Number(organizationId)) || null;
  }, [orgs, organizationId]);

  const { data: siteData, isLoading: isLoadingSite } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => (siteId ? api.getSite(siteId) : Promise.resolve(null)),
    enabled: isEdit,
  });

  const sitesListPath = useMemo(() => {
    return organizationId
      ? `/masters/sites?organizationId=${encodeURIComponent(organizationId)}`
      : "/masters/sites";
  }, [organizationId]);

  useEffect(() => {
    if (siteData) {
      setSiteName(siteData.name || "");
      setSiteCode(siteData.code || "");
      setProject(normalizeProductOption(siteData.site_type) || PROJECT_OPTIONS[0]);
      setAddress(siteData.address || "");
      setCountry(siteData.country || "");
      setStatusOn(siteData.is_active !== false);
      setContactName(siteData.site_manager_name || "");
      setContactPhone(siteData.site_head || "");
      setContactEmail(siteData.site_manager_email || "");
      if (siteData.module_configuration) {
        setModuleState(siteData.module_configuration);
      }
    }
  }, [siteData]);

  useEffect(() => {
    if (isEdit) return;
    const fromQuery = searchParams.get("siteName");
    if (fromQuery) setSiteName(fromQuery);
    if (contextOrg?.country && contextOrg.country !== "-") setCountry(contextOrg.country);
    if (contextOrg?.industry) {
      const product = normalizeProductOption(contextOrg.industry);
      if (product) setProject(product);
    }
    if (contextOrg) {
      const joinedAddress = [
        contextOrg.zone,
        contextOrg.city,
        contextOrg.state,
        contextOrg.region,
        contextOrg.country,
      ]
        .filter((part) => part && part !== "-")
        .join(", ");
      if (joinedAddress) setAddress(joinedAddress);
      if (contextOrg.contact_email && contextOrg.contact_email !== "-") {
        setContactEmail(contextOrg.contact_email);
      }
    }
  }, [searchParams, contextOrg, isEdit]);

  const onSelectAllModules = (on: boolean) => {
    setModuleState((prev) => {
      const next = { ...prev };
      allModuleKeys().forEach((k) => {
        next[k] = on;
      });
      return next;
    });
  };

  const onModuleChange = (key: string, value: boolean) => {
    setModuleState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteCode.trim()) {
      toast({ title: "Validation Error", description: "Site Name and Site Code are required.", variant: "destructive" });
      return;
    }
    if (!contactName.trim()) {
      toast({ title: "Validation Error", description: "Contact full name is required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    let shouldNavigate = true; // local flag — avoids stale closure issues with state

    const payload = {
      organization: organizationId ? Number(organizationId) : undefined,
      name: siteName.trim(),
      code: siteCode.trim(),
      site_type: project || "-",
      address: address.trim(),
      country: country.trim(),
      is_active: statusOn,
      site_manager_name: contactName.trim(),
      site_head: contactPhone.trim(),
      site_manager_email: contactEmail.trim().toLowerCase(),
      module_configuration: moduleState,
    };

    try {
      // 1. Create/update site
      let savedSite: any;
      if (isEdit && siteId) {
        savedSite = await api.updateSite(siteId, payload);
      } else {
        savedSite = await api.createSite(payload);
      }

      queryClient.invalidateQueries({ queryKey: ["sites"] });

      const siteIdForProvision = savedSite?.id;

      // 2. Provision admin if contact email is provided
      if (contactEmail.trim() && contactName.trim() && siteIdForProvision) {
        try {
          const result = await api.provisionSiteAdmin({
            site_id: siteIdForProvision,
            admin_name: contactName.trim(),
            admin_email: contactEmail.trim().toLowerCase(),
            admin_role: adminRole,
            module_configuration: moduleState,
          });

          // Always stay on page to show credential panel so admin can copy the password
          shouldNavigate = false;
          setProvisionResult({
            email: result.admin_email,
            temp_password: result.temp_password || '',
            email_sent: result.email_sent,
            console_mode: result.console_mode || false,
            site_name: result.site_name,
            org_name: result.org_name || '',
            role_label: result.role_label || adminRole,
            permissions_count: result.permissions_count,
          });

          if (result.email_sent) {
            toast({
              title: result.console_mode
                ? '✅ Admin provisioned (check Django terminal for email)'
                : '✅ Site saved & Admin provisioned',
              description: result.console_mode
                ? `Credentials printed to Django console. Account: ${result.admin_email}`
                : `Welcome email sent to ${result.admin_email}. They can access ${result.permissions_count} module(s).`,
            });
          } else {
            toast({
              title: '⚠️ Admin created — email delivery failed',
              description: `Copy the temporary password below and share it with ${result.admin_email}.`,
              variant: 'destructive',
            });
          }
        } catch (provisionErr: any) {
          console.error('Admin provisioning error:', provisionErr);
          toast({
            title: 'Site saved',
            description: `Site saved, but admin provisioning failed: ${provisionErr.message}`,
            variant: 'destructive',
          });
          // Navigate since site was saved but provisioning failed entirely
          shouldNavigate = true;
        }
      } else {
        toast({
          title: 'Site saved',
          description: isEdit ? 'Site updated successfully.' : 'New site created successfully.',
        });
      }

      if (shouldNavigate) {
        navigate(sitesListPath);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Unable to save site: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCountries = useMemo(() => allCountries, []);

  if (isEdit && isLoadingSite) {
    return (
      <MainLayout>
        <section className="surface add-site-page">
          <p className="add-org-subtitle">Loading site details…</p>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="surface add-site-page">
        <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </nav>
        <header className="add-org-header">
          <h1 className="text-3xl font-bold">
            {isEdit ? "Manage Site / Project" : "Add Site / Project"}
          </h1>
        </header>

        {/* ── Credential Panel ─ shown after every successful provisioning ── */}
        {provisionResult && (
          <div
            style={{
              background: provisionResult.email_sent ? 'linear-gradient(135deg,#f0fdf4,#eff6ff)' : '#fff7ed',
              border: `2px solid ${provisionResult.email_sent ? '#86efac' : '#f97316'}`,
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '26px' }}>
                {provisionResult.email_sent ? (provisionResult.console_mode ? '🖥️' : '✅') : '⚠️'}
              </span>
              <div>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: provisionResult.email_sent ? '#15803d' : '#b45309' }}>
                  {provisionResult.email_sent
                    ? (provisionResult.console_mode
                        ? 'Admin Provisioned — Credentials in Django Terminal'
                        : `Admin Provisioned — Welcome Email Sent to ${provisionResult.email}`)
                    : 'Admin Created — Email Failed, Share Credentials Manually'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: provisionResult.email_sent ? '#166534' : '#92400e' }}>
                  {provisionResult.email_sent
                    ? (provisionResult.console_mode
                        ? `The credentials below were printed to the Django server console. Copy and share with ${provisionResult.email}.`
                        : `Welcome email sent. The admin can now log in and access ${provisionResult.permissions_count} module(s).`)
                    : `The welcome email could not be delivered. Please copy the credentials below and share them with ${provisionResult.email}.`}
                </p>
              </div>
            </div>

            {/* Credential block */}
            <div style={{
              background: '#0f172a',
              borderRadius: '10px',
              padding: '20px 24px',
              fontFamily: 'monospace',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '8px',
            }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Organisation</div>
                <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>{provisionResult.org_name || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Site</div>
                <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>{provisionResult.site_name}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Assigned Role</div>
                <div style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 600 }}>{provisionResult.role_label || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Login Email</div>
                <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>{provisionResult.email}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Temporary Password</div>
                <div style={{ color: '#fbbf24', fontSize: '18px', fontWeight: 800, letterSpacing: '3px' }}>
                  {provisionResult.temp_password || '(check Django console)'}
                </div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px' }}>
              🔐 Login URL: <span style={{ color: '#60a5fa' }}>{window.location.origin}/login</span>
            </p>

            {/* Actions */}
            <div style={{ marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="primary-btn"
                onClick={() => {
                  const text = [
                    `Organisation: ${provisionResult.org_name || ''}`,
                    `Site: ${provisionResult.site_name}`,
                    `Role: ${provisionResult.role_label || ''}`,
                    `Login URL: ${window.location.origin}/login`,
                    `Email: ${provisionResult.email}`,
                    `Password: ${provisionResult.temp_password}`,
                  ].join('\n');
                  navigator.clipboard.writeText(text);
                  toast({ title: '📋 Copied!', description: 'Full credentials copied to clipboard.' });
                }}
              >
                📋 Copy Credentials
              </button>
              <button
                className="ghost-btn"
                onClick={() => {
                  setProvisionResult(null);
                  navigate(sitesListPath);
                }}
              >
                Go to Sites List →
              </button>
            </div>
          </div>
        )}


        <div className="add-site-stack">
          <section className="panel add-site-card">
            <h2 className="add-site-section-heading">Site Details</h2>
            <div className="add-org-grid two add-site-fields">
              <div className="field">
                <label>
                  Site Name <span className="required-star">*</span>
                </label>
                <input
                  className="filter-input"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g., Corporate HQ"
                />
              </div>
              <div className="field">
                <label>
                  Site Code <span className="required-star">*</span>
                </label>
                <input
                  className="filter-input"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value)}
                  placeholder="e.g., CHQ-001"
                />
              </div>
              <div className="field add-site-full-row">
                <label>Select Product</label>
                <select
                  className="filter-input add-site-select"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">Select a product</option>
                  {PROJECT_OPTIONS.filter(Boolean).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              {contextOrg?.country && contextOrg.country !== "-" ? (
                <div className="field">
                  <label>Country</label>
                  <input className="filter-input" value={country} disabled />
                </div>
              ) : (
                <div className="field">
                  <label>Country</label>
                  <input
                    className="filter-input"
                    list="addSiteCountryList"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Select or type country"
                  />
                  <datalist id="addSiteCountryList">
                    {filteredCountries.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              )}
              <div className="field add-site-full-row">
                <label>Location Address</label>
                <textarea
                  className="filter-input add-site-textarea"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter full address..."
                />
              </div>
              <div className="field">
                <label>Activate Date</label>
                <input
                  className="filter-input add-site-date"
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                />
              </div>
              <div className="field add-site-status-row">
                <label>Status</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={statusOn}
                    onChange={(e) => setStatusOn(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </section>

          <section className="panel add-site-card">
            <h2 className="add-site-section-heading">
              Site Administrator
              <span
                style={{
                  marginLeft: "10px",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#64748b",
                  background: "#f1f5f9",
                  borderRadius: "999px",
                  padding: "2px 10px",
                }}
              >
                A login account will be auto-created and credentials emailed
              </span>
            </h2>
            <div className="add-org-grid two add-site-fields">
              <div className="field add-site-full-row">
                <label>
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  className="filter-input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="field">
                <label>Phone Number</label>
                <input
                  className="filter-input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="field">
                <label>
                  Email Address{" "}
                  <span
                    style={{ color: "#0f4c81", fontWeight: 600, fontSize: "12px" }}
                  >
                    — login credentials will be sent here
                  </span>
                </label>
                <input
                  className="filter-input"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
            </div>


            {/* Info callout */}
            {contactEmail && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <span style={{ fontSize: "18px", marginTop: "1px" }}>📧</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 600,
                      color: "#1e40af",
                      fontSize: "13px",
                    }}
                  >
                    Auto-provisioning enabled
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#3b82f6",
                      fontSize: "12px",
                    }}
                  >
                    A user account will be created for <strong>{contactEmail}</strong> with the
                    modules selected below. Login credentials will be sent via email automatically.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="panel add-site-card site-module-access-card">
            <ModuleAccessPanel
              moduleState={moduleState}
              onModuleChange={onModuleChange}
              onSelectAllModules={onSelectAllModules}
            />
          </section>
        </div>

        <div className="form-footer">
          <button type="button" className="ghost-btn" onClick={() => navigate(sitesListPath)}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleSave}
            disabled={isSaving}
            style={{ minWidth: "160px" }}
          >
            {isSaving ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                Saving…
              </span>
            ) : (
              "Save Site & Provision Admin"
            )}
          </button>
        </div>
      </section>
    </MainLayout>
  );
}
