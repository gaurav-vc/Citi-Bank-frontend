import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/api/dashboard';
import { requisitionsAPI } from '@/api/requisitions';
import { ordersAPI } from '@/api/orders';
import { commonAPI } from '@/api/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/ui/metric-card';
import { DrilldownChart } from '@/components/dashboard/DrilldownChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadFile } from '@/utils/downloadFile';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Warehouse,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  Building2,
  IndianRupee,
  Building,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const defaultMetrics = {
  totalSpend: { value: 0, trend: 'up' as const },
  openPOs: { value: 0, trend: 'down' as const },
  inventoryValue: { value: 0, trend: 'up' as const },
  outstandingPayments: { value: 0, trend: 'up' as const },

  budgetUtilization: 0,
  pendingApprovals: 0,
  vendorCompliance: 0,
  amcRenewals: 0,
};

const COLORS = [
  'hsl(173, 58%, 39%)',
  'hsl(222, 47%, 30%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(215, 16%, 47%)',
  'hsl(262, 83%, 58%)'
];

const processCategorySpendData = (rawData: any[], nameKey: string) => {
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

  const aggregated: Record<string, number> = {};

  rawData.forEach(item => {
    const rawName = item[nameKey] || '';
    let normalizedName = rawName.trim();
    if (normalizationMap[normalizedName]) {
      normalizedName = normalizationMap[normalizedName];
    } else if (normalizedName.toLowerCase() === 'hvac') {
      normalizedName = 'HVAC';
    } else if (normalizedName.toLowerCase() === 'electrical') {
      normalizedName = 'Electrical';
    } else {
      normalizedName = normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);
    }

    const val = Number(item.value) || 0;
    if (val > 0) {
      aggregated[normalizedName] = (aggregated[normalizedName] || 0) + val;
    }
  });

  const total = Object.values(aggregated).reduce((sum, val) => sum + val, 0);

  return Object.keys(aggregated)
    .filter(name => total === 0 || (aggregated[name] / total) >= 0.01)
    .map(name => ({
      [nameKey]: name,
      value: aggregated[name]
    }));
};

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<any>(defaultMetrics);
  const [monthlySpendData, setMonthlySpendData] = useState<any[]>([]);
  const [categorySpend, setCategorySpend] = useState<any[]>([]);
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [recentIndents, setRecentIndents] = useState<any[]>([]);
  const [allIndents, setAllIndents] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topVendorsData, setTopVendorsData] = useState<any[]>([]);

  // Dynamic Reference Stats from Backend
  const [bannerStats, setBannerStats] = useState({ title: "Campus Procurement", subtitle: "Loading..." });
  const [derivedStats, setDerivedStats] = useState({ totalRevenue: 0, activeSites: 0, totalUsers: 0, totalCompanies: 0 });
  const [derivedUpsale, setDerivedUpsale] = useState<any[]>([]);
  const [companyWiseSite, setCompanyWiseSite] = useState<any[]>([]);
  const [moduleWiseSite, setModuleWiseSite] = useState<any[]>([]);
  const [derivedModuleRevenue, setDerivedModuleRevenue] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Metrics
      const metricsData = await dashboardAPI.getMetrics();
      if (metricsData) {
        if (metricsData.dashboardMetrics) {
          setMetrics({ ...defaultMetrics, ...metricsData.dashboardMetrics });
        }
        if (metricsData.monthly_spend) {
          setMonthlySpendData(metricsData.monthly_spend);
        } else if (metricsData.monthlySpendData) {
          setMonthlySpendData(metricsData.monthlySpendData.map((d: any) => ({ month: d.month, value: d.spend })));
        }
        if (metricsData.category_spend) {
          setCategorySpend(processCategorySpendData(metricsData.category_spend, 'category'));
        } else if (metricsData.categorySpend) {
          const mapped = metricsData.categorySpend.map((d: any) => ({ category: d.name, value: d.value }));
          setCategorySpend(processCategorySpendData(mapped, 'category'));
        }
        if (metricsData.totalSpendDrilldown) {
          setDrilldownData(metricsData.totalSpendDrilldown);
        }
        if (metricsData.bannerStats) setBannerStats(metricsData.bannerStats);
        if (metricsData.derivedStats) setDerivedStats(metricsData.derivedStats);
        if (metricsData.derivedUpsale) setDerivedUpsale(metricsData.derivedUpsale);
        if (metricsData.companyWiseSite) setCompanyWiseSite(metricsData.companyWiseSite);
        if (metricsData.moduleWiseSite) setModuleWiseSite(metricsData.moduleWiseSite);
        if (metricsData.derivedModuleRevenue) setDerivedModuleRevenue(metricsData.derivedModuleRevenue);
      }

      // Indents
      const indentsData = await requisitionsAPI.getIndents();
      if (indentsData) {
        const list = Array.isArray(indentsData) ? indentsData : (indentsData.results || []);
        setAllIndents(list);
        const filteredList = user?.role === 'store_keeper'
          ? list.filter((i: any) => i.status === 'pending_store_keeper')
          : list;
        setRecentIndents(filteredList.slice(0, 3));
      }

      // Orders
      const ordersData = await ordersAPI.getOrders();
      if (ordersData) {
        const list = Array.isArray(ordersData) ? ordersData : (ordersData.results || []);
        setRecentOrders(list.slice(0, 3));
      }

      // Vendors
      const vendorsData = await commonAPI.getVendors();
      if (vendorsData) {
        const list = Array.isArray(vendorsData) ? vendorsData : (vendorsData.results || []);
        setTopVendorsData(list.slice(0, 5));
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleGenerateReport = async () => {
    toast({
      title: 'Generating Report...',
      description: 'The overall spend report is being compiled.',
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/reports/export/spend/?format=xlsx`,
        `spend_report_${Date.now()}.xlsx`,
        token || ''
      );
      toast({
        title: 'Report Downloaded',
        description: 'Spend report downloaded successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'An error occurred during download.',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;


  const getTrendValue = (metric: any) => {
    if (!metric || metric.value === undefined || metric.previousValue === undefined) return undefined;
    if (metric.previousValue === 0) return metric.value > 0 ? '+100% vs last month' : '0% vs last month';
    const diff = metric.value - metric.previousValue;
    const percent = Math.abs(Math.round((diff / metric.previousValue) * 100));
    return `${metric.value >= metric.previousValue ? '+' : '-'}${percent}% vs last month`;
  };

  const totalRevenueFormatted = `₹${(derivedStats?.totalRevenue || 0).toLocaleString('en-IN')}/-`;

  const derivedStatsList = [
    { icon: IndianRupee, label: "Total Revenue", value: totalRevenueFormatted, desc: "YTD billing value" },
    { icon: Building2, label: "Active Sites", value: String(derivedStats?.activeSites || 0), desc: "Configured property sites" },
    { icon: Users, label: "Total Users", value: String(derivedStats?.totalUsers || 0), desc: "Registered platform users" },
    { icon: Building, label: "Total Companies", value: String(derivedStats?.totalCompanies || 0), desc: "Configured organization nodes" },
  ];

  function ListRows({ items }: { items: any[] }) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div className="list-row flex justify-between items-center p-2 rounded-md hover:bg-muted/10 border-b last:border-0" key={item.title}>
            <div>
              <p className="list-title font-semibold text-sm">{item.title}</p>
              <p className="list-meta text-xs text-muted-foreground">{item.sites !== undefined ? `Sites: ${item.sites}` : `Orders: ${item.orders ?? 0}`}</p>
            </div>
            <div className="list-value font-medium text-sm text-primary">{item.amount}</div>
          </div>
        ))}
      </div>
    );
  }

  function WaveChart({ items, colorClass }: { items: any[]; colorClass: string }) {
    if (!items || items.length === 0) return null;
    const width = 700;
    const height = 220;
    const topPadding = 20;
    const bottomPadding = 14;
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const xStep = width / Math.max(items.length - 1, 1);

    const points = items.map((item, index) => {
      const x = xStep * index;
      const y =
        height -
        bottomPadding -
        (item.value / maxValue) * (height - topPadding - bottomPadding);
      return { x, y };
    });

    const linePath = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const prevPoint = points[index - 1];
        const controlX = (prevPoint.x + point.x) / 2;
        return `Q ${controlX} ${prevPoint.y}, ${point.x} ${point.y}`;
      })
      .join(" ");

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    return (
      <div className={`wave-chart ${colorClass} w-full`}>
        <svg className="wave-svg w-full h-[180px]" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <path className="wave-area" d={areaPath} />
          <path className="wave-line" d={linePath} />
        </svg>
        <div className="wave-labels flex justify-between px-2 text-xs text-muted-foreground mt-2">
          {items.map((item) => (
            <div className="wave-label truncate max-w-[80px]" key={item.label}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderSpendCategoryLabel = (props: any) => {
    const { cx, cy, outerRadius, category, percent, index } = props;

    const RADIAN = Math.PI / 180;
    const labelRadius = outerRadius + 42;
    const total = categorySpend.reduce((sum, d) => sum + d.value, 0) || 1;

    let currentAngle = 0;
    const positioned = categorySpend.map((d, idx) => {
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
        category: d.category,
        percent: valPercent,
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
          const next = items[i + 1];
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

    const { sx, sy, mx, my, x, y, isLeft } = item;
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
          stroke={COLORS[index % COLORS.length]}
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
          {`${category} (${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Button>

            <Button onClick={handleGenerateReport}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Overview */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Building2 className="h-10 w-10" />
                <div>
                  <h2 className="text-xl font-bold">
                    {bannerStats.title}
                  </h2>
                  <p className="text-primary-foreground/80">
                    {bannerStats.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {typeof metrics.vendorCompliance === 'object'
                      ? metrics.vendorCompliance?.value
                      : metrics.vendorCompliance}%
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    Vendor Compliance
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {typeof metrics.pendingApprovals === 'object'
                      ? metrics.pendingApprovals?.value
                      : metrics.pendingApprovals}
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    Pending Approvals
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {typeof metrics.amcRenewals === 'object'
                      ? metrics.amcRenewals?.value
                      : metrics.amcRenewals}
                  </p>
                  <p className="text-sm text-primary-foreground/80">
                    AMC Renewals Due
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reference Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {derivedStatsList.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card key={item.label} className="border border-border/50 bg-card shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between w-full">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <div className="p-2.5 rounded-lg bg-primary/5 text-primary/70 shrink-0">
                    <IconComponent className="h-5 w-5 stroke-[1.75]" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground font-manrope">{item.value}</p>
                </div>
                <div className="mt-2 text-xs font-semibold text-muted-foreground font-manrope">
                  {item.desc}
                </div>
              </Card>
            );
          })}
        </section>

        {/* Spend Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Spend"
            value={metrics.totalSpend?.value ?? metrics.totalSpend ?? 0}
            trend={metrics.totalSpend?.trend}
            trendValue={getTrendValue(metrics.totalSpend) || "+10% vs last month"}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Budget Utilization"
            value={metrics.budgetUtilization?.value ?? metrics.budgetUtilization ?? 0}
            trend={metrics.budgetUtilization?.trend}
            trendValue={getTrendValue(metrics.budgetUtilization) || "YTD utilization"}
            icon={TrendingUp}
            format="percentage"
          />
          <MetricCard
            title="Open POs"
            value={metrics.openPOs?.value ?? metrics.openPOs ?? 0}
            trend={metrics.openPOs?.trend}
            trendValue={getTrendValue(metrics.openPOs) || "-2 vs last week"}
            icon={ShoppingCart}
            format="number"
          />
          <MetricCard
            title="Inventory Value"
            value={metrics.inventoryValue?.value ?? metrics.inventoryValue ?? 0}
            trend={metrics.inventoryValue?.trend}
            trendValue={getTrendValue(metrics.inventoryValue) || "+5% vs last month"}
            icon={Warehouse}
            format="currency"
          />
        </div>

        {/* Spend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Monthly Spend Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {monthlySpendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySpendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No spend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Spend by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {categorySpend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySpend}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="category"
                        labelLine={false}
                        label={renderSpendCategoryLabel}
                      >
                        {categorySpend.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                    No category spend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reference Row 1: Today's Upsale & Company Wise Site (WaveChart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border/50 bg-card shadow-sm p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-lg font-semibold">Today's Upsale</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {derivedUpsale.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sales recorded.</p>
              ) : (
                <ListRows items={derivedUpsale} />
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card shadow-sm p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-lg font-semibold">Company Wise Site</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {companyWiseSite.length === 0 ? (
                <p className="text-sm text-muted-foreground">No site allocations recorded.</p>
              ) : (
                <WaveChart items={companyWiseSite} colorClass="wave-gold" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reference Row 2: Module Wise Revenue & Module Wise Site (WaveChart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-border/50 bg-card shadow-sm p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-lg font-semibold">Module Wise Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ListRows items={derivedModuleRevenue} />
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card shadow-sm p-4">
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-lg font-semibold">Module Wise Site</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <WaveChart items={moduleWiseSite} colorClass="wave-teal" />
            </CardContent>
          </Card>
        </div>

        {/* Spend Analysis Drilldown */}
        {drilldownData.length > 0 && (
          <DrilldownChart
            title="Spend Analysis Drilldown"
            data={drilldownData}
          />
        )}

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Indents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Indents
              </CardTitle>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentIndents.length > 0 ? (
                  recentIndents.map((indent: any) => (
                    <div key={indent.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm">{indent.id}</p>
                        <p className="text-xs text-muted-foreground">Category: {indent.category}</p>
                        <p className="text-xs text-muted-foreground">Cost: ₹{Number(indent.estimated_cost).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={indent.status} />
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm py-4 text-center">No recent indents</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm">{order.id}</p>
                        <p className="text-xs text-muted-foreground">Vendor: {order.vendor_name}</p>
                        <p className="text-xs text-muted-foreground">Total: ₹{Number(order.net_value).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm py-4 text-center">No recent orders</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Vendors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Vendors
              </CardTitle>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendorsData.length > 0 ? (
                  topVendorsData.map((vendor: any) => (
                    <div key={vendor.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">Category: {vendor.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          Rating: {vendor.sla_rating}/5
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm py-4 text-center">No vendors found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}