import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => Promise<void>;
  actionType: 'approve' | 'reject' | 'hold';
  loading?: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  loading = false,
}) => {
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    if ((actionType === 'reject' || actionType === 'hold') && !comments.trim()) {
      setError(`Comments/reason is required when performing a ${actionType}.`);
      return;
    }

    try {
      await onConfirm(comments);
      setComments('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action failed to process');
    }
  };

  const isReject = actionType === 'reject';
  const isHold = actionType === 'hold';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isReject || isHold ? (
              <div className="p-2 bg-rose-100 dark:bg-rose-950/30 rounded-lg">
                <XCircle className="w-6 h-6 text-rose-500" />
              </div>
            ) : (
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {isReject ? 'Reject Document' : isHold ? 'Hold Document' : 'Approve Document'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isReject
                  ? 'Provide a valid reason for rejecting this document.'
                  : isHold
                  ? 'Provide a justification for putting this document on hold.'
                  : 'Add optional comments to accompany this approval.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="comments" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Comments {(isReject || isHold) && <span className="text-rose-500">*</span>}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                isReject
                  ? 'Explain why this document is being rejected...'
                  : isHold
                  ? 'Explain why this document is being put on hold...'
                  : 'Add remarks (optional)...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px] border-slate-200 focus-visible:ring-blue-500 dark:border-slate-800"
              rows={4}
            />
          </div>

          {error && (
            <div className="flex gap-2 items-start p-3 rounded-lg bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={isReject || isHold ? 'destructive' : 'default'}
            className={
              !isReject && !isHold
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-600/20'
                : 'shadow-lg shadow-rose-600/20'
            }
          >
            {loading ? 'Processing...' : isReject ? 'Reject' : isHold ? 'Put on Hold' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
