import { useState, useEffect } from 'react';
import { ordersAPI } from '@/api/orders';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Filter, Plus, Calendar, CheckCircle, XCircle, Clock,
  Eye, Edit, RefreshCw, AlertTriangle, DollarSign, Building2
} from 'lucide-react';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface AMCOrder {
  id: string;
  title: string;
  vendor: string;
  vendorId: string;
  category: string;
  tower: string;
  annualValue: number;
  billedValue: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed';
  slaCompliance: number;
  lastServiceDate: string;
  nextServiceDate: string;
  servicesCompleted: number;
  totalServices: number;
}

const statusConfig = {
  active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
  expiring_soon: { label: 'Expiring Soon', variant: 'secondary' as const, icon: Clock },
  expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle },
  renewed: { label: 'Renewed', variant: 'default' as const, icon: RefreshCw },
};

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
});

export default function AMCOrders() {
  const [amcOrders, setAmcOrders] = useState<AMCOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    fetchAMCOrders();
  }, []);

  const fetchAMCOrders = async () => {
    try {
      const data = await ordersAPI.getOrders();
      if (data) {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const mapped = list
          .map(mapOrder)
          .filter((o: any) => o.type === 'amc')
          .map((o: any) => ({
            id: o.id,
            title: `${o.category} Comprehensive AMC`,
            vendor: o.vendorName,
            vendorId: o.vendorId,
            category: o.category,
            tower: o.tower,
            annualValue: Number(o.netValue),
            billedValue: Number(o.netValue) * 0.25,
            billingCycle: 'quarterly',
            startDate: o.startDate,
            endDate: o.endDate,
            status: o.status === 'active' || o.status === 'expiring_soon' || o.status === 'expired' || o.status === 'renewed' ? o.status : 'active',
            slaCompliance: 96,
            lastServiceDate: '2024-01-15',
            nextServiceDate: '2024-02-15',
            servicesCompleted: 2,
            totalServices: 12
          }));
        setAmcOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching AMC orders:', err);
    }
  };

  const filteredOrders = amcOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: amcOrders.length,
    active: amcOrders.filter(o => o.status === 'active').length,
    expiringSoon: amcOrders.filter(o => o.status === 'expiring_soon').length,
    totalValue: amcOrders.filter(o => o.status === 'active' || o.status === 'expiring_soon').reduce((sum, o) => sum + o.annualValue, 0),
    avgCompliance: amcOrders.length > 0 ? Math.round(amcOrders.reduce((sum, o) => sum + o.slaCompliance, 0) / amcOrders.length) : 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">AMC Orders</h1>
            <p className="text-muted-foreground">Manage annual maintenance contracts and track service compliance</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create AMC Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total AMCs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter('active')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter('expiring_soon')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiring Soon</p>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Value</p>
                  <p className="text-2xl font-bold">₹{(stats.totalValue / 1000000).toFixed(2)}M</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg SLA Compliance</p>
                  <p className="text-2xl font-bold">{stats.avgCompliance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search AMC orders..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AMC Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>AMC ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Annual Value</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>SLA Compliance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No AMC orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((order) => {
                    const statusInfo = statusConfig[order.status];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {order.tower}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{order.vendor}</TableCell>
                        <TableCell>{order.category}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">₹{order.annualValue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              Billed: ₹{order.billedValue.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{order.billingCycle}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{order.startDate}</p>
                            <p className="text-muted-foreground">to {order.endDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{order.servicesCompleted}/{order.totalServices}</p>
                            <p className="text-xs text-muted-foreground">Next: {order.nextServiceDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress 
                              value={order.slaCompliance} 
                              className={`h-2 ${order.slaCompliance >= 95 ? 'bg-success/20' : order.slaCompliance >= 90 ? 'bg-warning/20' : 'bg-destructive/20'}`}
                            />
                            <p className={`text-xs mt-1 ${
                              order.slaCompliance >= 95 ? 'text-success' : 
                              order.slaCompliance >= 90 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {order.slaCompliance}%
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
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {(order.status === 'expiring_soon' || order.status === 'expired') && (
                              <Button variant="default" size="sm">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renew
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {filteredOrders.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredOrders.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredOrders.length / PAGE_SIZE), p + 1))}
                  onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Calendar Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {amcOrders
                .filter(o => o.status === 'active' && o.nextServiceDate !== '-')
                .slice(0, 3)
                .map(order => (
                  <Card key={order.id} className="bg-muted/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.title}</p>
                          <p className="text-sm text-muted-foreground">{order.vendor}</p>
                        </div>
                        <Badge variant="outline">{order.category}</Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Next Service: <strong>{order.nextServiceDate}</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
