import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ApprovalModal } from './ApprovalModal';
import { WorkflowStep } from '@/hooks/useWorkflow';
import { CheckCircle2, XCircle, Send, ShieldAlert, ArrowRight } from 'lucide-react';
import { RoleLabels, UserRole } from '@/types';

interface WorkflowActionsProps {
  module: string;
  entityId: string;
  documentStatus: string;
  currentApprover: string | null;
  nextRole: string | null;
  createdBy: string | null;
  currentUserRole: string;
  steps: WorkflowStep[];
  onSubmit: () => Promise<void>;
  onAction: (stepId: number, action: 'approve' | 'reject' | 'hold', comments: string) => Promise<void>;
  onEscalate?: () => Promise<void>;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  module,
  documentStatus,
  currentApprover,
  nextRole,
  currentUserRole,
  steps,
  onSubmit,
  onAction,
  onEscalate,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'hold'>('approve');
  const [loading, setLoading] = useState(false);

  const activeStep = steps.find(
    (s) => (s.status === 'pending' || s.status === 'escalated') && 
           (s.assigned_role_name === currentUserRole || currentUserRole === 'super_admin')
  );

  const canApprove = !!activeStep;
  const hasPendingSteps = steps.some(s => s.status === 'pending' || s.status === 'escalated');
  const isDraftOrRejected = documentStatus === 'draft' || documentStatus === 'rejected' || documentStatus === 'submitted';

  const handleActionClick = (type: 'approve' | 'reject' | 'hold') => {
    setActionType(type);
    setModalOpen(true);
  };

  const handleConfirmAction = async (comments: string) => {
    const targetStep = activeStep || steps.find(s => s.status === 'pending' || s.status === 'escalated');
    if (!targetStep) {
      alert("No pending workflow step found.");
      return;
    }
    setLoading(true);
    try {
      await onAction(targetStep.id, actionType, comments);
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  const currentApproverLabel = currentApprover ? (RoleLabels[currentApprover as UserRole] || currentApprover) : 'None';
  const nextRoleLabel = nextRole && nextRole !== 'None' ? (RoleLabels[nextRole as UserRole] || nextRole) : 'None';

  // Customize PO workflow actions labels
  let approveLabel = 'Approve';
  let rejectLabel = 'Reject';
  const showHoldButton = module === 'orders' && (currentUserRole === 'finance_executive' || currentUserRole === 'super_admin');

  if (module === 'orders') {
    if (currentUserRole === 'procurement_manager') {
      approveLabel = 'Approve Commercials';
      rejectLabel = 'Reject PO';
    } else if (currentUserRole === 'finance_executive') {
      approveLabel = 'Validate Budget';
      rejectLabel = 'Reject PO';
    } else if (currentUserRole === 'finance_manager') {
      approveLabel = 'Approve Release';
      rejectLabel = 'Reject PO';
    } else if (currentUserRole === 'vendor') {
      approveLabel = 'Accept PO';
      rejectLabel = 'Reject PO';
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'vendor_accepted':
      case 'closed':
        return 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900';
      case 'rejected':
        return 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900';
      case 'budget_hold':
        return 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900 animate-pulse';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900 animate-pulse';
    }
  };

  return (
    <div className="p-4 rounded-xl border border-slate-200/50 bg-white/60 dark:border-slate-800/50 dark:bg-slate-900/40 backdrop-blur-md shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold whitespace-nowrap">
              Workflow Status
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getStatusColor(documentStatus)}`}
            >
              {documentStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {hasPendingSteps ? (
              <>
                Awaiting approval from <span className="text-blue-600 dark:text-blue-400 font-bold">{currentApproverLabel}</span>
                {nextRole && nextRole !== 'None' && (
                  <span className="text-xs text-muted-foreground ml-1.5 flex items-center inline-flex gap-1">
                    <ArrowRight className="w-3 h-3" /> next: {nextRoleLabel}
                  </span>
                )}
              </>
            ) : documentStatus === 'vendor_accepted' ? (
              'Accepted by Vendor. Pending GRN creation.'
            ) : documentStatus === 'released' ? (
              'Released to Vendor. Awaiting Vendor acceptance.'
            ) : documentStatus === 'approved' || documentStatus === 'closed' ? (
              'Workflow successfully completed.'
            ) : (
              'Draft - Not submitted to workflow yet.'
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
        {isDraftOrRejected && (
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full md:w-auto px-5 h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 flex gap-2 items-center"
          >
            <Send className="w-4 h-4" />
            Submit for Approval
          </Button>
        )}

        {canApprove && (
          <>
            <Button
              variant="destructive"
              onClick={() => handleActionClick('reject')}
              disabled={loading}
              className="w-full md:w-auto px-5 h-11 text-base font-bold shadow-lg shadow-rose-600/20 flex gap-2 items-center justify-center transition-all hover:scale-105 shrink-0"
            >
              <XCircle className="w-5 h-5" />
              {rejectLabel}
            </Button>
            
            {showHoldButton && (
              <Button
                variant="outline"
                onClick={() => handleActionClick('hold')}
                disabled={loading}
                className="w-full md:w-auto px-5 h-11 text-base font-bold border-amber-200 text-amber-600 hover:bg-amber-50 flex gap-2 items-center justify-center transition-all hover:scale-105 shrink-0"
              >
                <ShieldAlert className="w-5 h-5" />
                Put On Hold
              </Button>
            )}

            <Button
              onClick={() => handleActionClick('approve')}
              disabled={loading}
              className="w-full md:w-auto px-5 h-11 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 flex gap-2 items-center justify-center transition-all hover:scale-105 shrink-0"
            >
              <CheckCircle2 className="w-5 h-5" />
              {approveLabel}
            </Button>
          </>
        )}

        {onEscalate && documentStatus.includes('pending') && currentUserRole === 'super_admin' && (
          <Button
            variant="outline"
            onClick={onEscalate}
            disabled={loading}
            className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950/20 flex gap-2 items-center"
          >
            <ShieldAlert className="w-4 h-4" />
            Force Escalate
          </Button>
        )}
      </div>

      <ApprovalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAction}
        actionType={actionType}
        loading={loading}
      />
    </div>
  );
};
