import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { 
  Plus, Search, Filter, Upload, Receipt, CheckCircle, XCircle, Clock, 
  FileText, DollarSign, Calendar, Download
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowContainer } from '@/components/workflow/WorkflowContainer';


interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  payment_mode: string;
  status: string;
  description: string;
  approved_by?: string;
  created_at?: string;
}

const categories = ['Maintenance', 'Security', 'Soft Services', 'Electrical', 'HVAC', 'Plumbing', 'Civil', 'Other'];

const paymentModes = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
];

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
  draft: { label: 'Draft', variant: 'secondary' as const, icon: FileText },
  submitted: { label: 'Submitted', variant: 'default' as const, icon: Clock },
  paid: { label: 'Paid', variant: 'default' as const, icon: DollarSign },
};

export default function ExpenseManagement() {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreateRoute = location.pathname === '/expenses/create';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/expenses/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Expenses list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/expenses/export/?format=xlsx`,
        `expenses_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Expenses list exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/expenses/${id}/status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Expense ${status} successfully.`,
        });
        fetchExpenses();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          expense.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: expenses.length,
    pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length,
    totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
  };

  if (isCreateRoute) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New Expense</h1>
            <p className="text-muted-foreground">Submit a new site or operational expense for approval</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <CreateExpenseForm
                onClose={() => navigate('/expenses/my-expenses')}
                onSuccess={() => {
                  fetchExpenses();
                  navigate('/expenses/my-expenses');
                }}
              />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
            <p className="text-muted-foreground">Create, track, and approve expenses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {user && (user.role === 'site_engineer' || user.role === 'store_keeper' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'site_manager') && (
              <Button onClick={() => navigate('/expenses/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Expense
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
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
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">All Expenses</TabsTrigger>
              <TabsTrigger value="pending-approval">Pending Approval</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <ExpenseTable expenses={filteredExpenses} onStatusUpdate={handleUpdateStatus} onViewDetail={setSelectedExpense} />
          </TabsContent>
          <TabsContent value="pending-approval">
            <ExpenseTable expenses={filteredExpenses.filter(e => e.status === 'pending')} showApprovalActions onStatusUpdate={handleUpdateStatus} onViewDetail={setSelectedExpense} />
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage expense details details and actions here.</DialogDescription>
            </DialogHeader>
            {selectedExpense && (
              <ExpenseDetailView 
                expense={selectedExpense} 
                onClose={() => setSelectedExpense(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function ExpenseTable({ 
  expenses, 
  showApprovalActions = false, 
  onStatusUpdate,
  onViewDetail
}: { 
  expenses: Expense[]; 
  showApprovalActions?: boolean;
  onStatusUpdate?: (id: string, status: string) => void;
  onViewDetail: (expense: Expense) => void;
}) {
  const { user } = useAuth();
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => {
                const statusInfo = statusConfig[expense.status as keyof typeof statusConfig] || { label: expense.status, variant: 'secondary' as const, icon: FileText };
                const StatusIcon = statusInfo.icon;
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-mono text-sm">{expense.id}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="font-semibold">₹{Number(expense.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {expense.date}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{expense.payment_mode ? expense.payment_mode.replace('_', ' ') : ''}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetail(expense)}>View</Button>
                        {showApprovalActions && expense.status === 'pending' && onStatusUpdate && user && (user.role === 'finance_manager' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
                          <>
                            <Button variant="default" size="sm" onClick={() => onStatusUpdate(expense.id, 'approved')}>Approve</Button>
                            <Button variant="destructive" size="sm" onClick={() => onStatusUpdate(expense.id, 'rejected')}>Reject</Button>
                          </>
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

function CreateExpenseForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || !date || !paymentMode) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/expenses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: `EXP-${Date.now()}`,
          category: category,
          amount: amount,
          date: date,
          payment_mode: paymentMode,
          status: 'pending',
          description: description || '',
        })
      });

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Expense submitted for approval.',
        });
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || errData.error || 'Failed to submit expense');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input id="amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Payment Mode *</Label>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment mode" />
            </SelectTrigger>
            <SelectContent>
              {paymentModes.map(mode => (
                <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Describe the expense..." rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Upload Receipt/Bill</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Submit for Approval</Button>
      </div>
    </form>
  );
}

function ExpenseDetailView({ 
  expense, 
  onClose 
}: { 
  expense: any; 
  onClose: () => void; 
}) {
  const navigate = useNavigate();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h3 className="text-xl font-bold">{expense.id}</h3>
          <p className="text-sm text-muted-foreground">{expense.category}</p>
        </div>
        <Badge className="capitalize">{expense.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Expense Information</h4>
          <div className="space-y-2 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{expense.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Mode</span>
              <span className="capitalize">{expense.payment_mode ? expense.payment_mode.replace('_', ' ') : ''}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Originating Workflow Links</h4>
          <div className="space-y-3 text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            {expense.po_id ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Linked PO</span>
                <Button 
                  size="sm" 
                  variant="link" 
                  className="p-0 h-auto font-bold text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    onClose();
                    navigate(`/orders`);
                  }}
                >
                  {expense.po_id}
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No linked PO</div>
            )}

            {expense.invoice_id ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Linked Invoice</span>
                <Button 
                  size="sm" 
                  variant="link" 
                  className="p-0 h-auto font-bold text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    onClose();
                    navigate(`/vendor/invoices`);
                  }}
                >
                  {expense.invoice_id}
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No linked Invoice</div>
            )}

            {expense.payment_proposal_id ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Proposal</span>
                <Button 
                  size="sm" 
                  variant="link" 
                  className="p-0 h-auto font-bold text-blue-600 dark:text-blue-400"
                  onClick={() => {
                    onClose();
                    navigate(`/payments`);
                  }}
                >
                  {expense.payment_proposal_id}
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No linked Proposal</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-sm uppercase tracking-wide text-slate-700 dark:text-slate-200">Description</h4>
        <p className="text-sm p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-muted-foreground">
          {expense.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-6 border-t">
        <h4 className="font-bold text-sm uppercase tracking-wide text-slate-800 dark:text-slate-200 mb-4">Workflow Engine History</h4>
        <WorkflowContainer module="expenses" entityId={expense.id} />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

