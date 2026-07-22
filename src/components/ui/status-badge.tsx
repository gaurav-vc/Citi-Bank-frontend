import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-warning/10 text-warning',
  submitted: 'bg-info/10 text-info',
  approved: 'bg-success/10 text-success',
  hod_approved: 'bg-success/10 text-success',
  procurement_approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  active: 'bg-success/10 text-success',
  inactive: 'bg-muted text-muted-foreground',
  blacklisted: 'bg-destructive/10 text-destructive',
  verified: 'bg-info/10 text-info',
  paid: 'bg-success/10 text-success',
  pending_qc: 'bg-warning/10 text-warning',
  qc_passed: 'bg-success/10 text-success',
  qc_failed: 'bg-destructive/10 text-destructive',
  accepted: 'bg-success/10 text-success',
  inventory_verification_pending: 'bg-blue-500/10 text-blue-500',
  inventory_verified: 'bg-emerald-500/10 text-emerald-500',
  procurement_required: 'bg-yellow-500/10 text-yellow-500',
  stock_available: 'bg-purple-500/10 text-purple-500',
  pending_procurement_manager: 'bg-blue-500/10 text-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.1)]',
  pending_facility_manager: 'bg-amber-500/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]',
  pending_store_keeper: 'bg-indigo-500/10 text-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.1)]',
  published: 'bg-info/10 text-info',
  bidding_open: 'bg-info/10 text-info',
  bidding_closed: 'bg-warning/10 text-warning',
  pending_project_head: 'bg-purple-500/10 text-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.1)]',
  pending_cxo_citi: 'bg-sky-500/10 text-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.1)]',
  pending_cxo_emb: 'bg-teal-500/10 text-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.1)]',
  fully_approved: 'bg-success/10 text-success shadow-[0_0_12px_rgba(34,197,94,0.1)]',
  converted_to_rfq: 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  converted_to_rfq: 'Converted to RFQ',
  pending: 'Pending',
  submitted: 'Submitted',
  approved: 'Approved',
  hod_approved: 'HOD Approved',
  procurement_approved: 'Procurement Approved',
  rejected: 'Rejected',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted',
  verified: 'Verified',
  paid: 'Paid',
  pending_qc: 'Pending QC',
  qc_passed: 'QC Passed',
  qc_failed: 'QC Failed',
  accepted: 'Accepted',
  inventory_verification_pending: 'Inventory Verification Pending',
  inventory_verified: 'Inventory Verified',
  procurement_required: 'Procurement Required',
  stock_available: 'Stock Available',
  pending_procurement_manager: 'Pending Procurement Manager Approval',
  pending_facility_manager: 'Pending Facility Manager Approval',
  pending_store_keeper: 'Pending Store Keeper Approval',
  published: 'Published',
  bidding_open: 'Bidding Open',
  bidding_closed: 'Bidding Closed',
  pending_project_head: 'Pending Project Head Approval',
  pending_cxo_citi: 'Pending CXO Citi Approval',
  pending_cxo_emb: 'Pending CXO EMB Approval',
  fully_approved: 'Fully Approved',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusStyles[status] || 'bg-muted text-muted-foreground',
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
