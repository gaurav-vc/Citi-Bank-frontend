import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, User } from 'lucide-react';

interface WorkflowHistoryItem {
  action: string;
  user: string;
  user_name: string;
  role: string;
  timestamp: string;
  comments: string;
  decision?: string;
}

interface BillingDetail {
  id: number;
  invoice_number: string;
  vendor_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  workflow_history: WorkflowHistoryItem[];
  current_approver: string | null;
  approval_level: number;
}

export default function SuperAdminBillingLogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<BillingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/api/reports/super-admin-billing-logs/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing log detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, action: string = '') => {
    const s = status.toLowerCase();
    const a = action.toLowerCase();
    
    if (a === 'rejected' || s.includes('reject')) return <XCircle className="h-5 w-5 text-red-500" />;
    if (a === 'approved' || s.includes('approved') || s.includes('paid')) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <Clock className="h-5 w-5 text-amber-500" />;
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground flex items-center justify-center min-h-screen">Loading log details...</div>;
  }

  if (!detail) {
    return <div className="p-6 text-destructive flex items-center justify-center min-h-screen">Failed to load log details.</div>;
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/super-admin/billing')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Log: {detail.invoice_number}</h1>
          <p className="text-muted-foreground">Audit trail and billing details for this transaction.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium text-base">{detail.vendor_name}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Base Amount</p>
                <p className="font-medium">Rs. {detail.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Tax Amount</p>
                <p className="font-medium">Rs. {detail.tax_amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-bold text-lg text-blue-600">Rs. {detail.total_amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Current Status</p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium bg-slate-100 border">
                  {getStatusIcon(detail.status)}
                  {detail.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-0 bg-white h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Workflow Audit Trail
              </CardTitle>
              <CardDescription>Chronological log of approvals and actions.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.workflow_history && detail.workflow_history.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {detail.workflow_history.map((history, index) => (
                    <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                         {getStatusIcon('unknown', history.action)}
                      </div>
                      
                      {/* Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900">{history.decision || history.action}</div>
                          <time className="text-xs font-medium text-amber-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </time>
                        </div>
                        <div className="text-slate-500 text-sm mb-2">{history.comments}</div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-slate-500 font-medium">
                          <User className="h-3.5 w-3.5" />
                          <span>{history.user_name || history.user}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] ml-auto uppercase tracking-wider">
                            {history.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No audit trail records found for this invoice.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}

