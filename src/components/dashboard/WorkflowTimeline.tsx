import { cn } from '@/lib/utils';
import { Check, Clock, X } from 'lucide-react';
import { Approval } from '@/types';

interface WorkflowTimelineProps {
  approvals: Approval[];
  className?: string;
}

export function WorkflowTimeline({ approvals, className }: WorkflowTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {approvals.map((approval, index) => {
        const isLast = index === approvals.length - 1;
        
        return (
          <div key={approval.id} className="flex gap-4">
            {/* Timeline Line & Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  approval.status === 'approved' && 'bg-success text-success-foreground',
                  approval.status === 'rejected' && 'bg-destructive text-destructive-foreground',
                  approval.status === 'pending' && 'bg-warning text-warning-foreground'
                )}
              >
                {approval.status === 'approved' && <Check className="h-4 w-4" />}
                {approval.status === 'rejected' && <X className="h-4 w-4" />}
                {approval.status === 'pending' && <Clock className="h-4 w-4" />}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem]',
                    approval.status === 'approved' ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{approval.stage}</p>
                  <p className="text-sm text-muted-foreground">{approval.approver}</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      approval.status === 'approved' && 'bg-success/10 text-success',
                      approval.status === 'rejected' && 'bg-destructive/10 text-destructive',
                      approval.status === 'pending' && 'bg-warning/10 text-warning'
                    )}
                  >
                    {approval.status === 'approved' && 'Approved'}
                    {approval.status === 'rejected' && 'Rejected'}
                    {approval.status === 'pending' && 'Pending'}
                  </span>
                  {approval.timestamp && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(approval.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              {approval.comments && (
                <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  "{approval.comments}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
