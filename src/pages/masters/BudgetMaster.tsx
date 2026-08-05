import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Plus, Download, Upload, Wallet, TrendingUp, TrendingDown, AlertTriangle, Edit, Copy, Trash2, History } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';

type BudgetType = 'opex' | 'capex';
type Period = 'monthly' | 'quarterly' | 'annual';

interface BudgetLine {
  id: string;
  fy: string;
  type: BudgetType;
  tower: string;
  department: string;
  category: string;
  glCode: string;
  period: Period;
  annualBudget: number;
  allocated: number;
  committed: number;
  actual: number;
  owner: string;
  status: 'draft' | 'submitted' | 'approved' | 'revised' | 'locked';
  notes?: string;
}

const TOWERS = ['Tower A', 'Tower B', 'Tower C', 'Common Area'];
const DEPARTMENTS = ['Engineering', 'Soft Services', 'Security', 'Facilities', 'Projects', 'Admin'];
const GL_CODES = ['5001-RM', '5002-AMC', '5003-CONSUM', '5004-SOFT', '5005-SEC', '6001-CAPEX-CIVIL', '6002-CAPEX-MEP'];

const statusColor: Record<BudgetLine['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-500/15 text-blue-600',
  approved: 'bg-emerald-500/15 text-emerald-600',
  revised: 'bg-amber-500/15 text-amber-600',
  locked: 'bg-slate-500/15 text-slate-600',
};

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#6366f1', '#ef4444'];

const mapBudget = (b: any): BudgetLine => ({
  id: b.id,
  fy: b.fy,
  type: b.type,
  tower: b.tower,
  department: b.department,
  category: b.category,
  glCode: b.gl_code,
  period: b.period,
  annualBudget: typeof b.annual_budget === 'string' ? parseFloat(b.annual_budget) : b.annual_budget,
  allocated: typeof b.allocated === 'string' ? parseFloat(b.allocated) : b.allocated,
  committed: typeof b.committed === 'string' ? parseFloat(b.committed) : b.committed,
  actual: typeof b.actual === 'string' ? parseFloat(b.actual) : b.actual,
  owner: b.owner,
  status: b.status,
  notes: b.notes ?? '',
});

export default function BudgetMaster() {
  const { token, user } = useAuth();
  const effectiveRole = (user?.role === 'cxo_citi' || user?.role === 'cxo_emb') ? 'cxo' : user?.role;
  const role = effectiveRole;
  const canCreateOrEdit = !!(role && ['super_admin', 'finance_manager', 'finance_executive', 'cxo'].includes(role));
  const canDelete = !!(role && ['super_admin', 'finance_manager'].includes(role));
  const canImport = !!(role && ['super_admin', 'finance_manager', 'finance_executive', 'cxo'].includes(role));
  const canExport = !!(role && ['super_admin', 'finance_manager', 'finance_executive', 'cxo'].includes(role));

  const [rows, setRows] = useState<BudgetLine[]>([]);
  const [fy, setFy] = useState('FY 2025-26');

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget line?')) return;
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/${id}/`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        toast.success('Budget line deleted successfully');
        fetchBudgets();
      } else {
        toast.error('Failed to delete budget line');
      }
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      toast.error('Error deleting budget');
    }
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedBudgetForHistory, setSelectedBudgetForHistory] = useState<BudgetLine | null>(null);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async (budgetLine: BudgetLine) => {
    setSelectedBudgetForHistory(budgetLine);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/${budgetLine.id}/history/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRevisionHistory(data);
      } else {
        toast.error('Failed to load budget revision history');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load budget revision history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const [categories, setCategories] = useState<{ id: number; code: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/item-categories/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        setCategoriesError('Failed to load categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategoriesError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        setRows(data.map(mapBudget));
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    }
  };

  const handleExport = async () => {
    toast.info('Export started. Budget list is being exported to Excel.');

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/export/?format=xlsx`,
        `budgets_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast.success('Budget list exported successfully.');
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during export.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    toast.info('Importing file, please wait...');

    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Successfully imported budgets');
        fetchBudgets();
      } else {
        toast.error(data.error || (data.errors ? data.errors.join(', ') : 'Failed to import budgets'));
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during import');
    } finally {
      e.target.value = '';
    }
  };
  const [typeFilter, setTypeFilter] = useState<'all' | BudgetType>('all');
  const [towerFilter, setTowerFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetLine | null>(null);

  const empty = useMemo(() => ({
    id: '', fy, type: 'opex' as const, tower: 'Tower A', department: 'Engineering',
    category: categories.length > 0 ? categories[0].name : '', glCode: '5001-RM', period: 'annual' as const,
    annualBudget: 0, allocated: 0, committed: 0, actual: 0,
    owner: '', status: 'draft' as const,
  }), [fy, categories]);

  const [form, setForm] = useState<BudgetLine>({
    id: '', fy, type: 'opex', tower: 'Tower A', department: 'Engineering',
    category: '', glCode: '5001-RM', period: 'annual',
    annualBudget: 0, allocated: 0, committed: 0, actual: 0,
    owner: '', status: 'draft',
  });

  const filtered = useMemo(
    () => rows.filter(r =>
      r.fy === fy &&
      (typeFilter === 'all' || r.type === typeFilter) &&
      (towerFilter === 'all' || r.tower === towerFilter)
    ),
    [rows, fy, typeFilter, towerFilter]
  );

  const totals = useMemo(() => {
    const budget = filtered.reduce((s, r) => s + r.annualBudget, 0);
    const committed = filtered.reduce((s, r) => s + r.committed, 0);
    const actual = filtered.reduce((s, r) => s + r.actual, 0);
    const available = Math.max(0, budget - committed);
    const util = budget ? Math.round((actual / budget) * 100) : 0;
    return { budget, committed, actual, available, util };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { category: string; budget: number; actual: number }>();
    filtered.forEach(r => {
      const cur = map.get(r.category) ?? { category: r.category, budget: 0, actual: 0 };
      cur.budget += r.annualBudget; cur.actual += r.actual;
      map.set(r.category, cur);
    });
    return Array.from(map.values());
  }, [filtered]);

  const byTower = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(r => map.set(r.tower, (map.get(r.tower) ?? 0) + r.actual));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [filtered]);

  const startCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (r: BudgetLine) => { setEditing(r); setForm(r); setOpen(true); };
  const cloneRow = async (r: BudgetLine) => {
    const token = localStorage.getItem('campusspend_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const body = {
      id: `BUD-${String(rows.length + 1).padStart(3, '0')}`,
      fy: r.fy,
      type: r.type,
      tower: r.tower,
      department: r.department,
      category: r.category,
      gl_code: r.glCode,
      period: r.period,
      annual_budget: r.annualBudget,
      allocated: r.allocated,
      committed: r.committed,
      actual: r.actual,
      owner: r.owner,
      status: 'draft',
      notes: r.notes || ''
    };
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast.success('Budget line cloned');
        fetchBudgets();
      } else {
        toast.error('Failed to clone budget line');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cloning budget line');
    }
  };

  const save = async () => {
    if (!form.owner || !form.annualBudget) {
      toast.error('Owner and Annual Budget are required'); return;
    }
    
    const token = localStorage.getItem('campusspend_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const body = {
      id: form.id || `BUD-${Date.now()}`,
      fy: form.fy,
      type: form.type,
      tower: form.tower,
      department: form.department,
      category: form.category,
      gl_code: form.glCode,
      period: form.period,
      annual_budget: form.annualBudget,
      allocated: form.allocated,
      committed: form.committed,
      actual: form.actual,
      owner: form.owner,
      status: form.status,
      notes: form.notes || ''
    };
    
    try {
      let url = `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/`;
      let method = 'POST';
      
      if (editing) {
        url = `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/budgets/${editing.id}/`;
        method = 'PATCH';
      } else {
        body.id = `BUD-${String(rows.length + 1).padStart(3, '0')}`;
      }
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        toast.success(editing ? 'Budget updated' : 'Budget line created');
        fetchBudgets();
        setOpen(false);
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save budget');
      }
    } catch (err: any) {
      console.error('Error saving budget:', err);
      toast.error('Error saving budget');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Budget Master & Planning</h1>
            <p className="text-sm text-muted-foreground">OPEX / CAPEX budgeting, allocations, commitments & variance tracking</p>
          </div>
          <div className="flex gap-2">
            {canImport && (
              <>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  id="budget-import-input"
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/budget_import_template.csv';
                  link.download = 'budget_import_template.csv';
                  link.click();
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Format Template
                </Button>
                <Button variant="outline" size="sm" onClick={() => document.getElementById('budget-import-input')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
              </>
            )}
            {canExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {canCreateOrEdit && (
              <Button size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-2" />New Budget Line</Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Financial Year</Label>
              <Select value={fy} onValueChange={setFy}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FY 2025-26">FY 2025-26</SelectItem>
                  <SelectItem value="FY 2026-27">FY 2026-27</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Budget Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="opex">OPEX</SelectItem>
                  <SelectItem value="capex">CAPEX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tower</Label>
              <Select value={towerFilter} onValueChange={setTowerFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Towers</SelectItem>
                  {TOWERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Budget', value: fmtINR(totals.budget), icon: Wallet, tone: 'text-primary' },
            { label: 'Committed', value: fmtINR(totals.committed), icon: TrendingUp, tone: 'text-blue-600' },
            { label: 'Actual Spend', value: fmtINR(totals.actual), icon: TrendingDown, tone: 'text-emerald-600' },
            { label: 'Available', value: fmtINR(totals.available), icon: AlertTriangle, tone: totals.util > 90 ? 'text-destructive' : 'text-amber-600' },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{k.label}</div>
                    <div className="text-xl font-semibold mt-1">{k.value}</div>
                  </div>
                  <k.icon className={`h-5 w-5 ${k.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="lines">
          <TabsList>
            <TabsTrigger value="lines">Budget Lines</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="variance">Variance</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Budget Allocations ({filtered.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tower / Dept</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>GL Code</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Committed</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => {
                      const consumed = r.actual + r.committed;
                      const util = r.annualBudget ? Math.round((consumed / r.annualBudget) * 100) : 0;
                      const remaining = Math.max(0, r.annualBudget - consumed);
                      const isOverspent = consumed > r.annualBudget;
                      const isNearLimit = !isOverspent && util >= 90;
                      
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.id}</TableCell>
                          <TableCell><Badge variant="outline" className="uppercase">{r.type}</Badge></TableCell>
                          <TableCell>
                            <div className="text-sm">{r.tower}</div>
                            <div className="text-xs text-muted-foreground">{r.department}</div>
                          </TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell className="font-mono text-xs">{r.glCode}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.annualBudget)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.committed)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.actual)}</TableCell>
                          <TableCell className="min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="w-24">
                                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        isOverspent 
                                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' 
                                          : isNearLimit 
                                          ? 'bg-amber-500 animate-pulse' 
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(util, 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <span className={`text-xs font-bold ${
                                  isOverspent ? 'text-rose-600 dark:text-rose-400' : isNearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {util}%
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                Bal: {fmtINR(remaining)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge className={statusColor[r.status]}>{r.status}</Badge>
                              {isOverspent ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 uppercase tracking-wide">
                                  Overspent
                                </span>
                              ) : isNearLimit ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 uppercase tracking-wide">
                                  Near Limit
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => fetchHistory(r)} title="Revision History"><History className="h-4 w-4" /></Button>
                              {canCreateOrEdit && (
                                <>
                                  <Button size="icon" variant="ghost" onClick={() => startEdit(r)} title="Edit"><Edit className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" onClick={() => cloneRow(r)} title="Clone"><Copy className="h-4 w-4" /></Button>
                                </>
                              )}
                              {canDelete && (
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Budget vs Actual by Category</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmtINR(v)} />
                    <Legend />
                    <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" />
                    <Bar dataKey="actual" fill="hsl(var(--accent))" name="Actual" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Actual Spend by Tower</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byTower} dataKey="value" nameKey="name" outerRadius={100} label>
                      {byTower.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtINR(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variance" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Variance Report</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Budget Line</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Var %</TableHead>
                      <TableHead>Indicator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(r => {
                      const variance = r.annualBudget - r.actual;
                      const pct = r.annualBudget ? (variance / r.annualBudget) * 100 : 0;
                      const over = variance < 0;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.id}</TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.annualBudget)}</TableCell>
                          <TableCell className="text-right">{fmtINR(r.actual)}</TableCell>
                          <TableCell className={`text-right ${over ? 'text-destructive' : 'text-emerald-600'}`}>{fmtINR(Math.abs(variance))}</TableCell>
                          <TableCell className={`text-right ${over ? 'text-destructive' : 'text-emerald-600'}`}>{pct.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge className={over ? 'bg-destructive/15 text-destructive' : 'bg-emerald-500/15 text-emerald-600'}>
                              {over ? 'Overrun' : 'Within Budget'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create / Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Budget Line' : 'New Budget Line'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Please review and complete the details below.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Financial Year</Label>
                <Select value={form.fy} onValueChange={(v) => setForm({ ...form, fy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY 2025-26">FY 2025-26</SelectItem>
                    <SelectItem value="FY 2026-27">FY 2026-27</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as BudgetType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opex">OPEX</SelectItem>
                    <SelectItem value="capex">CAPEX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tower</Label>
                <Select value={form.tower} onValueChange={(v) => setForm({ ...form, tower: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TOWERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select 
                  value={form.category} 
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  disabled={categoriesLoading || categories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      categoriesLoading 
                        ? "Loading categories..." 
                        : categoriesError 
                        ? "Failed to load categories" 
                        : categories.length === 0 
                        ? "No categories available" 
                        : "Select Category"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                    ) : categoriesError ? (
                      <SelectItem value="error" disabled>Failed to load categories</SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="none" disabled>No categories available</SelectItem>
                    ) : (
                      categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>GL Code</Label>
                <Select value={form.glCode} onValueChange={(v) => setForm({ ...form, glCode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GL_CODES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Period</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v as Period })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Budget Owner</Label>
                <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Owner name" />
              </div>
              <div className="space-y-1">
                <Label>Annual Budget (₹)</Label>
                <Input type="number" value={form.annualBudget} onChange={(e) => setForm({ ...form, annualBudget: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Allocated (₹)</Label>
                <Input type="number" value={form.allocated} onChange={(e) => setForm({ ...form, allocated: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Committed (₹)</Label>
                <Input type="number" value={form.committed} onChange={(e) => setForm({ ...form, committed: +e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Actual (₹)</Label>
                <Input type="number" value={form.actual} onChange={(e) => setForm({ ...form, actual: +e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Notes</Label>
                <Input value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional justification / revision notes" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>{editing ? 'Update' : 'Submit for Approval'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revision History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Budget Revision History - {selectedBudgetForHistory?.id}</DialogTitle>
              <DialogDescription>
                Detailed audit trail of allocation revisions for this budget line.
              </DialogDescription>
            </DialogHeader>

            {selectedBudgetForHistory && (
              <div className="space-y-6 pt-4">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-muted/40 p-4 rounded-lg border">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Allocated</p>
                    <p className="text-sm font-semibold text-primary">{fmtINR(selectedBudgetForHistory.allocated)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Committed</p>
                    <p className="text-sm font-semibold text-blue-600">{fmtINR(selectedBudgetForHistory.committed)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Actual Spend</p>
                    <p className="text-sm font-semibold text-emerald-600">{fmtINR(selectedBudgetForHistory.actual)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Remaining</p>
                    <p className="text-sm font-semibold text-amber-600">
                      {fmtINR(Math.max(0, selectedBudgetForHistory.allocated - (selectedBudgetForHistory.committed + selectedBudgetForHistory.actual)))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Utilization %</p>
                    <p className="text-sm font-semibold">
                      {selectedBudgetForHistory.allocated 
                        ? Math.round(((selectedBudgetForHistory.committed + selectedBudgetForHistory.actual) / selectedBudgetForHistory.allocated) * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold text-slate-500">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {revisionHistory.length > 0 
                        ? new Date(revisionHistory[0].created_at).toLocaleDateString('en-IN') 
                        : 'No revisions'}
                    </p>
                  </div>
                </div>

                {/* History Table */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Revisions (Newest First)</h3>
                  {historyLoading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading revision logs...</div>
                  ) : revisionHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No revisions recorded yet.</div>
                  ) : (
                    <Table className="border rounded-lg overflow-hidden">
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Old Allocation</TableHead>
                          <TableHead></TableHead>
                          <TableHead>New Allocation</TableHead>
                          <TableHead>Updated By</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revisionHistory.map((rev) => (
                          <TableRow key={rev.id}>
                            <TableCell className="font-semibold">{fmtINR(parseFloat(rev.previous_allocation))}</TableCell>
                            <TableCell className="text-muted-foreground">→</TableCell>
                            <TableCell className="font-semibold text-primary">{fmtINR(parseFloat(rev.new_allocation))}</TableCell>
                            <TableCell className="text-sm">{rev.updated_by_name || 'System'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(rev.created_at).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={rev.remarks}>
                              {rev.remarks || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setHistoryOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}