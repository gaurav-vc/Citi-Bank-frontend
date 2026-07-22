import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Copy,
  Archive,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PurchaseOrder } from '@/types';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowContainer } from '@/components/workflow/WorkflowContainer';
import { ordersAPI } from '@/api/orders';
import { api } from '@/api/client';

const mapOrder = (o: any) => ({
  id: o.id,
  orderNumber: o.order_number,
  vendorName: o.vendor_name,
  vendorId: o.vendor_id,
  netValue: typeof o.net_value === 'string' ? parseFloat(o.net_value) : o.net_value,
  status: o.status,
  startDate: o.start_date,
  endDate: o.end_date,
  deliveryDate: o.delivery_date,
  createdAt: o.created_at,
  items: o.items ?? [],
  type: o.type,
  vendor: o.vendor,
  category: o.category,
  totalValue: typeof o.total_value === 'string' ? parseFloat(o.total_value) : o.total_value,
  taxes: typeof o.taxes === 'string' ? parseFloat(o.taxes) : o.taxes,
  retentionPercent: o.retention_percent,
  milestones: o.milestones ?? [],
  rfqWorkflowHistory: o.rfq_workflow_history ?? [],
});

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await ordersAPI.getOrders();
      if (data) {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const mapped = list.map(mapOrder);
        setPurchaseOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDownloadPO = async (po: any) => {
    toast({
      title: 'Download Started',
      description: 'Purchase Order PDF is being generated.',
    });
    try {
      const token = localStorage.getItem('campusspend_token') || '';
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/orders/${po.id}/download/`,
        `PO_${po.id}.pdf`,
        token
      );
      toast({
        title: 'Download Complete',
        description: `PO ${po.id} downloaded successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'An error occurred during download.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Purchase orders list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/orders/export/?format=xlsx`,
        `purchase_orders_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Purchase orders list exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicatePO = async (po: any) => {
    toast({ title: 'Duplicating PO...', description: 'Please wait.' });
    try {
      await ordersAPI.duplicateOrder(po.id);
      toast({ title: 'Success', description: `PO ${po.id} duplicated successfully.` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleArchivePO = async (po: any) => {
    try {
      await ordersAPI.archiveOrder(po.id);
      toast({ title: 'Success', description: `PO ${po.id} archived successfully.` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleClosePO = async (po: any) => {
    try {
      await ordersAPI.closeOrder(po.id);
      toast({ title: 'Success', description: `PO ${po.id} closed successfully.` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeletePO = async (po: any) => {
    if (!window.confirm(`Are you sure you want to delete PO ${po.id}?`)) return;
    try {
      await api.delete(`orders/${po.id}/`);
      toast({ title: 'Success', description: `PO ${po.id} deleted successfully.` });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateGRNFromPO = async (po: any) => {
    toast({ title: 'Creating GRN...', description: `Generating GRN from PO ${po.id}` });
    try {
      const poItems = po.items.map((item: any, index: number) => ({
        item_id: `item-${index + 1}`,
        item_name: item.itemName || 'Unknown Item',
        ordered_qty: item.quantity || 0,
        received_qty: item.quantity || 0,
        accepted_qty: 0,
        uom: item.uom || 'Nos'
      }));

      await api.post('grns/', {
        id: `GRN-${po.id}-${Date.now().toString().slice(-4)}`,
        po_id: po.id,
        received_by: user ? user.name : 'System User',
        received_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        invoice_date: null,
        vendor_name: po.vendorName || '',
        attachments: [],
        remarks: 'Auto-generated GRN from PO',
        status: 'pending',
        items: poItems
      });

      toast({ title: 'Success', description: `GRN for PO ${po.id} created successfully.` });
      navigate(`/inventory/grn`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCreateInvoiceFromPO = async (po: any) => {
    toast({ title: 'Creating Invoice...', description: `Generating invoice from PO ${po.id}` });
    try {
      await api.post('invoices/', {
        id: `INV-${po.id}-${Date.now().toString().slice(-4)}`,
        invoice_number: `INV-${po.id}`,
        invoice_date: new Date().toISOString().split('T')[0],
        po_id: po.id,
        vendor_id: po.vendor,
        vendor_name: po.vendorName,
        amount: po.totalValue,
        gst: po.taxes,
        total_amount: po.netValue,
        due_date: po.endDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        matching_status: po.type === 'po' ? '3way' : '2way'
      });
      toast({ title: 'Invoice Created', description: `Successfully created Invoice for PO ${po.id}.` });
      navigate('/vendor/invoices');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = purchaseOrders.find((po) => String(po.id) === String(id));
    if (found) {
      setSelectedPO(found);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/purchase-orders');
    }
  }, [id, isLoading, purchaseOrders, navigate]);

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || po.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || po.vendorName === vendorFilter;
    return matchesSearch && matchesType && matchesStatus && matchesVendor;
  });

  const uniqueVendors = Array.from(new Set(purchaseOrders.map((po) => po.vendorName).filter(Boolean))).sort();

  const poStats = {
    total: purchaseOrders.length,
    active: purchaseOrders.filter((p) => p.status === 'in_progress').length,
    completed: purchaseOrders.filter((p) => p.status === 'completed').length,
    totalValue: purchaseOrders.reduce((sum, p) => sum + p.netValue, 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-muted-foreground">
              Manage purchase orders, work orders, and AMC contracts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {user && (user.role === 'procurement_manager' || user.role === 'procurement_executive' || user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role)) && (
              <Button onClick={() => navigate('/orders/create')}>
                Create PO
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{poStats.total}</p>
                </div>
                <Package className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold text-info">{poStats.active}</p>
                </div>
                <Clock className="h-8 w-8 text-info/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-success">{poStats.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(poStats.totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Filters */}
        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="po">Purchase Orders</TabsTrigger>
              <TabsTrigger value="wo">Work Orders</TabsTrigger>
              <TabsTrigger value="amc">AMC Orders</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {uniqueVendors.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendor</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Progress</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">End Date</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((po) => {
                        const deliveredValue = po.items.reduce(
                          (sum, item) => sum + (item.deliveredQty / item.quantity) * 100,
                          0
                        ) / po.items.length;

                        return (
                          <tr key={po.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{po.id}</p>
                                <p className="text-xs text-muted-foreground">
                                  Created {new Date(po.createdAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={po.type === 'amc' ? 'default' : 'secondary'}>
                                {po.type.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{po.vendorName}</p>
                                <p className="text-xs text-muted-foreground">{po.vendor}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground">{po.category}</td>
                            <td className="py-4 px-4 text-right font-medium">
                              {formatCurrency(po.netValue)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="w-24 mx-auto">
                                <Progress value={deliveredValue} className="h-2" />
                                <p className="text-xs text-center text-muted-foreground mt-1">
                                  {deliveredValue.toFixed(0)}%
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <StatusBadge status={po.status} />
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(po.endDate).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedPO(po)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {po.status === 'draft' && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager' || user.role === 'procurement_executive') && (
                                    <DropdownMenuItem onClick={() => navigate(`/orders/edit/${po.id}`)}>
                                      <Eye className="h-4 w-4 mr-2 text-amber-500" />
                                      Edit Draft
                                    </DropdownMenuItem>
                                  )}
                                  {user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager' || user.role === 'procurement_executive') && (
                                    <DropdownMenuItem onClick={() => handleDuplicatePO(po)}>
                                      <Copy className="h-4 w-4 mr-2 text-blue-500" />
                                      Duplicate PO
                                    </DropdownMenuItem>
                                  )}
                                  {po.status !== 'archived' && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager') && (
                                    <DropdownMenuItem onClick={() => handleArchivePO(po)}>
                                      <Archive className="h-4 w-4 mr-2 text-purple-500" />
                                      Archive PO
                                    </DropdownMenuItem>
                                  )}
                                  {po.status !== 'closed' && po.status !== 'draft' && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager') && (
                                    <DropdownMenuItem onClick={() => handleClosePO(po)}>
                                      <CheckSquare className="h-4 w-4 mr-2 text-emerald-500" />
                                      Close PO
                                    </DropdownMenuItem>
                                  )}
                                  {(po.status === 'draft' || po.status === 'rejected') && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager' || user.role === 'procurement_executive') && (
                                    <DropdownMenuItem onClick={() => handleDeletePO(po)}>
                                      <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                      Delete PO
                                    </DropdownMenuItem>
                                  )}
                                  {po.status === 'approved' && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager' || user.role === 'vendor') && (
                                    <DropdownMenuItem onClick={() => handleCreateInvoiceFromPO(po)}>
                                      <CheckSquare className="h-4 w-4 mr-2 text-indigo-500" />
                                      Create Invoice
                                    </DropdownMenuItem>
                                  )}
                                  {(po.status === 'approved' || po.status === 'active' || po.status === 'vendor_accepted' || po.status === 'closed') && user && (user.role === 'super_admin' || ['cxo', 'cxo_citi', 'cxo_emb'].includes(user.role) || user.role === 'procurement_manager' || user.role === 'store_keeper' || user.role === 'site_manager' || user.role === 'site_keeper') && (
                                    <DropdownMenuItem onClick={() => handleCreateGRNFromPO(po)}>
                                      <Package className="h-4 w-4 mr-2 text-orange-500" />
                                      Create GRN
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handleDownloadPO(po)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PO
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
              </CardContent>
            </Card>
          </div>
        </Tabs>

        {/* PO Detail Modal would go here */}
        {selectedPO && (
          <PODetailView 
            po={selectedPO} 
            onClose={() => {
              setSelectedPO(null);
              if (id) {
                navigate('/purchase-orders');
              }
            }} 
            onDownload={handleDownloadPO} 
          />
        )}
      </div>
    </MainLayout>
  );
}

function PODetailView({ po, onClose, onDownload }: { po: PurchaseOrder; onClose: () => void; onDownload: (po: any) => void }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageStatus = (stageNum: number) => {
    const status = po.status?.toLowerCase() || '';
    if (status === 'approved' || status === 'vendor_accepted' || status === 'closed') return 'completed';
    if (status === 'rejected') return 'failed';
    
    if (stageNum === 1) {
      if (status === 'pending_procurement_approval') return 'pending';
      return 'completed';
    }
    if (stageNum === 2) {
      if (status === 'budget_validation_pending') return 'pending';
      if (status === 'budget_hold') return 'hold';
      if (status === 'pending_procurement_approval') return 'queued';
      return 'completed';
    }
    if (stageNum === 3) {
      if (status === 'finance_approved') return 'pending';
      if (status === 'pending_procurement_approval' || status === 'budget_validation_pending' || status === 'budget_hold') return 'queued';
      return 'completed';
    }
    if (stageNum === 4) {
      if (status === 'released') return 'pending';
      return 'queued';
    }
    return 'queued';
  };

  const getWorkflowTimestamp = (roleName: string) => {
    const history = (po as any).rfqWorkflowHistory || [];
    let entry = history.find((h: any) => h.role === roleName);
    if (!entry && roleName === 'procurement_manager') {
      entry = history.find((h: any) => h.action?.toLowerCase() === 'submitted');
    }
    if (!entry && ['cxo', 'cxo_citi', 'cxo_emb'].includes(roleName || '')) {
      entry = history.find((h: any) => h.role === 'cxo_citi' || h.role === 'cxo_emb');
    }
    
    if (entry && entry.timestamp) {
      const date = new Date(entry.timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    }
    return '-';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{po.id}</CardTitle>
            <p className="text-muted-foreground">{po.vendorName}</p>
          </div>
          <StatusBadge status={po.status} />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">{formatCurrency(po.netValue)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Retention</p>
              <p className="text-xl font-bold">{po.retentionPercent}%</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-xl font-bold">
                {new Date(po.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-xl font-bold">
                {new Date(po.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Budget Utilization Tracker */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Budget Utilization ({po.category} / {po.tower})</span>
              <span className="text-slate-600 dark:text-slate-300">
                {((po.netValue / 5000000) * 100).toFixed(1)}% of Annual Budget
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (po.netValue / 5000000) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min((po.netValue / 5000000) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>Spent: {formatCurrency(po.netValue)}</span>
              <span>Annual Budget: {formatCurrency(5000000)}</span>
            </div>
          </div>

          {/* Approval Stage Cards */}
          <div>
            <h4 className="font-semibold mb-3">Approval Stage Progress</h4>
            <div className="grid gap-3 md:grid-cols-4">
              {[
                { label: 'Commercial Terms', role: 'Procurement Manager', stage: 1 },
                { label: 'Budget Validation', role: 'Finance Executive', stage: 2 },
                { label: 'Financial Release', role: 'Finance Manager', stage: 3 },
                { label: 'Vendor Acceptance', role: 'Vendor', stage: 4 },
              ].map((st) => {
                const stageStatus = getStageStatus(st.stage);
                return (
                  <div
                    key={st.stage}
                    className={`p-3 border rounded-xl flex flex-col justify-between h-24 transition-all ${
                      stageStatus === 'completed'
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/10'
                        : stageStatus === 'pending'
                        ? 'border-blue-300 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/10 ring-2 ring-blue-500/20'
                        : stageStatus === 'hold'
                        ? 'border-amber-300 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/10 animate-pulse'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{st.role}</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{st.label}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider self-start ${
                        stageStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : stageStatus === 'pending'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : stageStatus === 'hold'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-500'
                      }`}
                    >
                      {stageStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-semibold mb-3">Line Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-2 px-4">Item</th>
                    <th className="text-right py-2 px-4">Qty</th>
                    <th className="text-right py-2 px-4">Rate</th>
                    <th className="text-right py-2 px-4">Amount</th>
                    <th className="text-right py-2 px-4">Delivered</th>
                    <th className="text-right py-2 px-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="py-3 px-4">{item.itemName}</td>
                      <td className="py-3 px-4 text-right">{item.quantity} {item.uom}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.rate)}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.amount)}</td>
                      <td className="py-3 px-4 text-right text-success">{item.deliveredQty}</td>
                      <td className="py-3 px-4 text-right text-warning">{item.balanceQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Milestones (for AMC/WO) */}
          {po.milestones && po.milestones.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Milestones</h4>
              <div className="space-y-2">
                {po.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {milestone.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <p className="font-medium">{milestone.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(milestone.dueDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{milestone.percentage}%</p>
                      <StatusBadge status={milestone.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Approvals Grid */}
          <div className="p-4 bg-muted/30 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <h4 className="font-semibold text-sm">Signatures & Approvals</h4>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {[
                { title: 'Prepared By', role: 'Procurement Manager', roleKey: 'procurement_manager' },
                { title: 'Checked By', role: 'Facility Manager', roleKey: 'facility_manager' },
                { title: 'Verified By', role: 'Project Head', roleKey: 'project_head' },
                { title: 'Approved By', role: 'CXO', roleKey: 'cxo' },
              ].map((sig) => {
                const ts = getWorkflowTimestamp(sig.roleKey);
                return (
                  <div key={sig.title} className="p-3 bg-white dark:bg-slate-900 border rounded-lg flex flex-col justify-between h-20 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{sig.title}</p>
                      <p className="text-xs font-bold mt-1">{sig.role}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{ts}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reusable Workflow Engine Engine Integration */}
          <div className="pt-6 border-t">
            <WorkflowContainer module="orders" entityId={po.id} onWorkflowUpdate={onClose} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onDownload(po)}>
              <Download className="h-4 w-4 mr-2" />
              Download PO
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
