import React, { useEffect } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalTimeline } from './ApprovalTimeline';
import { WorkflowActions } from './WorkflowActions';
import { ActivityLogPanel } from './ActivityLogPanel';
import { Loader2 } from 'lucide-react';

interface WorkflowContainerProps {
  module: string;
  entityId: string;
  onWorkflowUpdate?: () => void;
}

export const WorkflowContainer: React.FC<WorkflowContainerProps> = ({
  module,
  entityId,
  onWorkflowUpdate,
}) => {
  const { user } = useAuth();
  const {
    timeline,
    loading,
    error,
    fetchTimeline,
    submitDocumentWorkflow,
    actionWorkflowStep,
    triggerEscalation,
  } = useWorkflow();

  const loadData = async () => {
    await fetchTimeline(module, entityId);
  };

  useEffect(() => {
    loadData();
  }, [module, entityId]);

  const handleSubmit = async () => {
    await submitDocumentWorkflow(module, entityId);
    await loadData();
    if (onWorkflowUpdate) onWorkflowUpdate();
  };

  const handleAction = async (stepId: number, action: 'approve' | 'reject' | 'hold', comments: string) => {
    await actionWorkflowStep(stepId, action, comments);
    await loadData();
    if (onWorkflowUpdate) onWorkflowUpdate();
  };

  const handleEscalate = async () => {
    await triggerEscalation();
    await loadData();
    if (onWorkflowUpdate) onWorkflowUpdate();
  };

  if (loading && !timeline) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading workflow details...</span>
      </div>
    );
  }

  // Handle case where document exists but hasn't been submitted to workflow yet
  if (!timeline) {
    return (
      <div className="p-6 text-center border border-dashed rounded-xl bg-white/40 dark:bg-slate-900/40 dark:border-slate-800">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
          No Workflow Started
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          This document has not been submitted for workflow approval yet.
        </p>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? 'Submitting...' : 'Initialize Approval Workflow'}
        </button>
      </div>
    );
  }

  const { document: docInfo, steps } = timeline;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400">
          Error: {error}
        </div>
      )}

      <WorkflowActions
        module={module}
        entityId={entityId}
        documentStatus={docInfo.status}
        currentApprover={docInfo.current_approver}
        nextRole={docInfo.next_role}
        createdBy={docInfo.approved_by} // Or document creator if tracked
        currentUserRole={user?.role || ''}
        steps={steps}
        onSubmit={handleSubmit}
        onAction={handleAction}
        onEscalate={handleEscalate}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <ApprovalTimeline timeline={timeline} />
        <ActivityLogPanel history={docInfo.workflow_history} />
      </div>
    </div>
  );
};
