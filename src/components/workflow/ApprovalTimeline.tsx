import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, ChevronRight, MessageSquare, ShieldAlert } from 'lucide-react';
import { WorkflowStep, WorkflowTimeline } from '@/hooks/useWorkflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleLabels, UserRole } from '@/types';

interface ApprovalTimelineProps {
  timeline: WorkflowTimeline;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ timeline }) => {
  const { steps, document: docInfo } = timeline;

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'escalated':
        return <ShieldAlert className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin-slow" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusStyles = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'approved':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
      case 'rejected':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400';
      case 'escalated':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
      case 'pending':
        return 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  return (
    <Card className="border-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Approval Flow Timeline
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Current Level: <span className="font-semibold text-foreground">{docInfo.approval_level}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
          {steps.map((step, index) => {
            const isCurrent = step.status === 'pending' || step.status === 'escalated';
            const roleLabel = RoleLabels[step.assigned_role_name as UserRole] || step.assigned_role_name;

            return (
              <div
                key={step.id}
                className={`relative group transition-all duration-300 ${
                  isCurrent ? 'scale-[1.01]' : ''
                }`}
              >
                {/* Timeline circle indicator */}
                <div className="absolute -left-[30px] top-1 p-0.5 rounded-full bg-white dark:bg-slate-900 z-10 transition-transform group-hover:scale-110">
                  {getStatusIcon(step.status)}
                </div>

                {/* Timeline Content Card */}
                <div
                  className={`p-4 rounded-xl border transition-all duration-300 ${getStatusStyles(
                    step.status
                  )} ${
                    isCurrent
                      ? 'ring-2 ring-blue-500/20 shadow-lg'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Step {step.step_sequence}
                      </span>
                      <h4 className="text-sm md:text-base font-bold mt-0.5 text-slate-800 dark:text-slate-100">
                        {roleLabel}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border uppercase tracking-wider ${
                          step.status === 'approved'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900'
                            : step.status === 'rejected'
                            ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900'
                            : step.status === 'escalated'
                            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900'
                            : step.status === 'pending'
                            ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900'
                            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  {/* Comment box */}
                  {step.comments && (
                    <div className="mt-3 p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex gap-2 items-start text-xs text-slate-600 dark:text-slate-300">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-200">
                          Comments:
                        </span>
                        {step.comments}
                      </div>
                    </div>
                  )}

                  {/* Escalation note */}
                  {step.status === 'escalated' && step.escalated_to_role && (
                    <div className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Escalated to: {RoleLabels[step.escalated_to_role as UserRole] || step.escalated_to_role}
                    </div>
                  )}

                  {/* Metadata (Actioner, SLA, Due At) */}
                  <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {step.actioned_at && (
                      <div>
                        Actioned At:{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(step.actioned_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {step.due_at && !step.actioned_at && (
                      <div>
                        Due By:{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(step.due_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div>
                      SLA:{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {step.sla_hours} hrs
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
