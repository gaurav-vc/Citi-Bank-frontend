import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function FinanceApprovalQueue() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [appRes, wfRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/approvals/my-pending/`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/workflow/pending/`, { headers })
      ]);

      let combined: any[] = [];
      
      if (appRes.ok) {
        const data = await appRes.json();
        combined = combined.concat(Array.isArray(data) ? data : data.results || []);
      }

      if (wfRes.ok) {
        const wfData = await wfRes.json();
        const mappedWorkflows = (Array.isArray(wfData) ? wfData : []).map((w: any) => ({
          id: w.id, // this is the WorkflowStep ID
          entity_type: w.entity_details?.module ? w.entity_details.module.replace(/s$/, '') : 'document',
          entity_id: w.entity_details?.id || 'Unknown',
          requested_by_name: w.entity_details?.created_by || 'Unknown',
          created_at: w.entity_details?.created_at || new Date().toISOString(),
          is_workflow: true
        }));
        combined = combined.concat(mappedWorkflows);
      }
      
      // sort by created_at descending
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setApprovals(combined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (approvalId: string, action: 'approve' | 'reject', is_workflow?: boolean) => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      let res;
      if (is_workflow) {
        const payload = {
          step_id: approvalId,
          action: action,
          comments: remarks[approvalId] || ''
        };
        res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/workflow/action_step/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        const payload = { remarks: remarks[approvalId] || '' };
        res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/approvals/${approvalId}/${action}/`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        toast({ title: 'Success', description: `Request successfully ${action}d.` });
        fetchApprovals();
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.detail || (Array.isArray(errorData) ? errorData[0] : null) || `Failed to ${action}`;
        throw new Error(errMsg);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Finance Approval Queue</h1>
            <p className="text-muted-foreground">Manage your pending invoice and financial approvals.</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pending approvals in your queue
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {app.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{app.entity_id}</TableCell>
                      <TableCell>{app.requested_by_name || app.requested_by}</TableCell>
                      <TableCell>{new Date(app.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Add remarks..." 
                          value={remarks[app.id] || ''}
                          onChange={(e) => setRemarks({...remarks, [app.id]: e.target.value})}
                          className="w-48"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" onClick={() => handleAction(app.id, 'approve', app.is_workflow)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction(app.id, 'reject', app.is_workflow)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
