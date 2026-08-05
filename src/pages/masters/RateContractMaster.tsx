import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Search, Filter, FileText, Calendar, AlertTriangle,
  Edit, Eye, Download, RefreshCw, CheckCircle, Clock, XCircle, Upload
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';

interface RateContract {
  id: string;
  vendor: string;
  vendorId: string;
  type: 'rate_contract' | 'amc';
  serviceScope: string;
  category: string;
  contractValue: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  slaKpis: string[];
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed';
  utilizationPercent: number;
  lastBillingDate: string;
  nextBillingDate: string;
}

const mapRateContract = (c: any): RateContract => ({
  id: c.id,
  vendor: c.vendor,
  vendorId: c.vendor_id,
  type: c.type,
  serviceScope: c.service_scope,
  category: c.category,
  contractValue: typeof c.contract_value === 'string' ? parseFloat(c.contract_value) : c.contract_value,
  billingCycle: c.billing_cycle,
  startDate: c.start_date,
  endDate: c.end_date,
  slaKpis: c.sla_kpis ?? [],
  status: c.status,
  utilizationPercent: typeof c.utilization_percent === 'string' ? parseFloat(c.utilization_percent) : c.utilization_percent,
  lastBillingDate: c.last_billing_date || '',
  nextBillingDate: c.next_billing_date || '',
});

const statusConfig = {
  active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
  expiring_soon: { label: 'Expiring Soon', variant: 'secondary' as const, icon: Clock },
  expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle },
  renewed: { label: 'Renewed', variant: 'default' as const, icon: RefreshCw },
};

export default function RateContractMaster() {
  const { token } = useAuth();
  const [contracts, setContracts] = useState<RateContract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/contracts/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        setContracts(data.map(mapRateContract));
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Rate contracts list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/contracts/export/?format=xlsx`,
        `contracts_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Rate contracts list exported successfully.',
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
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/contracts/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Import Successful',
          description: data.message || `Successfully imported contracts`,
          variant: 'default',
        });
        fetchContracts();
      } else {
        toast({
          title: 'Import Failed',
          description: data.error || (data.errors ? data.errors.join(', ') : 'Failed to import contracts'),
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    expiringSoon: contracts.filter(c => c.status === 'expiring_soon').length,
    totalValue: contracts.reduce((sum, c) => sum + c.contractValue, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rate Contract / AMC Master</h1>
            <p className="text-muted-foreground">Manage rate contracts and annual maintenance contracts</p>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="contract-import-input"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => document.getElementById('contract-import-input')?.click()}>
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
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage create new contract details and actions here.</DialogDescription>
                </DialogHeader>
                <CreateContractForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchContracts} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Contracts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
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
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(0)}L</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList>
              <TabsTrigger value="all">All Contracts</TabsTrigger>
              <TabsTrigger value="amc">AMC</TabsTrigger>
              <TabsTrigger value="rate">Rate Contracts</TabsTrigger>
              <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="amc">AMC</SelectItem>
                  <SelectItem value="rate_contract">Rate Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <ContractTable contracts={filteredContracts} />
          </TabsContent>
          <TabsContent value="amc">
            <ContractTable contracts={filteredContracts.filter(c => c.type === 'amc')} />
          </TabsContent>
          <TabsContent value="rate">
            <ContractTable contracts={filteredContracts.filter(c => c.type === 'rate_contract')} />
          </TabsContent>
          <TabsContent value="expiring">
            <ContractTable contracts={filteredContracts.filter(c => c.status === 'expiring_soon')} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function ContractTable({ contracts }: { contracts: RateContract[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract ID</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Contract Value</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No contracts found
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => {
                const statusInfo = statusConfig[contract.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-sm">{contract.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.vendor}</p>
                        <p className="text-xs text-muted-foreground">{contract.serviceScope.slice(0, 30)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contract.type === 'amc' ? 'AMC' : 'Rate Contract'}
                      </Badge>
                    </TableCell>
                    <TableCell>{contract.category}</TableCell>
                    <TableCell className="font-semibold">₹{contract.contractValue.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{contract.billingCycle}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{contract.startDate}</p>
                        <p className="text-muted-foreground">to {contract.endDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-20">
                        <Progress value={contract.utilizationPercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{contract.utilizationPercent}%</p>
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
                        {contract.status === 'expiring_soon' && (
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
      </CardContent>
    </Card>
  );
}

function CreateContractForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [vendorId, setVendorId] = useState('VND-001');
  const [vendorName, setVendorName] = useState('CoolAir Solutions');
  const [contractType, setContractType] = useState('amc');
  const [serviceScope, setServiceScope] = useState('');
  const [category, setCategory] = useState('HVAC');
  const [contractValue, setContractValue] = useState(0);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [slaKpis, setSlaKpis] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('campusspend_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const body = {
      id: `RC-${Date.now()}`,
      vendor: vendorName,
      vendor_id: vendorId,
      type: contractType,
      service_scope: serviceScope,
      category,
      contract_value: contractValue,
      billing_cycle: billingCycle,
      start_date: startDate,
      end_date: endDate,
      sla_kpis: slaKpis.split('\n').map(k => k.trim()).filter(k => k !== ''),
      status: 'active',
      utilization_percent: 0,
      last_billing_date: null,
      next_billing_date: null
    };

    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/contracts/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Contract created successfully' });
        onSuccess();
        onClose();
      } else {
        toast({ title: 'Error', description: 'Failed to create contract', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error creating contract', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor</Label>
          <Select 
            value={vendorId} 
            onValueChange={(val) => {
              setVendorId(val);
              const nameMap: Record<string, string> = {
                'VND-001': 'CoolAir Solutions',
                'VND-002': 'SecureGuard Services',
                'VND-003': 'CleanPro Services',
                'VND-004': 'PowerGrid Solutions'
              };
              setVendorName(nameMap[val] || val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VND-001">CoolAir Solutions</SelectItem>
              <SelectItem value="VND-002">SecureGuard Services</SelectItem>
              <SelectItem value="VND-003">CleanPro Services</SelectItem>
              <SelectItem value="VND-004">PowerGrid Solutions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Contract Type</Label>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="amc">Annual Maintenance Contract (AMC)</SelectItem>
              <SelectItem value="rate_contract">Rate Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scope">Service Scope</Label>
        <Textarea 
          placeholder="Describe the service scope in detail..." 
          rows={3} 
          value={serviceScope}
          onChange={e => setServiceScope(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
              <SelectItem value="Soft Services">Soft Services</SelectItem>
              <SelectItem value="Landscaping">Landscaping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="value">Contract Value (₹)</Label>
          <Input 
            id="value" 
            type="number" 
            placeholder="Enter value" 
            value={contractValue}
            onChange={e => setContractValue(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="billing">Billing Cycle</Label>
          <Select value={billingCycle} onValueChange={setBillingCycle}>
            <SelectTrigger>
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input 
            id="startDate" 
            type="date" 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input 
            id="endDate" 
            type="date" 
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>SLA / KPIs</Label>
        <Textarea 
          placeholder="Enter SLA metrics and KPIs (one per line)..." 
          rows={3} 
          value={slaKpis}
          onChange={e => setSlaKpis(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create Contract</Button>
      </div>
    </form>
  );
}
