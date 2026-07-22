import { useState, useEffect } from 'react';
import { ordersAPI } from '@/api/orders';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, Filter, Plus, Wrench, Clock, CheckCircle, XCircle,
  Eye, Edit, Building2, Calendar, DollarSign, AlertTriangle, Play
} from 'lucide-react';

interface WorkOrder {
  id: string;
  title: string;
  vendor: string;
  vendorId: string;
  category: string;
  tower: string;
  totalValue: number;
  paidValue: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  completionPercent: number;
  milestones: { name: string; percent: number; status: 'pending' | 'completed' }[];
  siteEngineer: string;
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
  in_progress: { label: 'In Progress', variant: 'default' as const, icon: Play },
  completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
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

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const data = await ordersAPI.getOrders();
      if (data) {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const mapped = list
          .map(mapOrder)
          .filter((o: any) => o.type === 'wo')
          .map((o: any) => ({
            id: o.id,
            title: `${o.category} Work - ${o.vendorName}`,
            vendor: o.vendorName,
            vendorId: o.vendorId,
            category: o.category,
            tower: o.tower,
            totalValue: Number(o.netValue),
            paidValue: o.status === 'completed' ? Number(o.netValue) : Number(o.netValue) * 0.4,
            startDate: o.startDate,
            endDate: o.endDate,
            status: o.status,
            completionPercent: o.status === 'completed' ? 100 : o.status === 'in_progress' ? 45 : 0,
            milestones: o.milestones || [],
            siteEngineer: 'Rajesh Kumar'
          }));
        setWorkOrders(mapped);
      }
    } catch (err) {
      console.error('Error fetching work orders:', err);
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workOrders.length,
    inProgress: workOrders.filter(o => o.status === 'in_progress').length,
    completed: workOrders.filter(o => o.status === 'completed').length,
    totalValue: workOrders.reduce((sum, o) => sum + o.totalValue, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Work Orders</h1>
            <p className="text-muted-foreground">Manage work orders and track project progress</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Work Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Play className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
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
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
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
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(0)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Tabs defaultValue="all" className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Work Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tower</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No work orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = statusConfig[order.status];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.title}</p>
                            <p className="text-xs text-muted-foreground">Engineer: {order.siteEngineer}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.vendor}</TableCell>
                        <TableCell>{order.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {order.tower}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">₹{order.totalValue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Paid: ₹{order.paidValue.toLocaleString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {order.startDate}
                            </div>
                            <p className="text-muted-foreground">to {order.endDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={order.completionPercent} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{order.completionPercent}%</p>
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

        {/* Milestone Cards for In-Progress Work Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Work Order Milestones</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workOrders.filter(o => o.status === 'in_progress').map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{order.title}</CardTitle>
                    <Badge variant="secondary">{order.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={milestone.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
                            {milestone.name}
                          </span>
                        </div>
                        <Badge variant={milestone.status === 'completed' ? 'default' : 'outline'}>
                          {milestone.percent}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
