import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { 
  Truck, ArrowLeftRight, Clock, CheckCircle, Search, Filter, Plus, FileText, CheckCircle2, TrendingUp, AlertTriangle, Play, Calendar, Building2, ArrowRight
} from 'lucide-react';
import { inventoryAPI } from '@/api/inventory';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface StockTransfer {
  id: string;
  fromLocation: string;
  toLocation: string;
  items: TransferItem[];
  requestedBy: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'in_transit' | 'received' | 'cancelled';
  approvedBy?: string;
  transferDate?: string;
  reason?: string;
}

interface TransferItem {
  itemId: string;
  itemName: string;
  quantity: number;
  uom: string;
}

const locations = ['Central Store', 'Tower A Store', 'Tower B Store', 'Tower C Store'];

const statusConfig = {
  pending: { label: 'Pending Approval', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  in_transit: { label: 'In Transit', variant: 'default' as const, icon: Truck },
  received: { label: 'Received', variant: 'default' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: Clock },
};

const mapStockTransfer = (t: any): StockTransfer => ({
  id: t.id,
  fromLocation: t.from_location,
  toLocation: t.to_location,
  items: (t.items || []).map((i: any) => ({
    itemId: i.item_id ?? i.itemId ?? '',
    itemName: i.item_name ?? i.itemName ?? '',
    quantity: i.quantity ?? 0,
    uom: i.uom ?? '',
  })),
  requestedBy: t.requested_by,
  requestedDate: t.requested_date,
  status: t.status,
  approvedBy: t.approved_by || '',
  transferDate: t.transfer_date || '',
});

export default function StockTransfer() {
  const { user } = useAuth();
  const canApprove = user?.role === 'super_admin' || 
    (user?.permissions && user.permissions['procurement:inventory_transfer']?.approve === true) || 
    ['store_keeper', 'site_manager', 'project_head'].includes(user?.role || '');

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const data = await inventoryAPI.getTransfers();
      setTransfers(data.map(mapStockTransfer));
    } catch (err) {
      console.error('Error fetching stock transfers:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await inventoryAPI.updateTransfer(id, {
        status,
        approved_by: 'Vikram Singh',
        transfer_date: status === 'in_transit' ? new Date().toISOString().split('T')[0] : undefined
      });
      toast({ title: 'Success', description: `Transfer status updated to ${status.replace('_', ' ')}` });
      fetchTransfers();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error updating transfer status', variant: 'destructive' });
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transfer.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transfer.toLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'received').length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stock Transfer</h1>
            <p className="text-muted-foreground">Transfer inventory between stores and locations</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stock Transfer Request</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage create stock transfer request details and actions here.</DialogDescription>
              </DialogHeader>
              <CreateTransferForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchTransfers} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transfers</p>
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
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('in_transit')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Truck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('received')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Transfers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer ID</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead></TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No transfers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((transfer) => {
                    const statusInfo = statusConfig[transfer.status] || { label: transfer.status, variant: 'default', icon: Clock };
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {transfer.fromLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {transfer.toLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {transfer.items.length} items
                          </Badge>
                        </TableCell>
                        <TableCell>{transfer.requestedBy}</TableCell>
                        <TableCell>{transfer.requestedDate}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transfer.status === 'pending' && canApprove && (
                              <>
                                <Button variant="default" size="sm" onClick={() => handleUpdateStatus(transfer.id, 'approved')}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(transfer.id, 'cancelled')}>Reject</Button>
                              </>
                            )}
                            {transfer.status === 'approved' && (
                              <Button variant="default" size="sm" onClick={() => handleUpdateStatus(transfer.id, 'in_transit')}>Start Transfer</Button>
                            )}
                            {transfer.status === 'in_transit' && (
                              <Button variant="default" size="sm" onClick={() => handleUpdateStatus(transfer.id, 'received')}>Confirm Receipt</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filteredTransfers.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredTransfers.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredTransfers.length / PAGE_SIZE), p + 1))}
                  onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

interface ItemCatalog {
  id: string;
  name: string;
  uom: string;
  currentStock: number;
}

function CreateTransferForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [itemsList, setItemsList] = useState<ItemCatalog[]>([]);
  const [fromLocation, setFromLocation] = useState('Central Store');
  const [toLocation, setToLocation] = useState('Tower A Store');
  const [reason, setReason] = useState('');
  const [formItems, setFormItems] = useState<Array<{
    id: string;
    itemId: string;
    itemName: string;
    quantity: number;
    uom: string;
  }>>([
    { id: '1', itemId: '', itemName: '', quantity: 1, uom: 'Nos' }
  ]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const items = await inventoryAPI.getItems();
        setItemsList(items.map((i: any) => ({
          id: i.id,
          name: i.name,
          uom: i.uom,
          currentStock: i.current_stock ?? 0,
        })));
      } catch (err) {
        console.error('Error fetching items catalog:', err);
      }
    };
    fetchCatalog();
  }, []);

  const addItem = () => {
    setFormItems([...formItems, { id: Date.now().toString(), itemId: '', itemName: '', quantity: 1, uom: 'Nos' }]);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const catalogItem = itemsList.find(i => i.id === itemId);
    if (!catalogItem) return;
    
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      itemId: catalogItem.id,
      itemName: catalogItem.name,
      uom: catalogItem.uom || 'Nos'
    };
    setFormItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...formItems];
    updated[index] = {
      ...updated[index],
      quantity: qty
    };
    setFormItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fromLocation === toLocation) {
      toast({
        title: 'Validation Error',
        description: 'Source and destination locations must be different.',
        variant: 'destructive',
      });
      return;
    }

    const filteredItems = formItems.filter(i => i.itemId !== '');
    if (filteredItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one valid item to transfer.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await inventoryAPI.createTransfer({
        id: `TRF-${Date.now()}`,
        from_location: fromLocation,
        to_location: toLocation,
        reason,
        requested_by: 'Vikram Singh',
        requested_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        items: filteredItems.map(({ itemId, itemName, quantity, uom }) => ({
          item_id: itemId,
          item_name: itemName,
          quantity,
          uom
        }))
      });
      toast({ title: 'Success', description: 'Transfer request submitted successfully' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit transfer request', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>From Location *</Label>
          <Select value={fromLocation} onValueChange={setFromLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>To Location *</Label>
          <Select value={toLocation} onValueChange={setToLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Items to Transfer</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-24">Quantity</TableHead>
              <TableHead className="w-24">UOM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formItems.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Select value={item.itemId} onValueChange={(val) => handleItemChange(index, val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsList.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} (Stock: {cat.currentStock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={(e) => handleQtyChange(index, parseInt(e.target.value, 10) || 1)} 
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{item.uom}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <Label>Reason for Transfer</Label>
        <Textarea 
          placeholder="Enter reason for this transfer..." 
          rows={2} 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Submit Request</Button>
      </div>
    </form>
  );
}
