import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Search, Filter, Package, CheckCircle, XCircle, Clock,
  Eye, FileText, Truck, ClipboardCheck, AlertTriangle, Download, ArrowLeft
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useParams, useNavigate } from 'react-router-dom';
import { inventoryAPI } from '@/api/inventory';
import { ordersAPI } from '@/api/orders';
import { api } from '@/api/client';

interface GRN {
  id: string;
  poId: string;
  vendor: string;
  receivedDate: string;
  items: GRNItem[];
  status: 'pending' | 'partial_accepted' | 'accepted' | 'rejected' | 'received' | 'pending_qc' | 'qc_completed';
  receivedBy: string;
  invoiceNumber?: string;
  remarks?: string;
}

interface GRNItem {
  itemId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty?: number;
  uom: string;
  remarks?: string;
  item_name?: string;
  ordered_quantity?: number;
  received_qty?: number;
  accepted_quantity?: number;
  accepted_qty?: number;
  rejected_quantity?: number;
  rejected_qty?: number;
}

const statusConfig: Record<string, {label: string, variant: 'default'|'secondary'|'destructive'|'outline', icon: any}> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  pending_qc: { label: 'Pending QC', variant: 'secondary', icon: Clock },
  qc_completed: { label: 'QC Completed', variant: 'outline', icon: ClipboardCheck },
  partial_accepted: { label: 'Partial Accepted', variant: 'outline', icon: AlertTriangle },
  accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  received: { label: 'Received', variant: 'default', icon: CheckCircle },
};

export default function GRNEntry() {
  const { token } = useAuth();
  const [grns, setGrns] = useState<GRN[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGrnId, setSelectedGrnId] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // For Create GRN Dialog
  const [isCreateGrnOpen, setIsCreateGrnOpen] = useState(false);
  const [approvedPOs, setApprovedPOs] = useState<any[]>([]);
  const [isFetchingPOs, setIsFetchingPOs] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [selectedPO, setSelectedPO] = useState<any | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchGrns();
  }, []);

  const fetchGrns = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryAPI.getGRNs();
      const mapped = data.map((g: any) => ({
        id: g.id,
        poId: g.po_id || g.poId,
        vendor: g.vendor_name ?? g.vendor ?? '',
        receivedDate: g.received_date || g.receivedDate,
        items: g.items ?? [],
        status: g.status,
        receivedBy: g.received_by || g.receivedBy,
        invoiceNumber: g.invoice_number || g.invoiceNumber,
        remarks: g.remarks,
      }));
      setGrns(mapped);
    } catch (err) {
      console.error('Error fetching GRNs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = grns.find((g) => String(g.id) === String(id));
    if (found) {
      setSelectedGrnId(found.id);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/inventory/grn');
    }
  }, [id, isLoading, grns, navigate]);

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'GRNs list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/grns/export/?format=xlsx`,
        `grns_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'GRNs list exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const fetchApprovedPOs = async () => {
    setIsFetchingPOs(true);
    try {
      const data = await ordersAPI.getOrders('?status=approved');
      setApprovedPOs(data);
    } catch (err: any) {
      toast({ title: 'Error fetching POs', description: err.message, variant: 'destructive' });
    } finally {
      setIsFetchingPOs(false);
    }
  };

  const handleCreateGRNFromPO = async () => {
    if (!selectedPO) return;
    toast({ title: 'Creating GRN...', description: `Generating GRN from PO ${selectedPO.id}` });
    try {
      const poItems = selectedPO.items.map((item: any, index: number) => ({
        item_id: `item-${index + 1}`,
        item_name: item.itemName || 'Unknown Item',
        ordered_qty: item.quantity || 0,
        received_qty: item.quantity || 0,
        accepted_qty: 0,
        uom: item.uom || 'Nos'
      }));

      await api.post('grns/', {
        id: `GRN-${selectedPO.id}-${Date.now().toString().slice(-4)}`,
        po_id: selectedPO.id,
        received_by: user ? user.name : 'System User',
        received_date: new Date().toISOString().split('T')[0],
        invoice_number: invoiceNumber || '',
        invoice_date: invoiceDate || null,
        vendor_name: selectedPO.vendorName || '',
        attachments: [],
        remarks: 'Auto-generated GRN from PO',
        status: 'pending',
        items: poItems
      });

      toast({ title: 'Success', description: `GRN for PO ${selectedPO.id} created successfully.` });
      setIsCreateGrnOpen(false);
      setSelectedPO(null);
      fetchGrns();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const uniqueStatuses = Array.from(new Set(grns.map(g => g.status).filter(Boolean))).sort();

  const filteredGRNs = grns.filter(grn => {
    const matchesSearch = (grn.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grn.poId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grn.vendor && (grn.vendor || '').toLowerCase().includes(searchTerm.toLowerCase()));
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = grn.status === statusFilter;
    }
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: grns.length,
    pending: grns.filter(g => g.status === 'pending' || g.status === 'pending_qc' || g.status === 'qc_completed').length,
    accepted: grns.filter(g => g.status === 'accepted' || g.status === 'received' || g.status === 'partial_accepted').length,
    rejected: grns.filter(g => g.status === 'rejected').length,
  };

  if (selectedGrnId) {
    return (
      <MainLayout>
        <GRNDetailsView 
          grnId={selectedGrnId} 
          onBack={() => {
            setSelectedGrnId(null);
            if (id) {
              navigate('/inventory/grn');
            }
          }} 
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">GRN Entry</h1>
            <p className="text-muted-foreground">Goods Receipt Note management and quality control</p>
          </div>
          <div className="flex gap-2">
              <Dialog open={isCreateGrnOpen} onOpenChange={(open) => {
              setIsCreateGrnOpen(open);
              if (open) fetchApprovedPOs();
              else {
                setSelectedPO(null);
                setInvoiceNumber('');
                setInvoiceDate('');
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create GRN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Create GRN from Purchase Order</DialogTitle>
                  <DialogDescription>
                    Select an approved Purchase Order to log the received goods.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Purchase Order</Label>
                    <Select onValueChange={(val) => {
                      const po = approvedPOs.find(p => p.id === val);
                      setSelectedPO(po || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={isFetchingPOs ? "Loading POs..." : "Select an approved PO"} />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedPOs.map(po => (
                          <SelectItem key={po.id} value={po.id}>
                            {po.id} - {po.vendorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPO && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-md border text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="font-semibold text-muted-foreground">PO Date:</span> {selectedPO.startDate || 'N/A'}</div>
                          <div><span className="font-semibold text-muted-foreground">Total Value:</span> {selectedPO.netValue || 0}</div>
                          <div><span className="font-semibold text-muted-foreground">Items:</span> {selectedPO.items?.length || 0} items</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Invoice Number</Label>
                          <Input 
                            placeholder="Optional" 
                            value={invoiceNumber} 
                            onChange={(e) => setInvoiceNumber(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Invoice Date</Label>
                          <Input 
                            type="date" 
                            value={invoiceDate} 
                            onChange={(e) => setInvoiceDate(e.target.value)} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateGrnOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateGRNFromPO} disabled={!selectedPO}>Create GRN</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total GRNs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('pending')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('accepted')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-2xl font-bold">{stats.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('rejected')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Filters */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">All GRNs</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search GRNs..."
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
                  {uniqueStatuses.map((status: any) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusFilter !== 'all' && (
                <Button variant="ghost" onClick={() => setStatusFilter('all')} className="text-muted-foreground hover:text-foreground">
                  Clear Filter
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="all">
            <GRNTable grns={filteredGRNs} onViewDetails={setSelectedGrnId} onActionComplete={fetchGrns} />
          </TabsContent>
          <TabsContent value="pending">
            <GRNTable grns={filteredGRNs.filter(g => g.status === 'pending_qc' || g.status === 'qc_completed' || g.status === 'pending')} onActionComplete={fetchGrns} onViewDetails={setSelectedGrnId} />
          </TabsContent>
          <TabsContent value="completed">
            <GRNTable grns={filteredGRNs.filter(g => g.status === 'accepted' || g.status === 'partial_accepted' || g.status === 'received' || g.status === 'rejected')} onActionComplete={fetchGrns} onViewDetails={setSelectedGrnId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function GRNTable({ grns, onActionComplete, onViewDetails }: { grns: GRN[], onActionComplete?: () => void, onViewDetails: (id: string) => void }) {
  const [actioningGrn, setActioningGrn] = useState<GRN | null>(null);
  const [actionType, setActionType] = useState<string>('');
  const [inventoryDecision, setInventoryDecision] = useState<'surplus' | 'site'>('surplus');
  const [partialItems, setPartialItems] = useState<Array<{itemId: string, itemName?: string, acceptedQty: number, rejectedQty: number}>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [grns.length]);

  const handleProcessGRN = async (action: 'accept' | 'reject' | 'partial_accept', payload: any = {}) => {
    try {
      if (action === 'partial_accept' && !payload.items) {
        payload.items = partialItems.map(p => ({
          itemId: p.itemId,
          acceptedQty: p.acceptedQty,
          rejectedQty: p.rejectedQty
        }));
      }

      await inventoryAPI.processGRNAction(actioningGrn?.id || '', {
        action,
        inventory_decision: inventoryDecision,
        ...payload
      });
      toast({ title: 'Success', description: 'GRN processed successfully' });
      if (onActionComplete) onActionComplete();
      setActioningGrn(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Action failed', variant: 'destructive' });
    }
  };
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN Number</TableHead>
              <TableHead>PO Reference</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Received By</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No GRNs found
                </TableCell>
              </TableRow>
            ) : (
              grns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((grn) => {
                const statusInfo = statusConfig[grn.status] || { label: grn.status, variant: 'default' as const, icon: CheckCircle };
                const StatusIcon = statusInfo.icon;
                const totalOrdered = grn.items.reduce((sum, i) => sum + (i.orderedQty || 0), 0);
                const totalReceived = grn.items.reduce((sum, i) => sum + (i.receivedQty || 0), 0);
                
                return (
                  <TableRow key={grn.id}>
                    <TableCell className="font-mono text-sm">{grn.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        {grn.poId}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{grn.vendor || 'System Vendor'}</TableCell>
                    <TableCell>{grn.receivedDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {grn.items.length} items ({totalReceived}/{totalOrdered})
                      </Badge>
                    </TableCell>
                    <TableCell>{grn.receivedBy}</TableCell>
                    <TableCell>
                      {grn.invoiceNumber || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onViewDetails(grn.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {grn.status === 'qc_completed' && (
                          <Dialog open={actioningGrn?.id === grn.id} onOpenChange={(open) => {
                            if (open) {
                              setActioningGrn(grn);
                              setInventoryDecision('surplus');
                            } else {
                              setActioningGrn(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700">Process</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Process GRN - {grn.id}</DialogTitle>
                                <DialogDescription>Review the final QC results and select the inventory destination. Quantities are populated from Quality Inspection.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2 p-3 bg-muted rounded-md border">
                                  <label className="text-sm font-semibold">Inventory Destination (For Accepted Quantities)</label>
                                  <div className="flex gap-4 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="radio" name="invDecision" value="surplus" checked={inventoryDecision === 'surplus'} onChange={(e) => setInventoryDecision(e.target.value as any)} />
                                      <span className="text-sm">Add to Surplus Stock</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="radio" name="invDecision" value="site" checked={inventoryDecision === 'site'} onChange={(e) => setInventoryDecision(e.target.value as any)} />
                                      <span className="text-sm">Direct Issue to Site</span>
                                    </label>
                                  </div>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Item Name</TableHead>
                                      <TableHead>Ordered Qty</TableHead>
                                      <TableHead>Received Qty</TableHead>
                                      <TableHead>Accepted Qty</TableHead>
                                      <TableHead>Rejected Qty</TableHead>
                                      <TableHead>Final Action</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {grn.items.map((item, idx) => {
                                      const req = item.receivedQty || item.received_qty || 0;
                                      const acc = item.acceptedQty || item.accepted_quantity || item.accepted_qty || 0;
                                      const rej = item.rejectedQty || item.rejected_quantity || item.rejected_qty || 0;
                                      let actionLabel = 'Accept';
                                      if (acc === 0) {
                                        actionLabel = 'Reject';
                                      } else if (rej > 0) {
                                        actionLabel = 'Partial Accept';
                                      }
                                      return (
                                        <TableRow key={item.itemId || idx}>
                                          <TableCell className="font-medium">{item.itemName || item.item_name}</TableCell>
                                          <TableCell>{item.orderedQty || item.ordered_quantity}</TableCell>
                                          <TableCell>{req}</TableCell>
                                          <TableCell className="font-semibold text-emerald-600">{acc}</TableCell>
                                          <TableCell className="font-semibold text-destructive">{rej}</TableCell>
                                          <TableCell>
                                            <Badge variant={actionLabel === 'Accept' ? 'default' : actionLabel === 'Reject' ? 'destructive' : 'outline'}>
                                              {actionLabel}
                                            </Badge>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                                <div className="flex justify-end gap-2 mt-4">
                                  <Button variant="outline" onClick={() => setActioningGrn(null)}>Cancel</Button>
                                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                                    const totalRec = grn.items.reduce((sum, i) => sum + (i.receivedQty || i.received_qty || 0), 0);
                                    const totalAcc = grn.items.reduce((sum, i) => sum + (i.acceptedQty || i.accepted_quantity || i.accepted_qty || 0), 0);
                                    const totalRej = grn.items.reduce((sum, i) => sum + (i.rejectedQty || i.rejected_quantity || i.rejected_qty || 0), 0);
                                    let calcAction = 'accept';
                                    if (totalAcc === 0) {
                                      calcAction = 'reject';
                                    } else if (totalRej > 0) {
                                      calcAction = 'partial_accept';
                                    }
                                    handleProcessGRN(calcAction as any);
                                  }}>Confirm Processing</Button>
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

interface PurchaseOrder {
  id: string;
  vendor_name: string;
  items: Array<{
    itemName: string;
    description?: string;
    quantity: number;
    uom: string;
    rate?: number;
    amount?: number;
  }>;
}

function CreateGRNForm({ onClose, onSuccess, grns }: { onClose: () => void; onSuccess: () => void; grns: GRN[] }) {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState('Amit Patel');
  const [challanNumber, setChallanNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const [remarks, setRemarks] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }));
      setAttachments([...attachments, ...filesArray]);
    }
  };
  const [items, setItems] = useState<Array<{
    itemId: string;
    itemName: string;
    orderedQty: number;
    receivedQty: number;
    uom: string;
  }>>([]);

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const data = await inventoryAPI.getPurchaseOrders();
        const eligible = (Array.isArray(data) ? data : ((data as any).results ?? []))
            .filter((po: any) => (po.status === 'approved' || po.status === 'active' || po.status === 'vendor_accepted' || po.status === 'closed') && !grns.some((g) => g.poId === po.id))
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setPurchaseOrders(eligible);
      } catch (err) {
        console.error('Error fetching POs:', err);
      }
    };
    fetchPOs();
  }, [grns]);

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      const poItems = po.items.map((item, index) => ({
        itemId: `item-${index + 1}`,
        itemName: item.itemName || 'Unknown Item',
        orderedQty: item.quantity || 0,
        receivedQty: item.quantity || 0, // default received quantity to ordered quantity
        uom: item.uom || 'Nos'
      }));
      setItems(poItems);
    } else {
      setItems([]);
    }
  };

  const handleReceivedQtyChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      receivedQty: val
    };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !receivedDate || !receivedBy) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    try {
      await inventoryAPI.createGRN({
        id: `GRN-${Date.now()}`,
        po_id: selectedPoId,
        received_date: receivedDate,
        received_by: receivedBy,
        items: items.map(item => ({
            item_id: item.itemId,
            item_name: item.itemName,
            ordered_qty: item.orderedQty,
            received_qty: item.receivedQty,
            accepted_qty: 0,
            uom: item.uom
        })),
        invoice_number: invoiceNumber || '',
        vendor_name: purchaseOrders.find(p => p.id === selectedPoId)?.vendor_name || '',
        attachments: attachments,
        remarks,
        status: 'pending'
      });
      toast({ title: 'Success', description: 'GRN created successfully' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create GRN',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Vendor Filter</Label>
          <Select value={vendorFilter} onValueChange={(val) => { setVendorFilter(val); setSelectedPoId(''); setItems([]); }}>
            <SelectTrigger>
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {Array.from(new Set(purchaseOrders.map(po => po.vendor_name || 'System Vendor').filter(Boolean))).sort().map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Select Purchase Order *</Label>
          <Select value={selectedPoId} onValueChange={handlePoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select PO" />
            </SelectTrigger>
            <SelectContent>
              {purchaseOrders
                .filter(po => vendorFilter === 'all' || (po.vendor_name || 'System Vendor') === vendorFilter)
                .map(po => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.id} - {po.vendor_name || 'System Vendor'}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Received Date *</Label>
          <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Delivery Challan Number</Label>
          <Input placeholder="Enter challan number" value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Invoice Number (if available)</Label>
          <Input placeholder="Enter invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Invoice Date</Label>
          <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Upload Vendor Invoice</Label>
          <Input type="file" onChange={handleFileUpload} className="cursor-pointer" />
          {attachments.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Selected: {attachments[0].name} ({attachments[0].size})
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">Items Received</Label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-24">Ordered Qty</TableHead>
                <TableHead className="w-24">Received Qty</TableHead>
                <TableHead className="w-24">UOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.orderedQty}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0" 
                      max={item.orderedQty} 
                      value={item.receivedQty} 
                      onChange={(e) => handleReceivedQtyChange(index, parseInt(e.target.value, 10) || 0)} 
                      className="w-20" 
                    />
                  </TableCell>
                  <TableCell>{item.uom}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="space-y-2">
        <Label>Remarks</Label>
        <Textarea placeholder="Enter any remarks about the delivery..." rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create GRN</Button>
      </div>
    </form>
  );
}

interface GRNDetailsProps {
  grnId: string;
  onBack: () => void;
}

function GRNDetailsView({ grnId, onBack }: GRNDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grnData, setGrnData] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inventoryAPI.getGRNById(grnId);
        setGrnData(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [grnId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-sm animate-pulse font-medium">Fetching GRN details...</p>
      </div>
    );
  }

  if (error || !grnData) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 max-w-2xl mx-auto my-8">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-destructive">Failed to Load GRN Details</h2>
          <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
          <Button onClick={onBack} variant="outline" className="mt-2">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('accept') || s.includes('received')) return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    if (s.includes('reject')) return 'bg-destructive text-destructive-foreground';
    if (s.includes('partial')) return 'bg-amber-500 hover:bg-amber-600 text-white';
    return 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button onClick={onBack} variant="outline" size="sm" className="h-8">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <span className="text-sm text-muted-foreground font-mono">/ Inventory / GRN / Details</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2 pt-2">
            GRN Details: <span className="font-mono text-primary">{grnData.grn_number}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge className={`${getStatusColor(grnData.status)} text-xs px-3 py-1 font-semibold shadow-sm`}>
            {grnData.status}
          </Badge>
        </div>
      </div>

      {/* Grid of info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="lg:col-span-2 shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">GRN Number</p>
              <p className="font-mono font-medium text-foreground text-sm">{grnData.grn_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">PO Reference</p>
              <p className="font-mono font-medium text-foreground text-sm">{grnData.po_reference}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Vendor</p>
              <p className="font-medium text-foreground text-sm">{grnData.vendor?.name || 'System Vendor'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Invoice Number</p>
              <p className="font-medium text-foreground text-sm">{grnData.invoice_number || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Received Date</p>
              <p className="font-medium text-foreground text-sm">{grnData.received_date}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Received By</p>
              <p className="font-medium text-foreground text-sm">{grnData.received_by}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Created Date</p>
              <p className="font-medium text-foreground text-sm">
                {grnData.created_date ? new Date(grnData.created_date).toLocaleString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Last Updated Date</p>
              <p className="font-medium text-foreground text-sm">
                {grnData.last_updated_date ? new Date(grnData.last_updated_date).toLocaleString() : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PO Details */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Purchase Order Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">PO Number</p>
              <p className="font-mono font-medium text-foreground">{grnData.purchase_order?.po_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">PO Date</p>
              <p className="font-medium text-foreground">{grnData.purchase_order?.po_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Department</p>
              <p className="font-medium text-foreground">{grnData.purchase_order?.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Requester</p>
              <p className="font-medium text-foreground">{grnData.purchase_order?.requester || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase">Expected Delivery Date</p>
              <p className="font-medium text-foreground">{grnData.purchase_order?.expected_delivery_date || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Details Table */}
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> Item Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="pl-6">Item</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Received Qty</TableHead>
                <TableHead className="text-right">Accepted Qty</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right pr-6">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grnData.items && grnData.items.length > 0 ? (
                grnData.items.map((item: any, idx: number) => {
                  const total = (item.accepted_quantity || 0) * (item.unit_price || 0);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium pl-6">{item.item_name}</TableCell>
                      <TableCell className="text-right">{item.ordered_quantity}</TableCell>
                      <TableCell className="text-right">{item.received_quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{item.accepted_quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">{item.rejected_quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-bold pr-6">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quality Inspection Section */}
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" /> Quality Inspection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="pl-6">Item</TableHead>
                <TableHead>Inspection Status</TableHead>
                <TableHead className="text-right">Accepted Qty</TableHead>
                <TableHead className="text-right">Rejected Qty</TableHead>
                <TableHead className="pl-6 pr-6">Remarks / Rejection Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grnData.items && grnData.items.length > 0 ? (
                grnData.items.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium pl-6">{item.item_name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.inspection_status === 'Accepted' ? 'default' :
                        item.inspection_status === 'Rejected' ? 'destructive' : 'secondary'
                      }>
                        {item.inspection_status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{item.accepted_quantity}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{item.rejected_quantity}</TableCell>
                    <TableCell className="pl-6 pr-6 text-sm text-muted-foreground">
                      {item.rejection_reason || item.remarks || 'No remarks recorded'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No quality inspection details.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Supporting Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {grnData.attachments && grnData.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {grnData.attachments.map((file: any, index: number) => {
                const name = typeof file === 'string' ? file.split('/').pop() : file.name || `Document-${index + 1}`;
                const url = typeof file === 'string' ? file : file.url;
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate font-medium">{name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(url, '_blank')} title="Download / Preview">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No attachments available for this GRN.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
