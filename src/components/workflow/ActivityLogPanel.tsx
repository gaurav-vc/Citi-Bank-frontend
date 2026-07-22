import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, User, MessageSquare } from 'lucide-react';
import { RoleLabels, UserRole } from '@/types';

interface ActivityLogEntry {
  user: string;
  role?: string;
  action: string;
  comments?: string;
  timestamp: string;
}

interface ActivityLogPanelProps {
  history: ActivityLogEntry[];
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <Card className="border-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-xl">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No workflow activity recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <CardTitle className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Workflow Audit Trail
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
          {history.map((log, index) => {
            const isApproved = log.action.toLowerCase() === 'approved';
            const isRejected = log.action.toLowerCase() === 'rejected';
            const isSubmitted = log.action.toLowerCase() === 'submitted';

            let actionColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800';
            if (isApproved) actionColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
            if (isRejected) actionColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/20';
            if (isSubmitted) actionColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/20';

            const userRoleLabel = log.role ? (RoleLabels[log.role as UserRole] || log.role) : '';

            return (
              <div key={index} className="relative group transition-all duration-300">
                {/* Visual circle indicator on audit timeline */}
                <div className="absolute -left-[30px] top-1 p-1 rounded-full bg-slate-200 dark:bg-slate-800 z-10">
                  <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {log.user}
                    </span>
                    {userRoleLabel && (
                      <span className="text-xs text-muted-foreground">
                        ({userRoleLabel})
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${actionColor}`}
                    >
                      {log.action}
                    </span>
                  </div>

                  <span className="text-[11px] text-muted-foreground block">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>

                  {log.comments && (
                    <div className="mt-1.5 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                      <span>{log.comments}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
