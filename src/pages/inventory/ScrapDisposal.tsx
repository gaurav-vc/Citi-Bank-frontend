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
  FileText, Package, DollarSign, Clock, CheckCircle, Trash2, XCircle, Plus, AlertTriangle, Search
} from 'lucide-react';
import { inventoryAPI } from '@/api/inventory';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface ScrapItem {
  id: string;
  itemName: string;
  itemId: string;
  category: string;
  quantity: number;
  uom: string;
  estimatedValue: number;
  recoveredValue: number;
  reason: string;
  requestedBy: string;
  requestedDate: string;
  status: 'pending' | 'approved' | 'disposed' | 'rejected';
  disposalMethod?: string;
  disposalDate?: string;
  approvedBy?: string;
}

const statusConfig = {
  pending: { label: 'Pending Approval', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  disposed: { label: 'Disposed', variant: 'default' as const, icon: Trash2 },
  rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
};

const mapScrap = (s: any): ScrapItem => {
  const firstItem = (s.items && s.items[0]) || {};
  return {
    id: s.id,
    itemName: firstItem.item_name ?? firstItem.itemName ?? '',
    itemId: firstItem.item_id ?? firstItem.itemId ?? '',
    category: firstItem.category ?? '',
    quantity: firstItem.quantity ?? 0,
    uom: firstItem.uom ?? '',
    estimatedValue: typeof s.total_value === 'string' ? parseFloat(s.total_value) : (s.total_value ?? 0),
    recoveredValue: typeof s.recovered_value === 'string' ? parseFloat(s.recovered_value) : (s.recovered_value ?? 0),
    reason: firstItem.reason ?? '',
    requestedBy: firstItem.requested_by ?? 'Rajesh Kumar',
    requestedDate: s.created_at ? s.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    status: s.status,
    disposalMethod: firstItem.disposal_method ?? '',
    disposalDate: s.disposal_date || '',
    approvedBy: firstItem.approved_by ?? '',
  };
};

export default function ScrapDisposal() {
  const { user } = useAuth();
  const canApprove = user?.role === 'super_admin' || 
    (user?.permissions && user.permissions['procurement:inventory_disposal']?.approve === true) || 
    ['store_keeper', 'site_manager', 'project_head'].includes(user?.role || '');

  const [scrapItems, setScrapItems] = useState<ScrapItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScrapItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchScrap();
  }, []);

  const fetchScrap = async () => {
    try {
      const data = await inventoryAPI.getScraps();
      setScrapItems(data.map(mapScrap));
    } catch (err) {
      console.error('Error fetching scrap items:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, recoveredValue?: number) => {
    try {
      await inventoryAPI.updateScrap(id, {
        status,
        recovered_value: recoveredValue,
        // approved_by: 'Vikram Singh',
        disposal_date: status === 'disposed' ? new Date().toISOString().split('T')[0] : undefined
      });
      toast({ title: 'Success', description: `Scrap disposal request ${status} successfully.` });
      fetchScrap();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const filteredItems = scrapItems.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: scrapItems.length,
    pending: scrapItems.filter(i => i.status === 'pending').length,
    disposed: scrapItems.filter(i => i.status === 'disposed').length,
    totalValue: scrapItems.reduce((sum, i) => sum + i.estimatedValue, 0),
    recoveredValue: scrapItems.reduce((sum, i) => sum + i.recoveredValue, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Scrap / Disposal</h1>
            <p className="text-muted-foreground">Manage scrap items and disposal requests</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Disposal Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Disposal Request</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage create disposal request details and actions here.</DialogDescription>
              </DialogHeader>
              <CreateDisposalForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchScrap} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Trash2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
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
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('disposed')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disposed</p>
                  <p className="text-2xl font-bold">{stats.disposed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Write-off Value</p>
                  <p className="text-2xl font-bold">₹{(stats.totalValue / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recovered</p>
                  <p className="text-2xl font-bold">₹{(stats.recoveredValue / 1000).toFixed(0)}K</p>
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
              placeholder="Search scrap items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Scrap Items Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead>Recovered</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No scrap items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((item) => {
                    const statusInfo = statusConfig[item.status];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-xs text-muted-foreground">{item.itemId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.quantity} {item.uom}</TableCell>
                        <TableCell className="text-destructive">₹{item.estimatedValue.toLocaleString()}</TableCell>
                        <TableCell className="text-success">
                          {item.recoveredValue > 0 ? `₹${item.recoveredValue.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.reason}</TableCell>
                        <TableCell>
                          <div>
                            <p>{item.requestedBy}</p>
                            <p className="text-xs text-muted-foreground">{item.requestedDate}</p>
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
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>View</Button>
                            {item.status === 'pending' && canApprove && (
                              <>
                                <Button variant="default" size="sm" onClick={() => handleUpdateStatus(item.id, 'approved')}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(item.id, 'rejected')}>Reject</Button>
                              </>
                            )}
                            {item.status === 'approved' && (
                              <Button variant="default" size="sm" onClick={() => handleUpdateStatus(item.id, 'disposed', item.estimatedValue * 0.32)}>Mark Disposed</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filteredItems.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredItems.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredItems.length / PAGE_SIZE), p + 1))}
                  onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Scrap Disposal Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">View details of the scrap disposal request.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Request ID</p>
                  <p className="font-medium">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedItem.status]?.variant || 'default'}>
                    {statusConfig[selectedItem.status]?.label || selectedItem.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Item Name</p>
                  <p className="font-medium">{selectedItem.itemName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{selectedItem.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedItem.quantity} {selectedItem.uom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Value</p>
                  <p className="font-medium text-destructive">₹{selectedItem.estimatedValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recovered Value</p>
                  <p className="font-medium text-success">{selectedItem.recoveredValue > 0 ? `₹${selectedItem.recoveredValue.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <p className="font-medium">{selectedItem.requestedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disposal Method</p>
                  <p className="font-medium">{selectedItem.disposalMethod || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disposal Date</p>
                  <p className="font-medium">{selectedItem.disposalDate || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="font-medium">{selectedItem.reason}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function CreateDisposalForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState('Nos');
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [reason, setReason] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('scrap-dealer');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const items = await inventoryAPI.getItems();
        setItemsList(items);
        if (items.length > 0) {
          setItemId(items[0].id);
          setItemName(items[0].name);
          setCategory(items[0].category || 'Electrical');
          setUom(items[0].uom || 'Nos');
        }
      } catch (err) {
        console.error('Error fetching items catalog:', err);
      }
    };
    fetchCatalog();
  }, []);

  const handleItemChange = (val: string) => {
    const itm = itemsList.find(i => i.id === val);
    if (itm) {
      setItemId(itm.id);
      setItemName(itm.name);
      setCategory(itm.category || 'Electrical');
      setUom(itm.uom || 'Nos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      toast({
        title: 'Validation Error',
        description: 'Please select an item to dispose.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await inventoryAPI.createScrap({
        id: `SCP-${Date.now()}`,
        total_value: estimatedValue,
        disposal_date: new Date().toISOString().split('T')[0],
        buyer: disposalMethod === 'scrap-dealer' ? 'Scrap Vendor Ltd' : 'Recycling Partner',
        status: 'pending',
        gate_pass_no: `GP-${Date.now().toString().slice(-6)}`,
        recovered_value: 0,
        items: [{
          item_id: itemId,
          item_name: itemName,
          category,
          quantity,
          uom,
          reason,
          disposal_method: disposalMethod,
          requested_by: 'Vikram Singh',
        }]
      });
      toast({ title: 'Success', description: 'Disposal request submitted successfully' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit disposal request', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Item *</Label>
          <Select value={itemId} onValueChange={handleItemChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {itemsList.map((itm, index) => (
                <SelectItem key={itm.id || `item-${index}`} value={itm.id || `item-${index}`}>
                  {itm.name} (Stock: {itm.current_stock ?? 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
              <SelectItem value="Safety">Safety</SelectItem>
              <SelectItem value="Furniture">Furniture</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input 
            type="number" 
            min="1" 
            placeholder="Enter quantity" 
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>UOM</Label>
          <Select value={uom} onValueChange={setUom}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nos">Nos</SelectItem>
              <SelectItem value="Kg">Kg</SelectItem>
              <SelectItem value="Ltr">Ltr</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estimated Value (₹)</Label>
          <Input 
            type="number" 
            placeholder="Enter value" 
            value={estimatedValue}
            onChange={e => setEstimatedValue(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Reason for Disposal *</Label>
        <Textarea 
          placeholder="Explain why this item needs to be disposed..." 
          rows={3} 
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Proposed Disposal Method</Label>
        <Select value={disposalMethod} onValueChange={setDisposalMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scrap-dealer">Sell to Scrap Dealer</SelectItem>
            <SelectItem value="e-waste">E-waste Recycler</SelectItem>
            <SelectItem value="donate">Donate</SelectItem>
            <SelectItem value="destroy">Destroy/Discard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Submit Request</Button>
      </div>
    </form>
  );
}
