import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Download,
  Upload,
  Plus,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Trash2,
  Eye,
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { AddStockModal } from './AddStockModal';
import { StockHistoryModal } from './StockHistoryModal';
import { inventoryAPI } from '@/api/inventory';
export default function StockLedger() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleOpenHistory = (itemId: string, itemName: string) => {
    setSelectedItemId(itemId);
    setSelectedItemName(itemName);
    setIsHistoryModalOpen(true);
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const data = await inventoryAPI.getStockLedger();
      setItems(data);
    } catch (err) {
      console.error('Error fetching stock:', err);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Stock ledger is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inventory/inventory/export/?format=xlsx`,
        `inventory_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Stock ledger exported successfully.',
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
      description: 'Processing stock level updates.',
    });

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inventory/inventory/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Import Successful',
          description: data.message || 'Successfully updated stock levels',
          variant: 'default',
        });
        fetchStock();
      } else {
        toast({
          title: 'Import Failed',
          description: data.error || (data.errors ? data.errors.join(', ') : 'Failed to import stock updates'),
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    
    if (stockFilter === 'low') {
      return matchesSearch && matchesCategory && item.currentStock <= item.minStockLevel;
    } else if (stockFilter === 'reorder') {
      return matchesSearch && matchesCategory && item.currentStock <= item.reorderLevel && item.currentStock > item.minStockLevel;
    } else if (stockFilter === 'adequate') {
      return matchesSearch && matchesCategory && item.currentStock > item.reorderLevel;
    }
    return matchesSearch && matchesCategory;
  });

  const stockStats = {
    totalItems: items.length,
    lowStock: items.filter((i) => i.currentStock <= i.minStockLevel).length,
    reorderNeeded: items.filter((i) => i.currentStock <= i.reorderLevel).length,
    totalValue: items.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0),
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStockStatus = (item: typeof items[0]) => {
    if (item.currentStock <= item.minStockLevel) {
      return { label: 'Critical', color: 'destructive' as const };
    } else if (item.currentStock <= item.reorderLevel) {
      return { label: 'Reorder', color: 'warning' as const };
    }
    return { label: 'Adequate', color: 'success' as const };
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Stock Ledger</h1>
            <p className="text-muted-foreground">
              View and manage inventory across all stores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="stock-import-input"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('stock-import-input')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            {user && ['store_keeper', 'super_admin'].includes(user.role) && (
              <Button onClick={() => setIsAddStockModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStockFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{stockStats.totalItems}</p>
                </div>
                <Package className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => setStockFilter('low')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-destructive">{stockStats.lowStock}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-warning/50 cursor-pointer hover:bg-warning/10 transition-colors" onClick={() => setStockFilter('reorder')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reorder Needed</p>
                  <p className="text-2xl font-bold text-warning">{stockStats.reorderNeeded}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStockFilter('adequate')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stockStats.totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <Package className="h-6 w-6" />
            <span>GRN Entry</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <ArrowRightLeft className="h-6 w-6" />
            <span>Stock Transfer</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <TrendingDown className="h-6 w-6" />
            <span>Issue to Site</span>
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <Trash2 className="h-6 w-6" />
            <span>Scrap/Disposal</span>
          </Button>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Inventory Items</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Stock Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="reorder">Reorder</SelectItem>
                    <SelectItem value="adequate">Adequate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Current Stock</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Stock Level</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item);
                    const stockPercentage = (item.currentStock / (item.reorderLevel * 2)) * 100;

                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium hover:text-primary hover:underline cursor-pointer" onClick={() => handleOpenHistory(item.id, item.name)}>{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">{item.category}</td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-medium">{item.currentStock}</span>
                          <span className="text-muted-foreground"> {item.uom}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-32 mx-auto">
                            <Progress 
                              value={Math.min(stockPercentage, 100)} 
                              className={`h-2 ${status.color === 'destructive' ? '[&>div]:bg-destructive' : status.color === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Min: {item.minStockLevel}</span>
                              <span>Reorder: {item.reorderLevel}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {formatCurrency(item.currentStock * item.unitPrice)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={status.color === 'success' ? 'outline' : status.color === 'warning' ? 'secondary' : 'destructive'}
                            className={status.color === 'success' ? 'border-success text-success' : status.color === 'warning' ? 'bg-warning/10 text-warning border-warning' : ''}
                          >
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenHistory(item.id, item.name)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        {stockStats.lowStock > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {items
                  .filter((i) => i.currentStock <= i.minStockLevel)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.currentStock} {item.uom} | Min: {item.minStockLevel}
                        </p>
                      </div>
                      <Button size="sm" variant="destructive">
                        Create Indent
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        items={items}
        onSuccess={fetchStock}
      />
      <StockHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setSelectedItemId(null);
          setSelectedItemName(null);
        }}
        itemId={selectedItemId}
        itemName={selectedItemName}
      />
    </MainLayout>
  );
}
