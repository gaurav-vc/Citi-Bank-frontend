import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Download, FileText, Calendar, TrendingUp, DollarSign, Package,
  Users, Building2, ShoppingCart, Wrench, Filter
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';

const initialSpendByCategory: any[] = [];

const initialMonthlySpend: any[] = [];

const initialVendorPerformance: any[] = [];

const initialTowerWiseSpend: any[] = [];

const initialInventoryTrend: any[] = [];

const initialBudgetSummary = {
  totalBudget: 0,
  actualSpend: 0,
  remainingBudget: 0,
  overPercent: 0
};

const initialInventorySummary = {
  currentInventoryValue: 0,
  totalSkus: 0,
  lowStockItems: 0,
  deadStockItems: 0
};

const reportTypes = [
  { id: 'spend', name: 'Spend Analysis', icon: DollarSign, description: 'Category-wise and tower-wise spend breakdown' },
  { id: 'vendor', name: 'Vendor Performance', icon: Users, description: 'SLA compliance, delivery, and quality scores' },
  { id: 'inventory', name: 'Inventory Report', icon: Package, description: 'Stock levels, movements, and valuations' },
  { id: 'po', name: 'PO/WO Report', icon: ShoppingCart, description: 'Order status, pending deliveries, completions' },
  { id: 'amc', name: 'AMC Compliance', icon: Wrench, description: 'Service schedules, SLA tracking, renewals' },
  { id: 'budget', name: 'Budget vs Actual', icon: TrendingUp, description: 'Monthly budget utilization analysis' },
];

const processReportsCategorySpend = (rawData: any[]) => {
  if (!Array.isArray(rawData)) return [];
  const normalizationMap: Record<string, string> = {
    'hvac': 'HVAC',
    'hvac ': 'HVAC',
    'Hvac': 'HVAC',
    'HVAC': 'HVAC',
    'electrical': 'Electrical',
    'electrical ': 'Electrical',
    'Electrical': 'Electrical',
    'housekeeping': 'Housekeeping',
    'Housekeeping': 'Housekeeping',
    'security': 'Security',
    'Security': 'Security',
    'others': 'Others',
    'Others': 'Others',
  };
  
  const aggregated: Record<string, { value: number; color?: string }> = {};
  rawData.forEach(item => {
    const rawName = item.name || '';
    let normName = rawName.trim();
    if (normalizationMap[normName]) {
      normName = normalizationMap[normName];
    } else if (normName.toLowerCase() === 'hvac') {
      normName = 'HVAC';
    } else if (normName.toLowerCase() === 'electrical') {
      normName = 'Electrical';
    } else {
      normName = normName.charAt(0).toUpperCase() + normName.slice(1);
    }
    
    const val = Number(item.value) || 0;
    if (val > 0) {
      if (!aggregated[normName]) {
        aggregated[normName] = { value: 0, color: item.color };
      }
      aggregated[normName].value += val;
    }
  });
  
  const total = Object.values(aggregated).reduce((sum, item) => sum + item.value, 0);

  return Object.keys(aggregated)
    .filter(name => total === 0 || (aggregated[name].value / total) >= 0.01)
    .map(name => ({
      name,
      value: aggregated[name].value,
      color: aggregated[name].color
    }));
};

export default function Reports() {
  const { token } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-fy');
  const [selectedTower, setSelectedTower] = useState('all');

  const [spendByCategory, setSpendByCategory] = useState<any[]>(initialSpendByCategory);
  const [monthlySpend, setMonthlySpend] = useState<any[]>(initialMonthlySpend);
  const [vendorPerformance, setVendorPerformance] = useState<any[]>(initialVendorPerformance);
  const [towerWiseSpend, setTowerWiseSpend] = useState<any[]>(initialTowerWiseSpend);
  const [inventoryTrend, setInventoryTrend] = useState<any[]>(initialInventoryTrend);
  const [budgetSummary, setBudgetSummary] = useState(initialBudgetSummary);
  const [inventorySummary, setInventorySummary] = useState(initialInventorySummary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/reports/data/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch reports data');
        const data = await res.json();
        
        if (data.spendByCategory) setSpendByCategory(processReportsCategorySpend(data.spendByCategory));
        if (data.monthlySpend) setMonthlySpend(data.monthlySpend);
        if (data.vendorPerformance) setVendorPerformance(data.vendorPerformance);
        if (data.towerWiseSpend) setTowerWiseSpend(data.towerWiseSpend);
        if (data.inventoryTrend) setInventoryTrend(data.inventoryTrend);
        if (data.budgetSummary) setBudgetSummary(data.budgetSummary);
        if (data.inventorySummary) setInventorySummary(data.inventorySummary);
      } catch (err: any) {
        console.error('Reports data load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportReport = async (reportId: string, reportName: string) => {
    toast({
      title: 'Export Started',
      description: `${reportName} is being exported to Excel.`,
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/reports/export/${reportId}/?format=xlsx`,
        `report_${reportId}_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: `${reportName} exported successfully.`,
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const renderSpendCategoryLabel = (props: any) => {
    const { cx, cy, outerRadius, name, percent, index } = props;
    
    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius + 42;
    const total = spendByCategory.reduce((sum, d) => sum + d.value, 0) || 1;
    
    let currentAngle = 0;
    const positioned = spendByCategory.map((d, idx) => {
      const valPercent = d.value / total;
      const angleSpan = valPercent * 360;
      const itemMidAngle = currentAngle + angleSpan / 2;
      currentAngle += angleSpan;
      
      const cos = Math.cos(-RADIAN * itemMidAngle);
      const sin = Math.sin(-RADIAN * itemMidAngle);
      
      const sx = cx + outerRadius * cos;
      const sy = cy + outerRadius * sin;
      const mx = cx + (outerRadius + 15) * cos;
      const my = cy + (outerRadius + 15) * sin;
      const x = cx + labelRadius * cos;
      const y = cy + labelRadius * sin;
      
      return {
        index: idx,
        name: d.name,
        percent: valPercent,
        color: d.color,
        isLeft: cos < 0,
        x,
        y,
        sx, sy, mx, my
      };
    });
    
    const leftSide = positioned.filter(d => d.isLeft);
    const rightSide = positioned.filter(d => !d.isLeft);
    
    const resolveOverlap = (items: any[]) => {
      if (items.length <= 1) return;
      items.sort((a, b) => a.y - b.y);
      
      const minGap = 20;
      let adjusted = true;
      let limit = 0;
      
      while (adjusted && limit < 50) {
        adjusted = false;
        limit++;
        for (let i = 0; i < items.length - 1; i++) {
          const current = items[i];
          const next = items[i+1];
          if (next.y - current.y < minGap) {
            const overlap = minGap - (next.y - current.y);
            current.y -= overlap / 2;
            next.y += overlap / 2;
            adjusted = true;
          }
        }
      }
    };
    
    resolveOverlap(leftSide);
    resolveOverlap(rightSide);
    
    const allResolved = [...leftSide, ...rightSide];
    const item = allResolved.find(d => d.index === index);
    if (!item) return null;
    
    const { sx, sy, mx, my, x, y, isLeft, color } = item;
    const textAnchor = isLeft ? 'end' : 'start';
    
    // Position line to end 10px before the text starts
    const lineEndX = isLeft ? x + 10 : x - 10;
    
    return (
      <g>
        <line
          x1={sx}
          y1={sy}
          x2={lineEndX}
          y2={y}
          stroke={color || "#8884d8"}
          strokeWidth={1.5}
          opacity={0.8}
        />
        <text
          x={x}
          y={y}
          dy={4}
          textAnchor={textAnchor}
          fill="hsl(var(--foreground))"
          className="text-xs font-manrope font-semibold"
        >
          {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive reports and data analysis</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-fy">FY 2024-25</SelectItem>
                <SelectItem value="last-fy">FY 2023-24</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="qtd">Quarter to Date</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTower} onValueChange={setSelectedTower}>
              <SelectTrigger className="w-36">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tower" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Towers</SelectItem>
                <SelectItem value="a">Tower A</SelectItem>
                <SelectItem value="b">Tower B</SelectItem>
                <SelectItem value="c">Tower C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Report Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {reportTypes.map((report) => (
            <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{report.name}</p>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleExportReport(report.id, report.name)}>
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="spend" className="space-y-4">
          <TabsList>
            <TabsTrigger value="spend">Spend Analysis</TabsTrigger>
            <TabsTrigger value="vendor">Vendor Performance</TabsTrigger>
            <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="spend" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category-wise Spend */}
              <Card>
                <CardHeader>
                  <CardTitle>Spend by Category</CardTitle>
                  <CardDescription>Total spend distribution across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={spendByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderSpendCategoryLabel}
                        innerRadius={85}
                        outerRadius={115}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {spendByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tower-wise Spend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tower-wise Spend</CardTitle>
                  <CardDescription>Spend breakdown by tower and category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={towerWiseSpend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tower" />
                      <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="hvac" name="HVAC" fill="#3b82f6" />
                      <Bar dataKey="electrical" name="Electrical" fill="#10b981" />
                      <Bar dataKey="security" name="Security" fill="#f59e0b" />
                      <Bar dataKey="softServices" name="Soft Services" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Category-wise Spend Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {spendByCategory.map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">
                          {((category.value / spendByCategory.reduce((s, c) => s + c.value, 0)) * 100).toFixed(1)}%
                        </span>
                        <span className="font-semibold w-32 text-right">
                          ₹{(category.value / 100000).toFixed(1)}L
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Performance Scorecard</CardTitle>
                <CardDescription>SLA compliance, delivery, and quality metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendorPerformance.map((vendor) => (
                    <div key={vendor.vendor} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{vendor.vendor}</p>
                          <p className="text-sm text-muted-foreground">
                            Annual Spend: ₹{(vendor.spend / 100000).toFixed(0)}L
                          </p>
                        </div>
                        <Badge variant={vendor.sla >= 95 ? 'default' : vendor.sla >= 90 ? 'secondary' : 'destructive'}>
                          Overall: {Math.round((vendor.sla + vendor.deliveryScore + vendor.qualityScore) / 3)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">SLA Compliance</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${vendor.sla >= 95 ? 'bg-success' : vendor.sla >= 90 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ width: `${vendor.sla}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{vendor.sla}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Delivery Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${vendor.deliveryScore >= 95 ? 'bg-success' : vendor.deliveryScore >= 90 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ width: `${vendor.deliveryScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{vendor.deliveryScore}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Quality Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${vendor.qualityScore >= 95 ? 'bg-success' : vendor.qualityScore >= 90 ? 'bg-warning' : 'bg-destructive'}`}
                                style={{ width: `${vendor.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{vendor.qualityScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual Spend</CardTitle>
                <CardDescription>Monthly comparison of budgeted vs actual expenditure</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlySpend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="budget" name="Budget" fill="#94a3b8" />
                    <Bar dataKey="actual" name="Actual" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Budget (YTD)</p>
                  <p className="text-2xl font-bold">₹{(budgetSummary.totalBudget / 100000).toFixed(1)}L</p>
                  <p className="text-xs text-muted-foreground mt-1">Jul 2024 - Jan 2025</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Actual Spend (YTD)</p>
                  <p className="text-2xl font-bold">₹{(budgetSummary.actualSpend / 100000).toFixed(1)}L</p>
                  <Badge variant={budgetSummary.overPercent > 0 ? 'destructive' : 'default'} className="mt-1">
                    {Math.abs(budgetSummary.overPercent).toFixed(1)}% {budgetSummary.overPercent > 0 ? 'Over' : 'Under'} Budget
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Remaining Budget</p>
                  <p className={`text-2xl font-bold ${budgetSummary.remainingBudget < 0 ? 'text-destructive' : 'text-success'}`}>
                    {budgetSummary.remainingBudget < 0 ? '-' : ''}₹{Math.abs(budgetSummary.remainingBudget / 100000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">5 months remaining in FY</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value Trend</CardTitle>
                <CardDescription>Monthly inventory valuation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={inventoryTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value / 100000}L`} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Current Inventory Value</p>
                  <p className="text-2xl font-bold">₹{(inventorySummary.currentInventoryValue / 100000).toFixed(1)}L</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total SKUs</p>
                  <p className="text-2xl font-bold">{inventorySummary.totalSkus}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold text-warning">{inventorySummary.lowStockItems}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Dead Stock Items</p>
                  <p className="text-2xl font-bold text-destructive">{inventorySummary.deadStockItems}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
