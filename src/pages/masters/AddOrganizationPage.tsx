import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Organization } from "@/lib/api";
import { MainLayout } from "@/components/layout/MainLayout";
import { allCountries, locationTree } from "@/utils/constants";
import { ArrowLeft } from "lucide-react";

const placeholderOption = () => (
  <option value="" disabled hidden>
    -- Please choose an option --
  </option>
);

const solutionTypeOptions = ["Cloud", "On-premise", "Hybrid"];
const solutionForOptions = ["Vibe Connect", "Vibe Copilot", "HRMS"];
const billingTermOptions = ["Fixed", "Per site", "Per user"];
const billingCycleOptions = ["Monthly", "Quarterly", "Six monthly", "Annual"];
const projectDurationOptions = [
  { label: "1 month", value: 1, months: 1 },
  { label: "3 months", value: 3, months: 3 },
  { label: "6 months", value: 6, months: 6 },
  { label: "12 months", value: 12, months: 12 },
  { label: "24 months", value: 24, months: 24 },
];

const BILLING_CYCLE_AUTO_MONTHS: Record<string, number> = {
  Quarterly: 3,
  "Six monthly": 6,
};

function parseISODateLocal(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatISODate(d: Date) {
  if (!d || Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function billingPeriodEndDate(startIso: string, months: number) {
  const start = parseISODateLocal(startIso);
  if (!start) return "";
  const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
  end.setDate(end.getDate() - 1);
  return formatISODate(end);
}

export default function AddOrganizationPage() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const isEdit = Boolean(orgId);
  const queryClient = useQueryClient();

  const [organizationName, setOrganizationName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [solutionType, setSolutionType] = useState("");
  const [solutionFor, setSolutionFor] = useState("");
  const [billingTerm, setBillingTerm] = useState("");
  const [billingRate, setBillingRate] = useState("0.0");
  const [billingCycle, setBillingCycle] = useState("");
  const [billingStartDate, setBillingStartDate] = useState("");
  const [projectDuration, setProjectDuration] = useState<number | "">("");
  const [billingEndDate, setBillingEndDate] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [whiteLabel, setWhiteLabel] = useState(false);
  const [subDomain, setSubDomain] = useState("");

  const { data: orgData, isLoading: isLoadingOrg } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => (orgId ? api.getOrganization(orgId) : Promise.resolve(null)),
    enabled: isEdit,
  });

  const countryData = locationTree[country] || null;
  const regions = countryData ? Object.keys(countryData) : [];
  const states = region
    ? Object.keys(countryData?.[region] || {})
    : Object.values(countryData || {}).flatMap((regionNode: any) => Object.keys(regionNode || {}));
  const cities = region
    ? Object.keys(countryData?.[region]?.[stateName] || {})
    : Object.values(countryData || {}).flatMap((regionNode: any) =>
      stateName in (regionNode || {}) ? Object.keys(regionNode[stateName] || {}) : []
    );
  const zones = region
    ? countryData?.[region]?.[stateName]?.[city] || []
    : (Object.values(countryData || {}).find(
      (node: any) => stateName in (node || {}) && city in (node[stateName] || {})
    )?.[stateName]?.[city] || []);

  useEffect(() => {
    if (!billingStartDate) {
      setBillingDate("");
      return;
    }
    if (!billingDate) {
      setBillingDate(billingStartDate);
    }
  }, [billingStartDate, billingDate]);

  useEffect(() => {
    if (!projectDuration || !billingStartDate) return;
    setBillingEndDate(billingPeriodEndDate(billingStartDate, Number(projectDuration)));
  }, [projectDuration, billingStartDate]);

  useEffect(() => {
    if (projectDuration) return;
    const months = BILLING_CYCLE_AUTO_MONTHS[billingCycle];
    if (!billingStartDate) {
      if (months) setBillingEndDate("");
      return;
    }
    if (!months) return;
    setBillingEndDate(billingPeriodEndDate(billingStartDate, months));
  }, [billingCycle, billingStartDate, projectDuration]);

  useEffect(() => {
    if (orgData) {
      setOrganizationName(orgData.name || "");
      setCompanyName(orgData.company_name || "");
      setEntityName(orgData.entity_name || "");
      setContactEmail(orgData.contact_email || "");
      setContactPhone(orgData.contact_phone || "");
      setGstNumber(orgData.gst_number || orgData.pan_number || "");
      setSolutionType(orgData.organization_type || "");
      setSolutionFor(orgData.industry || "");
      setBillingTerm(orgData.billing_term || "");
      setBillingRate(orgData.billing_rate || "0.0");
      setBillingCycle(orgData.billing_cycle || "");
      setBillingStartDate(orgData.billing_start_date || "");
      setProjectDuration(orgData.project_duration || "");
      setBillingEndDate(orgData.billing_end_date || "");
      setBillingDate(orgData.billing_date || "");
      setCountry(orgData.country || "");
      setRegion(orgData.region || "");
      setStateName(orgData.state || "");
      setCity(orgData.city || "");
      setZone(orgData.zone || "");
      setWhiteLabel(orgData.white_label || false);
      setSubDomain(orgData.sub_domain || "");
    }
  }, [orgData]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Organization>) => {
      if (isEdit && orgId) {
        return api.updateOrganization(orgId, data);
      }
      // Generate a unique code if creating
      const code = data.name?.replace(/\s+/g, "-").toLowerCase() || `org-${Date.now()}`;
      return api.createOrganization({ ...data, code });
    },
    onSuccess: (savedOrg) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      if (isEdit) {
        navigate(-1);
      } else {
        navigate(`/masters/organizations/${savedOrg.id}`);
      }
    },
    onError: (err: any) => {
      window.alert(`Unable to save organization: ${err.message}`);
    },
  });

  const handleSave = () => {
    if (!organizationName.trim() || !companyName.trim()) {
      window.alert("Organization Name and Company Name are required.");
      return;
    }

    const payload: Partial<Organization> = {
      name: organizationName.trim(),
      company_name: companyName.trim(),
      entity_name: entityName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      gst_number: gstNumber.trim(),
      organization_type: solutionType,
      industry: solutionFor,
      billing_term: billingTerm,
      billing_rate: billingRate,
      billing_cycle: billingCycle,
      billing_start_date: billingStartDate || undefined,
      project_duration: projectDuration ? Number(projectDuration) : 0,
      billing_end_date: billingEndDate || undefined,
      billing_date: billingDate || undefined,
      country,
      region,
      state: stateName,
      city,
      zone,
      white_label: whiteLabel,
      sub_domain: subDomain.trim(),
      status: whiteLabel ? "Active" : "Inactive",
    };

    saveMutation.mutate(payload);
  };

  const filteredCountries = useMemo(() => allCountries, []);

  if (isEdit && isLoadingOrg) {
    return (
      <MainLayout>
        <section className="surface add-org-page">
          <p className="add-org-subtitle">Loading organization…</p>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="surface add-org-page">
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
          <h1 className="text-3xl font-bold">{isEdit ? "Edit Organization" : "Add New Organization"}</h1>
        </header>

        <section className="panel add-org-card">
          <h2 className="add-org-title">{isEdit ? "Update organization details" : "Organization Details"}</h2>
          <p className="add-org-subtitle">
            {isEdit
              ? "Save changes to update this organization in your database."
              : "Provide the essential information for the new organization."}
          </p>

          <h3 className="add-org-section-title">General Information</h3>
          <div className="add-org-grid two">
            <div className="field add-site-full-row">
              <label>
                Organization Name <span className="required-star">*</span>
              </label>
              <input
                className="filter-input"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          <h3 className="add-org-section-title">Company details</h3>
          <div className="add-org-grid two">
            <div className="field">
              <label>
                Company Name <span className="required-star">*</span>
              </label>
              <input
                className="filter-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="field">
              <label>Entity</label>
              <input
                className="filter-input"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Enter your entity"
              />
            </div>
          </div>

          <h3 className="add-org-section-title">Contact & Tax Details</h3>
          <div className="add-org-grid three">
            <div className="field">
              <label>Contact Email</label>
              <input
                className="filter-input"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="billing@example.com"
              />
            </div>
            <div className="field">
              <label>Contact Phone</label>
              <input
                className="filter-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="field">
              <label>GST Number / PAN</label>
              <input
                className="filter-input"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="Enter Tax ID"
              />
            </div>
          </div>

          <h3 className="add-org-section-title">Location Details</h3>
          <div className="add-org-grid three">
            <div className="field">
              <label>Country</label>
              <input
                className="filter-input"
                list="countryList"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Select or type country"
              />
              <datalist id="countryList">
                {filteredCountries.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label>Region</label>
              <input
                className="filter-input"
                list="regionList"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Select or type region"
              />
              <datalist id="regionList">
                {regions.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label>State</label>
              <input
                className="filter-input"
                list="stateList"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Select or type state"
              />
              <datalist id="stateList">
                {states.map((item: any) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label>City</label>
              <input
                className="filter-input"
                list="cityList"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Select or type city"
              />
              <datalist id="cityList">
                {cities.map((item: any) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label>Zone</label>
              <input
                className="filter-input"
                list="zoneList"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Select or type zone"
              />
              <datalist id="zoneList">
                {zones.map((item: any) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
          </div>

          <h3 className="add-org-section-title">Advanced Options</h3>
          <div className="add-org-grid two advanced-grid">
            <div className="field">
              <label>White Label</label>
              <div className="h-10 flex items-center">
                <label className="switch mb-0">
                  <input
                    type="checkbox"
                    checked={whiteLabel}
                    onChange={(e) => setWhiteLabel(e.target.checked)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
            <div className="field">
              <label>Sub-Domain</label>
              <input
                className="filter-input"
                value={subDomain}
                onChange={(e) => setSubDomain(e.target.value)}
                placeholder="www.hml.com"
              />
            </div>
          </div>

          <h3 className="add-org-section-title">Billing</h3>
          <div className="add-org-grid three">
            <div className="field">
              <label>Solution Type</label>
              <select
                className="filter-input"
                value={solutionType}
                onChange={(e) => setSolutionType(e.target.value)}
              >
                {placeholderOption()}
                {solutionTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Solution For</label>
              <select
                className="filter-input"
                value={solutionFor}
                onChange={(e) => setSolutionFor(e.target.value)}
              >
                {placeholderOption()}
                {solutionForOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Billing Term</label>
              <select
                className="filter-input"
                value={billingTerm}
                onChange={(e) => setBillingTerm(e.target.value)}
              >
                {placeholderOption()}
                {billingTermOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Rate of Billing</label>
              <input
                className="filter-input"
                type="number"
                min="0"
                step="any"
                value={billingRate}
                onChange={(e) => setBillingRate(e.target.value)}
                placeholder="Enter billing rate"
              />
            </div>
            <div className="field">
              <label>Billing Cycle</label>
              <select
                className="filter-input"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
              >
                {placeholderOption()}
                {billingCycleOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Start Date</label>
              <input
                className="filter-input"
                type="date"
                value={billingStartDate}
                onChange={(e) => setBillingStartDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Project Duration</label>
              <select
                className="filter-input"
                value={projectDuration}
                onChange={(e) => {
                  const val = e.target.value;
                  setProjectDuration(val === "" ? "" : Number(val));
                }}
              >
                {placeholderOption()}
                {projectDurationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>End Date</label>
              <input
                className="filter-input"
                type="date"
                value={billingEndDate}
                onChange={(e) => setBillingEndDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Billing Date</label>
              <input
                className="filter-input"
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </div>
          </div>

          <footer className="form-footer">
            <button
              className="ghost-btn"
              onClick={() =>
                navigate(isEdit && orgId ? `/masters/organizations/${orgId}` : "/masters/organizations")
              }
            >
              Cancel
            </button>
            <button
              className="primary-btn"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Save Organization"}
            </button>
          </footer>
        </section>
      </section>
    </MainLayout>
  );
}
