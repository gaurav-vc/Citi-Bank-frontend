import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Filter, Plus, CreditCard, Clock, CheckCircle, XCircle, 
  FileText, DollarSign, Calendar, Building2, Users, ArrowRight, 
  AlertTriangle, Send, Download, Eye
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowContainer } from '@/components/workflow/WorkflowContainer';

interface PaymentProposal {
  id: string;
  vendorName: string;
  vendorId: string;
  invoices: string[];
  totalAmount: number;
  gstAmount: number;
  retentionAmount: number;
  netPayable: number;
  dueDate: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'processing' | 'paid' | 'rejected';
  createdBy: string;
  createdDate: string;
  currentApprover?: string;
  nextRole?: string;
  approvalLevel: number;
  maxApprovalLevel: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface ApprovalMatrix {
  level: number;
  role: string;
  minAmount: number;
  maxAmount: number;
  approver: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
}

const mockProposals: PaymentProposal[] = [
  {
    id: 'PAY-001',
    vendorName: 'ABC Facilities Pvt Ltd',
    vendorId: 'VND-001',
    invoices: ['INV-001', 'INV-002'],
    totalAmount: 250000,
    gstAmount: 45000,
    retentionAmount: 12500,
    netPayable: 282500,
    dueDate: '2024-01-25',
    status: 'pending_approval',
    createdBy: 'Priya Sharma',
    createdDate: '2024-01-15',
    currentApprover: 'Finance Manager',
    approvalLevel: 2,
    maxApprovalLevel: 3,
  },
  {
    id: 'PAY-002',
    vendorName: 'XYZ Security Services',
    vendorId: 'VND-002',
    invoices: ['INV-003'],
    totalAmount: 150000,
    gstAmount: 27000,
    retentionAmount: 7500,
    netPayable: 169500,
    dueDate: '2024-01-28',
    status: 'approved',
    createdBy: 'Amit Patel',
    createdDate: '2024-01-16',
    approvalLevel: 3,
    maxApprovalLevel: 3,
  },
  {
    id: 'PAY-003',
    vendorName: 'Green Landscaping Co',
    vendorId: 'VND-003',
    invoices: ['INV-004', 'INV-005', 'INV-006'],
    totalAmount: 75000,
    gstAmount: 13500,
    retentionAmount: 3750,
    netPayable: 84750,
    dueDate: '2024-01-30',
    status: 'processing',
    createdBy: 'Rajesh Kumar',
    createdDate: '2024-01-17',
    approvalLevel: 3,
    maxApprovalLevel: 3,
  },
  {
    id: 'PAY-004',
    vendorName: 'MEP Solutions Ltd',
    vendorId: 'VND-004',
    invoices: ['INV-007'],
    totalAmount: 500000,
    gstAmount: 90000,
    retentionAmount: 25000,
    netPayable: 565000,
    dueDate: '2024-02-05',
    status: 'draft',
    createdBy: 'Meera Nair',
    createdDate: '2024-01-18',
    approvalLevel: 0,
    maxApprovalLevel: 4,
  },
  {
    id: 'PAY-005',
    vendorName: 'CleanPro Services',
    vendorId: 'VND-005',
    invoices: ['INV-008'],
    totalAmount: 45000,
    gstAmount: 8100,
    retentionAmount: 2250,
    netPayable: 50850,
    dueDate: '2024-01-22',
    status: 'paid',
    createdBy: 'Suresh Reddy',
    createdDate: '2024-01-10',
    approvalLevel: 2,
    maxApprovalLevel: 2,
  },
];

const approvalMatrix: ApprovalMatrix[] = [
  { level: 1, role: 'Finance Executive', minAmount: 0, maxAmount: 50000, approver: 'Priya Sharma', status: 'approved' },
  { level: 2, role: 'Finance Manager', minAmount: 50001, maxAmount: 200000, approver: 'Vikram Singh', status: 'pending' },
  { level: 3, role: 'Project Head', minAmount: 200001, maxAmount: 500000, approver: 'Rahul Mehta', status: 'pending' },
  { level: 4, role: 'CXO', minAmount: 500001, maxAmount: Infinity, approver: 'Anil Kumar', status: 'pending' },
];

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText, color: 'text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', variant: 'default' as const, icon: Clock, color: 'text-warning' },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle, color: 'text-success' },
  processing: { label: 'Processing', variant: 'default' as const, icon: CreditCard, color: 'text-primary' },
  paid: { label: 'Paid', variant: 'default' as const, icon: DollarSign, color: 'text-success' },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle, color: 'text-destructive' },
};

export default function PaymentProcessing() {
  const { token, user } = useAuth();
  const [proposals, setProposals] = useState<PaymentProposal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<PaymentProposal | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        const mapped = data.map((p: any) => ({
          id: p.id,
          vendorName: p.vendor_name,
          vendorId: p.vendor_id,
          invoices: p.invoices ?? [],
          totalAmount: parseFloat(p.total_amount) || 0,
          gstAmount: parseFloat(p.gst_amount) || 0,
          retentionAmount: parseFloat(p.retention_amount) || 0,
          netPayable: parseFloat(p.net_payable) || 0,
          dueDate: p.due_date,
          status: p.status,
          createdBy: p.created_by,
          approvalLevel: p.approval_level ?? 1,
          maxApprovalLevel: p.max_approval_level ?? 3,
          currentApprover: p.current_approver,
          nextRole: p.next_role,
          approvedBy: p.approved_by,
          approvedAt: p.approved_at,
          rejectedBy: p.rejected_by,
          rejectedAt: p.rejected_at,
          rejectionReason: p.rejection_reason,
        }));
        setProposals(mapped);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = proposals.find((p) => String(p.id) === String(id));
    if (found) {
      setSelectedProposal(found);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/payments/proposals');
    }
  }, [id, isLoading, proposals, navigate]);

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Payment proposals are being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/export/?format=xlsx`,
        `payments_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Payment proposals exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalPending: proposals.filter(p => p.status === 'pending_approval').reduce((sum, p) => sum + p.netPayable, 0),
    totalProcessing: proposals.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.netPayable, 0),
    totalPaid: proposals.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netPayable, 0),
    overdue: proposals.filter(p => new Date(p.dueDate) < new Date() && p.status !== 'paid').length,
  };

  const toggleSelectProposal = (id: string) => {
    setSelectedProposals(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Processing</h1>
            <p className="text-muted-foreground">Manage payment proposals, approvals, and disbursements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create Payment Proposal</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage create payment proposal details and actions here.</DialogDescription>
                </DialogHeader>
                <CreatePaymentProposalForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchProposals} proposals={proposals} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">₹{(stats.totalPending / 100000).toFixed(1)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">₹{(stats.totalProcessing / 100000).toFixed(1)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid This Month</p>
                  <p className="text-2xl font-bold">₹{(stats.totalPaid / 100000).toFixed(1)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proposals" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="proposals">Payment Proposals</TabsTrigger>
              {user && (user.role === 'finance_manager' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
                <TabsTrigger value="approvals">My Approvals</TabsTrigger>
              )}
              <TabsTrigger value="status">Payment Status</TabsTrigger>
              {user && (user.role === 'finance_manager' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
                <TabsTrigger value="matrix">Approval Matrix</TabsTrigger>
              )}
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="proposals">
            {selectedProposals.length > 0 && (
              <Card className="mb-4 bg-primary/5 border-primary/20">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedProposals.length} proposals selected
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedProposals([])}>
                        Clear Selection
                      </Button>
                      <Button size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Bulk Submit for Approval
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <PaymentProposalTable 
              proposals={filteredProposals} 
              selectedProposals={selectedProposals}
              onToggleSelect={toggleSelectProposal}
              fetchProposals={fetchProposals}
              onViewDetail={setSelectedProposal}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <PaymentProposalTable 
              proposals={filteredProposals.filter(p => p.status === 'pending_approval')} 
              showApprovalActions
              selectedProposals={selectedProposals}
              onToggleSelect={toggleSelectProposal}
              fetchProposals={fetchProposals}
              onViewDetail={setSelectedProposal}
            />
          </TabsContent>

          <TabsContent value="status">
            <PaymentStatusTracker proposals={proposals.filter(p => p.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase()))} />
          </TabsContent>

          <TabsContent value="matrix">
            <ApprovalMatrixView />
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedProposal} onOpenChange={(open) => {
          if (!open) {
            setSelectedProposal(null);
            if (id) {
              navigate('/payments/proposals');
            }
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Proposal Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage payment proposal details details and actions here.</DialogDescription>
            </DialogHeader>
            {selectedProposal && (
              <PaymentProposalDetailView 
                proposal={selectedProposal} 
                onClose={() => setSelectedProposal(null)} 
                onUpdate={fetchProposals} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function PaymentProposalTable({ 
  proposals, 
  showApprovalActions = false,
  selectedProposals,
  onToggleSelect,
  fetchProposals,
  onViewDetail
}: { 
  proposals: PaymentProposal[]; 
  showApprovalActions?: boolean;
  selectedProposals: string[];
  onToggleSelect: (id: string) => void;
  fetchProposals: () => void;
  onViewDetail: (proposal: PaymentProposal) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Proposal ID</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Retention</TableHead>
              <TableHead>Net Payable</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Approval Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No payment proposals found
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((proposal) => {
                const statusInfo = statusConfig[proposal.status as keyof typeof statusConfig] || {
                  label: proposal.status || 'Unknown',
                  variant: 'secondary' as const,
                  icon: FileText,
                  color: 'text-muted-foreground'
                };
                const StatusIcon = statusInfo.icon;
                const isOverdue = new Date(proposal.dueDate) < new Date() && proposal.status !== 'paid';
                const approvalProgress = (proposal.approvalLevel / proposal.maxApprovalLevel) * 100;
                
                return (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedProposals.includes(proposal.id)}
                        onCheckedChange={() => onToggleSelect(proposal.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{proposal.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{proposal.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{proposal.vendorId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{proposal.invoices.length} invoices</Badge>
                    </TableCell>
                    <TableCell>₹{proposal.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>₹{proposal.gstAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-destructive">-₹{proposal.retentionAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-bold">₹{proposal.netPayable.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {proposal.dueDate}
                        {isOverdue && <AlertTriangle className="h-3 w-3 ml-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-24">
                        <Progress value={approvalProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Level {proposal.approvalLevel}/{proposal.maxApprovalLevel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetail(proposal)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {showApprovalActions && proposal.status === 'pending_approval' && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={async () => {
                                const token = localStorage.getItem('campusspend_token');
                                await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                                  body: JSON.stringify({ status: 'approved' })
                                });
                                fetchProposals();
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={async () => {
                                const token = localStorage.getItem('campusspend_token');
                                await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                                  body: JSON.stringify({ status: 'rejected' })
                                });
                                fetchProposals();
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {proposal.status !== 'paid' && proposal.status !== 'processing' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                size="sm"
                                disabled={proposal.status !== 'approved'}
                              >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Release Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Release Payment</DialogTitle>
                                <DialogDescription>Enter the UTR number to mark this payment as paid.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">UTR Number / Transaction ID</label>
                                  <Input id={`utr-${proposal.id}`} placeholder="Enter UTR number" />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                  <Button onClick={async () => {
                                    const utrNumber = (document.getElementById(`utr-${proposal.id}`) as HTMLInputElement)?.value;
                                    try {
                                      const token = localStorage.getItem('campusspend_token');
                                      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/process/`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                        },
                                        body: JSON.stringify({ utr_number: utrNumber })
                                      });
                                      if (res.ok) {
                                        toast({ title: 'Success', description: `Payment processed for proposal ${proposal.id}.` });
                                        fetchProposals();
                                      } else {
                                        throw new Error('Failed to process payment');
                                      }
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: err.message, variant: 'destructive' });
                                    }
                                  }}>Submit Payment</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PaymentStatusTracker({ proposals }: { proposals: PaymentProposal[] }) {
  const stages = [
    { key: 'draft', label: 'Draft', count: proposals.filter(p => p.status === 'draft').length },
    { key: 'pending_approval', label: 'Pending Approval', count: proposals.filter(p => p.status === 'pending_approval').length },
    { key: 'approved', label: 'Approved', count: proposals.filter(p => p.status === 'approved').length },
    { key: 'processing', label: 'Processing', count: proposals.filter(p => p.status === 'processing').length },
    { key: 'paid', label: 'Paid', count: proposals.filter(p => p.status === 'paid').length },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Pipeline</CardTitle>
          <CardDescription>Track payments through each stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                    stage.count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {stage.count}
                  </div>
                  <p className="text-sm font-medium mt-2">{stage.label}</p>
                </div>
                {index < stages.length - 1 && (
                  <ArrowRight className="h-6 w-6 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map(proposal => {
          const statusInfo = statusConfig[proposal.status as keyof typeof statusConfig] || {
            label: proposal.status || 'Unknown',
            variant: 'secondary' as const,
            icon: FileText,
            color: 'text-muted-foreground'
          };
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm text-muted-foreground">{proposal.id}</p>
                    <p className="font-semibold">{proposal.vendorName}</p>
                  </div>
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Payable</span>
                    <span className="font-bold">₹{proposal.netPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Date</span>
                    <span>{proposal.dueDate}</span>
                  </div>
                  <Progress value={(proposal.approvalLevel / proposal.maxApprovalLevel) * 100} className="h-2 mt-3" />
                  <p className="text-xs text-muted-foreground">
                    Approval: Level {proposal.approvalLevel} of {proposal.maxApprovalLevel}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalMatrixView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Payment Approval Matrix
          </CardTitle>
          <CardDescription>
            Payment approvals are routed based on amount thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Amount Range</TableHead>
                <TableHead>Current Approver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalMatrix.map((level) => (
                <TableRow key={level.level}>
                  <TableCell>
                    <Badge variant="outline">Level {level.level}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{level.role}</TableCell>
                  <TableCell>
                    ₹{level.minAmount.toLocaleString()} - {level.maxAmount === Infinity ? '∞' : `₹${level.maxAmount.toLocaleString()}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      {level.approver}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Rules</CardTitle>
          <CardDescription>Automatic escalation when approvals are delayed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Level 1 to Level 2</p>
                <p className="text-sm text-muted-foreground">Escalate after 24 hours of inactivity</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Level 2 to Level 3</p>
                <p className="text-sm text-muted-foreground">Escalate after 48 hours of inactivity</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Final Escalation</p>
                <p className="text-sm text-muted-foreground">Notify CXO after 72 hours of total delay</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface InvoiceCatalog {
  id: string;
  vendorId?: string;
  vendor_id?: string;
  vendorName?: string;
  vendor_name?: string;
  amount: number;
  gst: number;
  totalAmount: number;
  dueDate?: string;
  due_date?: string;
  invoiceNumber?: string;
  invoice_number?: string;
  status: string;
}

interface VendorCatalog {
  id: string;
  name: string;
}

function CreatePaymentProposalForm({ 
  onClose, 
  onSuccess,
  proposals = []
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  proposals?: PaymentProposal[];
}) {
  const [vendorsList, setVendorsList] = useState<VendorCatalog[]>([]);
  const [invoicesList, setInvoicesList] = useState<InvoiceCatalog[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [paymentMode, setPaymentMode] = useState('neft');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const vRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/eligible-vendors/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (vRes.ok) {
          const data = await vRes.json();
          setVendorsList(data);
        }
        const iRes = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/invoices/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (iRes.ok) {
          const data = await iRes.json();
          setInvoicesList(data);
        }
      } catch (err) {
        console.error('Error loading data for proposal form:', err);
      }
    };
    fetchData();
  }, []);

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setSelectedInvoices([]);
  };

  // 3. Fix invoice exclusion logic to support both proposal formats
  const excludedInvoiceIds = new Set<string>();
  proposals.forEach(p => {
    if (Array.isArray(p.invoices)) {
      p.invoices.forEach((inv: any) => {
        if (typeof inv === 'string') {
          excludedInvoiceIds.add(inv);
        } else if (inv && typeof inv === 'object' && inv.invoice_id) {
          excludedInvoiceIds.add(inv.invoice_id);
        }
      });
    }
  });

  // 1. & 2. Fix availableInvoices filtering and normalization
  const invoicesFound = invoicesList.filter(invoice => {
    const vId = invoice.vendor_id || invoice.vendorId;
    return vId === selectedVendorId;
  });

  const invoicesExcluded = invoicesFound.filter(invoice => {
    const invNo = invoice.id || invoice.invoice_number || invoice.invoiceNumber;
    return excludedInvoiceIds.has(invNo);
  });

  const availableInvoices = invoicesFound.filter(invoice => {
    const hasAllowedStatus = invoice.status === 'approved' || invoice.status === 'verified';
    const invNo = invoice.id || invoice.invoice_number || invoice.invoiceNumber;
    const isExcluded = excludedInvoiceIds.has(invNo);
    return hasAllowedStatus && !isExcluded;
  });

  // 5. Keep temporary console logs
  console.log("=== RUNTIME WORKFLOW LOGGING ===");
  console.log("1. All invoices returned from GET /api/invoices/:", invoicesList);
  console.log("2. Selected Vendor ID:", selectedVendorId);
  console.log("3. Exact filtering logic: filter(invoice => (invoice.vendor_id || invoice.vendorId) === selectedVendorId && (invoice.status === 'approved' || invoice.status === 'verified') && !excludedInvoiceIds.has(invoice.id || invoice.invoice_number || invoice.invoiceNumber))");
  console.log("4. Details for every invoice:");
  invoicesList.forEach(invoice => {
    const invNo = invoice.id || invoice.invoice_number || invoice.invoiceNumber;
    const vId = invoice.vendor_id || invoice.vendorId;
    const passesVendorCheck = vId === selectedVendorId;
    const passesStatusCheck = invoice.status === 'approved' || invoice.status === 'verified';
    const excludedByProposal = excludedInvoiceIds.has(invNo);
    console.log({
      id: invoice.id,
      vendor_id: invoice.vendor_id,
      vendorId: invoice.vendorId,
      status: invoice.status,
      excludedByProposal,
      passesVendorCheck,
      passesStatusCheck
    });
  });
  console.log("Invoices Found (matching vendor):", invoicesFound);
  console.log("Invoices Excluded (already in proposals):", invoicesExcluded);
  console.log("Final Available Invoices:", availableInvoices);

  const selectedInvoiceObjects = invoicesList.filter(inv => {
    const invNo = inv.id || inv.invoice_number || inv.invoiceNumber;
    return selectedInvoices.includes(invNo);
  });
  
  const totalAmount = selectedInvoiceObjects.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const gstAmount = selectedInvoiceObjects.reduce((sum, inv) => sum + Number(inv.gst), 0);
  const retentionAmount = totalAmount * 0.05;
  const netPayable = totalAmount + gstAmount - retentionAmount;

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();

    if (!selectedVendorId || selectedInvoices.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vendor and at least one invoice.',
        variant: 'destructive',
      });
      return;
    }

    const selectedVendor = vendorsList.find(v => v.id === selectedVendorId);

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: `PAY-${Date.now()}`,
          vendor_id: selectedVendorId,
          vendor_name: selectedVendor ? selectedVendor.name : 'Unknown Vendor',
          invoices: selectedInvoices,
          total_amount: totalAmount,
          gst_amount: gstAmount,
          retention_amount: retentionAmount,
          net_payable: netPayable,
          due_date: selectedInvoiceObjects.length > 0 ? (selectedInvoiceObjects[0].due_date || selectedInvoiceObjects[0].dueDate) : new Date().toISOString().split('T')[0],
          status: isDraft ? 'draft' : 'pending_approval',
          created_by: 'Priya Sharma',
          created_date: new Date().toISOString().split('T')[0],
        })
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: isDraft ? 'Proposal saved as draft.' : 'Payment proposal submitted successfully.',
        });
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit proposal');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Vendor</label>
          <Select value={selectedVendorId} onValueChange={handleVendorChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendorsList.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Mode</label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neft">NEFT</SelectItem>
              <SelectItem value="rtgs">RTGS</SelectItem>
              <SelectItem value="imps">IMPS</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Invoices</label>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">
                    <Checkbox 
                      className="h-5 w-5"
                      checked={availableInvoices.length > 0 && selectedInvoices.length === availableInvoices.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInvoices(availableInvoices.map(inv => inv.id || inv.invoice_number || inv.invoiceNumber || ''));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      {selectedVendorId ? 'No pending invoices for this vendor' : 'Select a vendor to see pending invoices'}
                    </TableCell>
                  </TableRow>
                ) : (
                  availableInvoices.map(invoice => {
                    const invId = invoice.id || invoice.invoice_number || invoice.invoiceNumber || '';
                    const vName = invoice.vendor_name || invoice.vendorName || '';
                    const dDate = invoice.due_date || invoice.dueDate || '';
                    return (
                      <TableRow key={invId}>
                        <TableCell>
                          <Checkbox 
                            className="h-5 w-5"
                            checked={selectedInvoices.includes(invId)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedInvoices([...selectedInvoices, invId]);
                              } else {
                                setSelectedInvoices(selectedInvoices.filter(id => id !== invId));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{invId}</TableCell>
                        <TableCell>{vName}</TableCell>
                        <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                        <TableCell>{dDate}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedInvoices.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="text-lg font-bold">₹{totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">GST</p>
                <p className="text-lg font-bold">₹{gstAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Retention (5%)</p>
                <p className="text-lg font-bold text-destructive">-₹{retentionAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Payable</p>
                <p className="text-lg font-bold text-primary">₹{netPayable.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="secondary" onClick={(e) => handleSubmit(e, true)}>Save as Draft</Button>
        <Button type="submit">Submit for Approval</Button>
      </div>
    </form>
  );
}

function PaymentProposalDetailView({ 
  proposal, 
  onClose, 
  onUpdate 
}: { 
  proposal: PaymentProposal; 
  onClose: () => void; 
  onUpdate: () => void; 
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const handleUpdateStatus = async (status: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast({ title: 'Success', description: `Status updated to ${status}.` });
        onUpdate();
        onClose();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/process/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        toast({ title: 'Success', description: `Payment processed and expense recorded.` });
        onUpdate();
        onClose();
      } else {
        throw new Error('Failed to process payment');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h3 className="text-xl font-bold">{proposal.id}</h3>
          <p className="text-sm text-muted-foreground">{proposal.vendorName}</p>
        </div>
        <Badge className="capitalize">{proposal.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Proposal Details</h4>
          <div className="space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By</span>
              <span>{proposal.createdBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{proposal.dueDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor ID</span>
              <span className="font-semibold">{proposal.vendorId}</span>
            </div>
            {proposal.currentApprover && proposal.currentApprover !== 'None' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Approver</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{proposal.currentApprover.replace(/_/g, ' ')}</span>
              </div>
            )}
            {proposal.approvedBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved By</span>
                <span className="text-emerald-600 font-medium">{proposal.approvedBy}</span>
              </div>
            )}
            {proposal.rejectedBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rejected By</span>
                <span className="text-rose-600 font-medium">{proposal.rejectedBy}</span>
              </div>
            )}
            {proposal.rejectionReason && (
              <div className="flex flex-col gap-1 border-t pt-2 mt-2">
                <span className="text-muted-foreground">Rejection Reason</span>
                <span className="text-rose-600 text-xs italic bg-rose-50 dark:bg-rose-950/20 p-2 rounded">{proposal.rejectionReason}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Breakdown</h4>
          <div className="space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Invoiced Amount</span>
              <span>{formatCurrency(proposal.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span>{formatCurrency(proposal.gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Retention (5%)</span>
              <span className="text-destructive">-{formatCurrency(proposal.retentionAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-slate-900 dark:text-slate-100">
              <span>Net Payable</span>
              <span className="text-primary">{formatCurrency(proposal.netPayable)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Linked Invoices</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposal.invoices.map((invId) => (
                <TableRow key={invId}>
                  <TableCell className="font-mono">{invId}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          onClose();
                          navigate(`/vendor/invoices`);
                        }}
                      >
                        View Invoice
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h4 className="font-bold text-sm uppercase tracking-wide text-slate-800 dark:text-slate-200 mb-4">Workflow Engine Approvals</h4>
        <WorkflowContainer module="payments" entityId={proposal.id} onWorkflowUpdate={onUpdate} />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {proposal.status === 'draft' && (
          <Button onClick={() => handleUpdateStatus('pending_approval')} disabled={loading}>
            Submit for Approval
          </Button>
        )}
        {proposal.status !== 'paid' && proposal.status !== 'processing' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={proposal.status !== 'approved' || loading}>
                Release Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Release Payment</DialogTitle>
                <DialogDescription>Enter the UTR number to mark this payment as paid.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">UTR Number / Transaction ID</label>
                  <Input id={`detail-utr-${proposal.id}`} placeholder="Enter UTR number" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button onClick={async () => {
                    const utrNumber = (document.getElementById(`detail-utr-${proposal.id}`) as HTMLInputElement)?.value;
                    try {
                      const token = localStorage.getItem('campusspend_token');
                      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/payments/${proposal.id}/process/`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ utr_number: utrNumber })
                      });
                      if (res.ok) {
                        toast({ title: 'Success', description: `Payment processed for proposal ${proposal.id}.` });
                        onUpdate();
                        onClose();
                      } else {
                        throw new Error('Failed to process payment');
                      }
                    } catch (err: any) {
                      toast({ title: 'Error', description: err.message, variant: 'destructive' });
                    }
                  }}>Submit Payment</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {proposal.status === 'processing' && user && (user.role === 'finance_manager' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
          <Button onClick={() => handleUpdateStatus('paid')} disabled={loading}>
            Mark as Paid
          </Button>
        )}
      </div>
    </div>
  );
}

