import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
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
  ArrowUpRight, FileText, Plus, Package, Clock, Search, User, Building2
} from 'lucide-react';
import { inventoryAPI } from '@/api/inventory';

interface MaterialIssue {
  id: string;
  issueDate: string;
  issuedTo: string;
  department: string;
  tower: string;
  floor: string;
  workOrderRef?: string;
  items: IssueItem[];
  status: 'issued' | 'partially_returned' | 'fully_returned';
  issuedBy: string;
  purpose: string;
}

interface IssueItem {
  itemId: string;
  itemName: string;
  issuedQty: number;
  returnedQty: number;
  uom: string;
}

const statusConfig = {
  issued: { label: 'Issued', variant: 'default' as const },
  partially_returned: { label: 'Partially Returned', variant: 'secondary' as const },
  fully_returned: { label: 'Fully Returned', variant: 'default' as const },
};

const mapIssue = (issue: any): MaterialIssue => ({
  id: issue.id,
  issueDate: issue.issued_date,
  issuedTo: issue.issued_to,
  department: issue.department || '',
  tower: issue.tower || '',
  floor: issue.floor || '',
  workOrderRef: issue.work_order_ref || '',
  items: (issue.items || []).map((item: any) => ({
    itemId: item.item_id ?? item.itemId ?? '',
    itemName: item.item_name ?? item.itemName ?? '',
    issuedQty: item.issued_qty ?? item.issuedQty ?? 0,
    returnedQty: item.returned_qty ?? item.returnedQty ?? 0,
    uom: item.uom ?? '',
  })),
  status: issue.status,
  issuedBy: issue.issued_by || '',
  purpose: issue.purpose || '',
});

export default function IssueToSite() {
  const [issues, setIssues] = useState<MaterialIssue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const data = await inventoryAPI.getIssues();
      setIssues(data.map(mapIssue));
    } catch (err) {
      console.error('Error fetching material issues:', err);
    }
  };

  const handleReturn = async (issue: MaterialIssue) => {
    try {
      const updatedItems = issue.items.map(item => ({
        item_id: item.itemId,
        item_name: item.itemName,
        issued_qty: item.issuedQty,
        returned_qty: item.issuedQty,
        uom: item.uom,
      }));
      
      await inventoryAPI.updateIssue(issue.id, {
        status: 'fully_returned',
        items: updatedItems
      });
      toast({ title: 'Success', description: 'Materials marked as returned' });
      fetchIssues();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error updating return status', variant: 'destructive' });
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.issuedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: issues.length,
    issued: issues.filter(i => i.status === 'issued').length,
    partialReturn: issues.filter(i => i.status === 'partially_returned').length,
    totalItems: issues.reduce((sum, i) => sum + i.items.reduce((s, item) => s + item.issuedQty, 0), 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Issue to Site</h1>
            <p className="text-muted-foreground">Issue materials to site personnel and track returns</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Issue Material to Site</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage issue material to site details and actions here.</DialogDescription>
              </DialogHeader>
              <CreateIssueForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchIssues} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <ArrowUpRight className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('issued')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Package className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currently Issued</p>
                  <p className="text-2xl font-bold">{stats.issued}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('partially_returned')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partial Returns</p>
                  <p className="text-2xl font-bold">{stats.partialReturn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items Issued (MTD)</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
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
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Issues Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Issued To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No issues found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => {
                    const statusInfo = statusConfig[issue.status] || { label: issue.status, variant: 'default' };
                    const totalIssued = issue.items.reduce((sum, i) => sum + i.issuedQty, 0);
                    const totalReturned = issue.items.reduce((sum, i) => sum + i.returnedQty, 0);
                    
                    return (
                      <TableRow key={issue.id}>
                        <TableCell className="font-mono text-sm">{issue.id}</TableCell>
                        <TableCell>{issue.issueDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{issue.issuedTo}</p>
                              <p className="text-xs text-muted-foreground">{issue.department}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <p>{issue.tower}</p>
                              <p className="text-xs text-muted-foreground">{issue.floor}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {issue.workOrderRef ? (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              {issue.workOrderRef}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {issue.items.length} items ({totalReturned}/{totalIssued} returned)
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{issue.purpose}</TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {issue.status !== 'fully_returned' && (
                              <Button variant="default" size="sm" onClick={() => handleReturn(issue)}>Return</Button>
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

function CreateIssueForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [itemsList, setItemsList] = useState<ItemCatalog[]>([]);
  const [issuedTo, setIssuedTo] = useState('Rajesh Kumar');
  const [workOrderRef, setWorkOrderRef] = useState('');
  const [tower, setTower] = useState('Tower A');
  const [floor, setFloor] = useState('');
  const [purpose, setPurpose] = useState('');

  const [formItems, setFormItems] = useState<Array<{
    id: string;
    itemId: string;
    itemName: string;
    issuedQty: number;
    returnedQty: number;
    uom: string;
  }>>([
    { id: '1', itemId: '', itemName: '', issuedQty: 1, returnedQty: 0, uom: 'Nos' }
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
    setFormItems([...formItems, { id: Date.now().toString(), itemId: '', itemName: '', issuedQty: 1, returnedQty: 0, uom: 'Nos' }]);
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
      issuedQty: qty
    };
    setFormItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine department based on selected person name
    let department = 'Maintenance';
    if (issuedTo === 'Priya Sharma') department = 'Housekeeping';
    else if (issuedTo === 'Suresh Reddy') department = 'HVAC';
    else if (issuedTo === 'Meera Nair') department = 'Security';

    if (!issuedTo || !tower || !purpose) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    
    try {
      await inventoryAPI.createIssue({
        id: `MI-${Date.now()}`,
        issued_to: issuedTo,
        issued_date: new Date().toISOString().split('T')[0],
        department,
        tower,
        floor,
        work_order_ref: workOrderRef,
        purpose,
        status: 'issued',
        issued_by: 'Amit Patel',
        items: formItems.map(item => {
          const cat = itemsList.find(i => i.id === item.itemId);
          return {
            item_id: item.itemId,
            item_name: cat?.name || '',
            issued_qty: item.issuedQty,
            returned_qty: 0,
            uom: cat?.uom || ''
          };
        })
      });
      toast({ title: 'Success', description: 'Material issue created successfully' });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to create material issue', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Issue To *</Label>
          <Select value={issuedTo} onValueChange={setIssuedTo}>
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rajesh Kumar">Rajesh Kumar - Maintenance</SelectItem>
              <SelectItem value="Priya Sharma">Priya Sharma - Housekeeping</SelectItem>
              <SelectItem value="Suresh Reddy">Suresh Reddy - HVAC</SelectItem>
              <SelectItem value="Meera Nair">Meera Nair - Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Work Order Reference (Optional)</Label>
          <Select value={workOrderRef} onValueChange={setWorkOrderRef}>
            <SelectTrigger>
              <SelectValue placeholder="Select work order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WO-001">WO-001 - Lobby Renovation</SelectItem>
              <SelectItem value="WO-002">WO-002 - Electrical Panel Upgrade</SelectItem>
              <SelectItem value="WO-003">WO-003 - Waterproofing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tower *</Label>
          <Select value={tower} onValueChange={setTower}>
            <SelectTrigger>
              <SelectValue placeholder="Select tower" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Towers">All Towers</SelectItem>
              <SelectItem value="Tower A">Tower A</SelectItem>
              <SelectItem value="Tower B">Tower B</SelectItem>
              <SelectItem value="Tower C">Tower C</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Floor</Label>
          <Select value={floor} onValueChange={setFloor}>
            <SelectTrigger>
              <SelectValue placeholder="Select floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Floors">All Floors</SelectItem>
              <SelectItem value="Basement">Basement</SelectItem>
              <SelectItem value="Ground Floor">Ground Floor</SelectItem>
              <SelectItem value="1st Floor">1st Floor</SelectItem>
              <SelectItem value="2nd Floor">2nd Floor</SelectItem>
              <SelectItem value="3rd Floor">3rd Floor</SelectItem>
              <SelectItem value="4th Floor">4th Floor</SelectItem>
              <SelectItem value="5th Floor">5th Floor</SelectItem>
              <SelectItem value="6th Floor">6th Floor</SelectItem>
              <SelectItem value="7th Floor">7th Floor</SelectItem>
              <SelectItem value="8th Floor">8th Floor</SelectItem>
              <SelectItem value="9th Floor">9th Floor</SelectItem>
              <SelectItem value="10th Floor">10th Floor</SelectItem>
              <SelectItem value="Roof">Roof</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Items to Issue</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-24">Available</TableHead>
              <TableHead className="w-24">Issue Qty</TableHead>
              <TableHead className="w-24">UOM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formItems.map((item, index) => {
              const catalogItem = itemsList.find(i => i.id === item.itemId);
              const availableQty = catalogItem ? catalogItem.currentStock : '-';
              
              return (
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
                  <TableCell className="text-muted-foreground">{availableQty}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="1" 
                      value={item.issuedQty} 
                      onChange={(e) => handleQtyChange(index, parseInt(e.target.value, 10) || 1)} 
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{item.uom}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-2">
        <Label>Purpose *</Label>
        <Textarea 
          placeholder="Describe the purpose of this material issue..." 
          rows={2} 
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Issue Material</Button>
      </div>
    </form>
  );
}
