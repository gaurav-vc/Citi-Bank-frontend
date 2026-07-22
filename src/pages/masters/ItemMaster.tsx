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
import { 
  Plus, Search, Filter, Package, Wrench, Droplets, AlertTriangle,
  Edit, Trash2, Download, Upload
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  id: string;
  name: string;
  type: 'spare' | 'consumable' | 'service';
  category: string;
  uom: string;
  minStockLevel: number;
  reorderLevel: number;
  currentStock: number;
  preferredVendor: string;
  unitPrice: number;
  lastPurchaseDate: string;
  status: 'active' | 'inactive';
}

const categories = ['Electrical', 'HVAC', 'Plumbing', 'Housekeeping', 'Security', 'Civil', 'Landscaping'];
const uomOptions = ['Nos', 'Ltr', 'Kg', 'Mtr', 'Sq.Mtr', 'Job', 'Set', 'Box'];

const typeConfig = {
  spare: { label: 'Spare Part', icon: Wrench, color: 'bg-blue-500' },
  consumable: { label: 'Consumable', icon: Droplets, color: 'bg-green-500' },
  service: { label: 'Service', icon: Package, color: 'bg-purple-500' },
};

const mapItem = (i: any): Item => ({
  id: i.id,
  name: i.name,
  type: i.type,
  category: i.category,
  uom: i.uom,
  minStockLevel: i.min_stock_level,
  reorderLevel: i.reorder_level,
  currentStock: i.current_stock,
  preferredVendor: i.preferred_vendor || '',
  unitPrice: typeof i.unit_price === 'string' ? parseFloat(i.unit_price) : i.unit_price,
  lastPurchaseDate: '',
  status: 'active'
});

export default function ItemMaster() {
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/items/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        setItems(data.map(mapItem));
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Items catalog is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/items/export/?format=xlsx`,
        `items_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Items catalog exported successfully.',
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
      title: 'Importing...',
      description: 'Please wait while the file is being processed.',
    });

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/items/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Import Successful',
          description: data.message || `Successfully imported items`,
          variant: 'default',
        });
        fetchItems();
      } else {
        toast({
          title: 'Import Failed',
          description: data.error || (data.errors ? data.errors.join(', ') : 'Failed to import items'),
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'An unexpected error occurred during import',
        variant: 'destructive',
      });
    } finally {
      e.target.value = '';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const stats = {
    total: items.length,
    spares: items.filter(i => i.type === 'spare').length,
    consumables: items.filter(i => i.type === 'consumable').length,
    services: items.filter(i => i.type === 'service').length,
    lowStock: items.filter(i => i.type !== 'service' && i.currentStock <= i.minStockLevel).length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Item/Service Master</h1>
            <p className="text-muted-foreground">Manage spare parts, consumables, and services catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="item-import-input"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => document.getElementById('item-import-input')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Item/Service</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage add new item/service details and actions here.</DialogDescription>
                </DialogHeader>
                <CreateItemForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchItems} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Wrench className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spare Parts</p>
                  <p className="text-2xl font-bold">{stats.spares}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Droplets className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consumables</p>
                  <p className="text-2xl font-bold">{stats.consumables}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Package className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-2xl font-bold">{stats.services}</p>
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
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="spares">Spare Parts</TabsTrigger>
              <TabsTrigger value="consumables">Consumables</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <ItemTable items={filteredItems} />
          </TabsContent>
          <TabsContent value="spares">
            <ItemTable items={filteredItems.filter(i => i.type === 'spare')} />
          </TabsContent>
          <TabsContent value="consumables">
            <ItemTable items={filteredItems.filter(i => i.type === 'consumable')} />
          </TabsContent>
          <TabsContent value="services">
            <ItemTable items={filteredItems.filter(i => i.type === 'service')} />
          </TabsContent>
          <TabsContent value="low-stock">
            <ItemTable items={filteredItems.filter(i => i.type !== 'service' && i.currentStock <= i.minStockLevel)} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function ItemTable({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Level</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Preferred Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const typeInfo = typeConfig[item.type] ?? {
                  label: item.type || 'Unknown',
                  icon: Package,
                  color: 'bg-gray-500',
                };
                const TypeIcon = typeInfo.icon;
                const isLowStock = item.type !== 'service' && item.currentStock <= item.minStockLevel;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <TypeIcon className="h-3 w-3" />
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell>
                      <span className={isLowStock ? 'text-destructive font-semibold' : ''}>
                        {item.type === 'service' ? '-' : item.currentStock}
                        {isLowStock && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                      </span>
                    </TableCell>
                    <TableCell>{item.type === 'service' ? '-' : item.minStockLevel}</TableCell>
                    <TableCell className="font-semibold">₹{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{item.preferredVendor}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

function CreateItemForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [itemType, setItemType] = useState<string>('spare');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electrical');
  const [uom, setUom] = useState('Nos');
  const [minStock, setMinStock] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vendor, setVendor] = useState('PowerGrid Solutions');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('campusspend_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const body = {
      id: `ITM-${Date.now()}`,
      name,
      type: itemType,
      category,
      uom,
      min_stock_level: minStock,
      reorder_level: reorderLevel,
      current_stock: 0,
      preferred_vendor: vendor,
      unit_price: unitPrice
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/items/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Item created successfully' });
        onSuccess();
        onClose();
      } else {
        toast({ title: 'Error', description: 'Failed to create item', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error creating item', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name</Label>
          <Input id="name" placeholder="Enter item name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Item Type</Label>
          <Select value={itemType} onValueChange={setItemType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spare">Spare Part</SelectItem>
              <SelectItem value="consumable">Consumable</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
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
          <Label htmlFor="uom">Unit of Measure</Label>
          <Select value={uom} onValueChange={setUom}>
            <SelectTrigger>
              <SelectValue placeholder="Select UOM" />
            </SelectTrigger>
            <SelectContent>
              {uomOptions.map(u => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {itemType !== 'service' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minStock">Minimum Stock Level</Label>
            <Input id="minStock" type="number" placeholder="Enter minimum stock" value={minStock} onChange={e => setMinStock(Number(e.target.value))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderLevel">Reorder Level</Label>
            <Input id="reorderLevel" type="number" placeholder="Enter reorder level" value={reorderLevel} onChange={e => setReorderLevel(Number(e.target.value))} required />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price (₹)</Label>
          <Input id="unitPrice" type="number" placeholder="Enter unit price" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendor">Preferred Vendor</Label>
          <Select value={vendor} onValueChange={setVendor}>
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PowerGrid Solutions">PowerGrid Solutions</SelectItem>
              <SelectItem value="CoolAir Solutions">CoolAir Solutions</SelectItem>
              <SelectItem value="CleanPro Services">CleanPro Services</SelectItem>
              <SelectItem value="AquaFix Solutions">AquaFix Solutions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Add Item</Button>
      </div>
    </form>
  );
}
