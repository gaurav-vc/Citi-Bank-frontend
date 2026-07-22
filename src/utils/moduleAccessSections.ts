export interface ModuleItem {
  key: string;
  label: string;
  defaultChecked: boolean;
}

export interface ModuleSection {
  id: string;
  title: string;
  defaultOpen: boolean;
  items: ModuleItem[];
}

export const MODULE_ACCESS_SECTIONS: ModuleSection[] = [
  {
    id: "procurement",
    title: "Procurement",
    defaultOpen: true,
    items: [
      { key: "indents", label: "Indents", defaultChecked: true },
      { key: "rfqs", label: "RFQs", defaultChecked: true },
      { key: "rfqs_comparison", label: "Quotation Comparison", defaultChecked: true },
      { key: "orders", label: "Purchase Orders", defaultChecked: true },
      { key: "vendors", label: "Vendors", defaultChecked: true },
      { key: "approvals", label: "Approvals", defaultChecked: true },
    ],
  },
  {
    id: "procurement",
    title: "Inventory",
    defaultOpen: true,
    items: [
      { key: "items", label: "Item Master", defaultChecked: true },
      { key: "inventory", label: "Stock Ledger", defaultChecked: true },
      { key: "grn", label: "GRN Entry", defaultChecked: true },
      { key: "inventory_issue", label: "Issue To Site (GDN)", defaultChecked: true },
      { key: "inventory_transfer", label: "Stock Transfer", defaultChecked: true },
      { key: "inventory_disposal", label: "Scrap Disposal", defaultChecked: true },
      { key: "inventory_rtv", label: "Return To Vendor", defaultChecked: true },
    ],
  },
  {
    id: "procurement",
    title: "QC & Execution",
    defaultOpen: true,
    items: [
      { key: "qc_checklists", label: "Quality Inspection", defaultChecked: true },
    ],
  },
  {
    id: "procurement",
    title: "Finance & Billing",
    defaultOpen: true,
    items: [
      { key: "billing", label: "Invoices", defaultChecked: true },
      { key: "billing_approvals", label: "Finance Approvals", defaultChecked: true },
      { key: "payment_proposals", label: "Payment Proposals", defaultChecked: true },
      { key: "payments", label: "Payments", defaultChecked: true },
      { key: "utr_management", label: "UTR Management", defaultChecked: true },
      { key: "budgets", label: "Budgets", defaultChecked: true },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    defaultOpen: true,
    items: [
      { key: "dashboard", label: "Dashboard", defaultChecked: true },
      { key: "reports", label: "Spend Analytics", defaultChecked: true },
      { key: "inventory_reports", label: "Inventory Reports", defaultChecked: true },
      { key: "invoice_reports", label: "Invoice Reports", defaultChecked: true },
      { key: "audit_reports", label: "Audit Reports", defaultChecked: true },
      { key: "ai", label: "AI Recommendations", defaultChecked: true },
    ],
  },
  {
    id: "setup_admin",
    title: "Setup & Administration",
    defaultOpen: true,
    items: [
      { key: "workflows", label: "Approval Workflows", defaultChecked: true },
    ],
  },
];

export const MODULE_KEY_TO_FEATURE: Record<string, string> = {};
MODULE_ACCESS_SECTIONS.forEach(sec => {
  sec.items.forEach(item => {
    MODULE_KEY_TO_FEATURE[`${sec.id}:${item.key}`] = item.key;
  });
});

export const FEATURE_TO_MODULE_KEY: Record<string, string> = Object.entries(MODULE_KEY_TO_FEATURE).reduce((acc, [moduleKey, feature]) => {
  acc[feature] = moduleKey;
  return acc;
}, {} as Record<string, string>);

export function buildInitialModuleState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  MODULE_ACCESS_SECTIONS.forEach((sec) => {
    sec.items.forEach((item) => {
      state[`${sec.id}:${item.key}`] = item.defaultChecked;
    });
  });
  return state;
}

export function allModuleKeys(): string[] {
  const keys: string[] = [];
  MODULE_ACCESS_SECTIONS.forEach((sec) => {
    sec.items.forEach((item) => keys.push(`${sec.id}:${item.key}`));
  });
  return keys;
}
