import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Upload,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  Check,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Invoice } from '@/types';
import { toast } from '@/hooks/use-toast';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowContainer } from '@/components/workflow/WorkflowContainer';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export default function BillingInvoices() {
  const { token, user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        const mapped = data.map((i: any) => ({
          id: i.id,
          vendorId: i.vendor_id,
          vendorName: i.vendor_name,
          invoiceNumber: i.invoice_number,
          invoiceDate: i.invoice_date,
          poId: i.po_id,
          grnId: i.grn_id,
          sesId: i.ses_id,
          amount: parseFloat(i.amount) || 0,
          gst: parseFloat(i.gst) || 0,
          totalAmount: parseFloat(i.total_amount) || 0,
          dueDate: i.due_date,
          status: i.status,
          matchingStatus: i.matching_status,
          remarks: i.remarks || '',
          attachments: i.attachments || [],
        }));
        setInvoices(mapped);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Invoice list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/export/?format=xlsx`,
        `invoices_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Invoice list exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    toast({
      title: 'Uploading...',
      description: 'Uploading and parsing invoice sheet.',
    });

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Invoice Uploaded',
          description: data.message || 'Successfully uploaded and parsed invoice',
          variant: 'default',
        });
        fetchInvoices();
      } else {
        toast({
          title: 'Import Failed',
          description: data.error || 'Failed to parse invoice',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to connect to server',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleQuickAction = async (invoice: any, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const tlRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/workflow/timeline/?module=invoices&entity_id=${invoice.id}`, { headers });
      if (!tlRes.ok) throw new Error('Failed to fetch workflow timeline');
      const tlData = await tlRes.json();
      
      const activeStep = (tlData.steps || []).find((s: any) => 
        (s.status === 'pending' || s.status === 'escalated') && 
        (s.assigned_role_name === user?.role || user?.role === 'super_admin')
      );
      
      if (!activeStep) {
        throw new Error('No pending workflow step found for your role.');
      }
      
      const actionRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/workflow/action_step/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ step_id: activeStep.id, action })
      });
      
      if (!actionRes.ok) {
         const err = await actionRes.json().catch(() => ({}));
         throw new Error(err.error || err.detail || `Failed to ${action} invoice`);
      }
      
      toast({ title: 'Success', description: `Invoice successfully ${action}d.` });
      fetchInvoices();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };


  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = invoices.find(inv => String(inv.id) === String(id));
    if (found) {
      setSelectedInvoice(found);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/billing/all');
    }
  }, [id, isLoading, invoices, navigate]);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const invoiceStats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === 'pending').length,
    verified: invoices.filter((i) => i.status === 'verified').length,
    approved: invoices.filter((i) => i.status === 'approved').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
    pendingAmount: invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMatchingBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case '3way':
        return <Badge className="bg-success/10 text-success border-success font-medium">3-Way Match</Badge>;
      case '2way':
        return <Badge className="bg-info/10 text-info border-info font-medium">2-Way Match</Badge>;
      case 'verified':
        return <Badge className="bg-success/15 text-emerald-600 border-emerald-500 font-medium">Verified</Badge>;
      case 'mismatch':
      case 'failed':
        return <Badge variant="destructive" className="font-medium">Mismatch</Badge>;
      default:
        return <Badge variant="secondary" className="font-medium">{status || 'Pending'}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Invoices</h1>
            <p className="text-muted-foreground">
              Manage vendor invoices, verify matching, and process payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="invoice-import-input"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {user && user.role !== 'finance_manager' && (
              <Button onClick={() => document.getElementById('invoice-import-input')?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'all' ? 'border-primary ring-1 ring-primary' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                  <p className="text-2xl font-bold">{invoiceStats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'pending' ? 'border-warning ring-1 ring-warning' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-warning">{invoiceStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'verified' ? 'border-info ring-1 ring-info' : ''}`}
            onClick={() => setStatusFilter('verified')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-info">{invoiceStats.verified}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-info/20" />
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${statusFilter === 'approved' ? 'border-success ring-1 ring-success' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">{invoiceStats.approved}</p>
                </div>
                <Check className="h-8 w-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoiceStats.pendingAmount)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Table */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="all">All Invoices</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                <Badge variant="secondary" className="ml-2">{invoiceStats.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendor</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">PO Ref</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Matching</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">GST</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Due Date</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((invoice) => {
                        const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid';

                        return (
                          <tr key={invoice.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{invoice.vendorName}</p>
                                <p className="text-xs text-muted-foreground">{invoice.vendorId}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <p className="text-sm">{invoice.poId}</p>
                                {invoice.grnId && (
                                  <p className="text-xs text-muted-foreground">GRN: {invoice.grnId}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {getMatchingBadge(invoice.matchingStatus)}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {formatCurrency(invoice.amount)}
                            </td>
                            <td className="py-4 px-4 text-right text-muted-foreground">
                              {formatCurrency(invoice.gst)}
                            </td>
                            <td className="py-4 px-4 text-right font-medium">
                              {formatCurrency(invoice.totalAmount)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={isOverdue ? 'text-destructive' : ''}>
                                  {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                                </span>
                                {isOverdue && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge status={invoice.status} />
                            </td>
                            <td className="py-4 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {invoice.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={async () => {
                                        try {
                                          const token = localStorage.getItem('campusspend_token');
                                          const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/${invoice.id}/`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                            },
                                            body: JSON.stringify({ status: 'verified' })
                                          });
                                          if (res.ok) {
                                            toast({ title: 'Invoice Verified', description: 'Invoice has been verified successfully.' });
                                            fetchInvoices();
                                          }
                                        } catch (err) {
                                          toast({ title: 'Error', description: 'Failed to verify invoice', variant: 'destructive' });
                                        }
                                      }}>
                                        <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                                        Verify Invoice
                                      </DropdownMenuItem>
                                      {user && (user.role === 'finance_manager' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
                                        <DropdownMenuItem onClick={async () => {
                                          try {
                                            const token = localStorage.getItem('campusspend_token');
                                            const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/${invoice.id}/`, {
                                              method: 'PATCH',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                              },
                                              body: JSON.stringify({ status: 'rejected' })
                                            });
                                            if (res.ok) {
                                              toast({ title: 'Invoice Rejected', description: 'Invoice has been rejected.', variant: 'destructive' });
                                              fetchInvoices();
                                            }
                                          } catch (err) {
                                            toast({ title: 'Error', description: 'Failed to reject invoice', variant: 'destructive' });
                                          }
                                        }}>
                                          <XCircle className="h-4 w-4 mr-2 text-destructive" />
                                          Reject
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('campusspend_token');
                                      const { downloadFile } = await import('@/utils/downloadFile');
                                      await downloadFile(
                                        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/${invoice.id}/download/`,
                                        `Invoice_${invoice.id}.pdf`,
                                        token || ''
                                      );
                                      toast({ title: 'Download Complete', description: `Invoice ${invoice.id} downloaded successfully.` });
                                    } catch (err: any) {
                                      toast({ title: 'Download Failed', description: err.message, variant: 'destructive' });
                                    }
                                  }}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredInvoices.length > PAGE_SIZE && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredInvoices.length / PAGE_SIZE)}
                      onPageChange={setCurrentPage}
                      onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredInvoices.length / PAGE_SIZE), p + 1))}
                      onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invoice Detail Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => {
          if (!open) {
            setSelectedInvoice(null);
            if (id) {
              navigate('/billing/all');
            }
          }
        }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Review invoice details and matching status
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} onUpdate={fetchInvoices} />}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function InvoiceDetails({ invoice, onUpdate }: { invoice: any; onUpdate: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [matchingStatus, setMatchingStatus] = useState(invoice.matchingStatus);
  const [reasons, setReasons] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const runMatchingVerification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/${invoice.id}/run_match/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMatchingStatus(data.matching_status);
        setReasons(data.reasons);
        setChecks(data.checks);
        toast({ title: 'Matching engine complete', description: `Status: ${data.matching_status.toUpperCase()}` });
        onUpdate();
      } else {
        throw new Error('Verification failed');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const overrideMatchingDiscrepancies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/${invoice.id}/override_match/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ comments: 'Mismatch overridden by Finance Manager Exception approval.' })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchingStatus(data.matching_status);
        toast({ title: 'Exception approved', description: 'Mismatch overridden successfully.' });
        onUpdate();
      } else {
        throw new Error('Override failed');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const isFinanceManager = user?.role === 'finance_manager' || user?.role === 'super_admin';

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{invoice.invoiceNumber}</h3>
          <p className="text-sm text-muted-foreground">{invoice.vendorName}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">Invoice Information</h4>
          <div className="space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Number</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber || invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Date</span>
              <span>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Reference</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{invoice.poId}</span>
            </div>
            {invoice.grnId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GRN Reference</span>
                <span className="font-semibold">{invoice.grnId}</span>
              </div>
            )}
            {invoice.remarks && (
              <div className="flex flex-col gap-0.5 mt-2 border-t pt-2">
                <span className="text-muted-foreground text-xs">Remarks</span>
                <span className="text-slate-800 dark:text-slate-200">{invoice.remarks}</span>
              </div>
            )}
            {invoice.attachments && invoice.attachments.length > 0 && (
              <div className="flex flex-col gap-1 mt-2 border-t pt-2">
                <span className="text-muted-foreground text-xs">Attachments</span>
                <div className="grid grid-cols-1 gap-1">
                  {invoice.attachments.map((file: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-1 bg-white dark:bg-slate-800 border rounded text-xs">
                      <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                      <span className="text-muted-foreground">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wide">Financial Breakdown</h4>
          <div className="space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Amount</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>{formatCurrency(invoice.gst)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-slate-850 dark:text-slate-100">
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Panel */}
      <div className="p-4 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-750 dark:text-slate-200 uppercase tracking-wider">Matching Verification Engine</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={runMatchingVerification} disabled={loading}>
              Run Match Check
            </Button>
            {matchingStatus === 'mismatch' && isFinanceManager && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md shadow-amber-600/20" onClick={overrideMatchingDiscrepancies} disabled={loading}>
                Override Exception
              </Button>
            )}
          </div>
        </div>

        {/* Verification Checks cards */}
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries({
            'Duplicate Check': checks.duplicate_check || 'PENDING',
            'Vendor Match': checks.vendor_match || 'PENDING',
            'Price Match': checks.price_validation || 'PENDING',
            'Qty Match': checks.quantity_validation || 'PENDING',
            'GRN Check': checks.grn_existence || 'PENDING',
          }).map(([lbl, stat]) => (
            <div key={lbl} className="flex-1 min-w-[130px] p-3.5 border border-slate-200/60 rounded-xl bg-white dark:bg-slate-900/50 text-center flex flex-col items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md">
              <p className="text-[11px] md:text-xs text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap">{lbl}</p>
              <span className={`inline-block text-[11px] md:text-xs font-bold px-3 py-1 rounded-full w-full max-w-[100px] ${
                stat === 'PASSED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                stat === 'FAILED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {stat}
              </span>
            </div>
          ))}
        </div>

        {/* Reasons banner if mismatch */}
        {reasons.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-100 dark:bg-rose-950/10 dark:border-rose-900/20 rounded-lg text-xs text-rose-600 dark:text-rose-400 space-y-1">
            <p className="font-bold">Matching Discrepancies Flagged:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Reusable Workflow Container */}
      <div className="pt-6 border-t">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Invoice Approvals</h4>
        <WorkflowContainer module="invoices" entityId={invoice.id} onWorkflowUpdate={onUpdate} />
      </div>
    </div>
  );
}
