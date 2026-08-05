export type UserRole =
  | 'super_admin'
  | 'client_admin'
  | 'admin'
  | 'site_keeper'
  | 'site_manager'
  | 'site_engineer'
  | 'store_keeper'
  | 'procurement_executive'
  | 'procurement_manager'
  | 'finance_executive'
  | 'finance_manager'
  | 'facility_manager'
  | 'project_head'
  | 'vendor'
  | 'cxo'
  | 'cxo_citi'
  | 'cxo_emb'
  | 'system';

export interface UserProfile {
  organization_id?: number;
  organization_name?: string;
  site_id?: number;
  site_name?: string;
  department_id?: number;
  department_name?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: any;
  avatar?: string;
  department?: string;
  tower?: string;
  permissions?: Record<string, { view?: boolean; create?: boolean; update?: boolean; delete?: boolean; approve?: boolean }>;
  profile?: UserProfile;
  force_password_change?: boolean;
}

export const RoleLabels: Record<UserRole | 'employee', string> = {
  super_admin: 'Super Admin',
  client_admin: 'Organization Admin',
  admin: 'Admin',
  site_keeper: 'Site Keeper',
  site_manager: 'Site Manager',
  site_engineer: 'Site Engineer',
  facility_manager: 'Facility Manager',
  store_keeper: 'Store Keeper',
  procurement_executive: 'Procurement Executive',
  procurement_manager: 'Procurement Manager',
  finance_executive: 'Finance Executive',
  finance_manager: 'Finance Manager',
  vendor: 'Vendor',
  cxo: 'CXO / Management',
  cxo_citi: 'CXO - Citi',
  cxo_emb: 'CXO - EMB',
  system: 'System',
  employee: 'Employee',
  project_head: 'Project Head',
};

// Vendor Types
export interface Vendor {
  id: string;
  name: string;
  type: 'material' | 'service' | 'amc' | 'soft_services';
  category: string;
  gstNumber: string;
  pan: string;
  msmeStatus: boolean;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  slaRating: number;
  approvedTowers: string[];
  complianceExpiry: string;
  status: 'active' | 'inactive' | 'blacklisted';
  contactPerson: string;
  email: string;
  phone: string;
}

// Item/Service Master
export interface Item {
  id: string;
  name: string;
  type: 'spare' | 'consumable' | 'service';
  category: string;
  uom: string;
  minStockLevel: number;
  reorderLevel: number;
  currentStock: number;
  preferredVendor?: string;
  unitPrice: number;
}

// Indent/VRF Types
export interface Indent {
  id: string;
  type: 'material' | 'service' | 'amc';
  tower: string;
  floor: string;
  category: string;
  items: IndentItem[];
  estimatedCost: number;
  requiredDate: string;
  budgetHead: 'opex' | 'capex';
  justification: string;
  attachments: string[];
  status: 'draft' | 'submitted' | 'hod_approved' | 'procurement_approved' | 'rejected';
  createdBy: string;
  createdAt: string;
  approvals: Approval[];
}

export interface IndentItem {
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
  estimatedRate: number;
  currentStock?: number;
}

// Approval Types
export interface Approval {
  id: string;
  stage: string;
  approver: string;
  approverRole: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp?: string;
}

// PO/WO Types
export interface PurchaseOrder {
  id: string;
  type: 'po' | 'wo' | 'amc';
  vendor: string;
  vendorName: string;
  linkedRfq?: string;
  items: POItem[];
  totalValue: number;
  taxes: number;
  netValue: number;
  retentionPercent: number;
  milestones?: Milestone[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  tower: string;
  category: string;
  createdAt: string;
}

export interface POItem {
  id: string;
  itemName: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  deliveredQty: number;
  balanceQty: number;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  percentage: number;
  status: 'pending' | 'completed';
}

// Inventory Types
export interface GRN {
  id: string;
  poId: string;
  vendor: string;
  receivedDate: string;
  items: GRNItem[];
  status: 'pending_qc' | 'qc_passed' | 'qc_failed' | 'accepted' | 'received';
  receivedBy: string;
}

export interface GRNItem {
  itemId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  uom: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  poId: string;
  grnId?: string;
  sesId?: string;
  amount: number;
  gst: number;
  totalAmount: number;
  dueDate: string;
  status: 'pending' | 'verified' | 'approved' | 'paid' | 'rejected';
  matchingStatus: '2way' | '3way' | 'failed';
  attachments: string[];
}

// Dashboard Types
export interface MetricData {
  label: string;
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  format?: 'currency' | 'number' | 'percentage';
}

export interface DrilldownData {
  id: string;
  label: string;
  value: number;
  children?: DrilldownData[];
}

export interface SpendData {
  tower: string;
  category: string;
  vendor: string;
  amount: number;
  month: string;
}
