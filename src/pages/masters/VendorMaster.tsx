import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Star,
  Building2,
  Phone,
  Mail,
  RefreshCw,
  Send,
  UserX,
  UserCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Vendor } from '@/types';

const categories = ['Housekeeping', 'HVAC', 'Electrical', 'Plumbing', 'Security', 'Landscaping', 'MEP Spares'];
const vendorTypes = ['material', 'service', 'amc', 'soft_services'];
const towers = ['Tower A', 'Tower B', 'Tower C'];

export default function VendorMaster() {
  const { token } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        const mapped = data.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          category: v.category,
          gstNumber: v.gst_number,
          pan: v.pan,
          msmeStatus: v.msme_status,
          bankDetails: {
            bankName: v.bank_name,
            accountNumber: v.account_number,
            ifsc: v.ifsc,
          },
          slaRating: v.sla_rating,
          approvedTowers: v.approved_towers ?? [],
          complianceExpiry: v.compliance_expiry,
          status: v.status,
          contactPerson: v.contact_person,
          email: v.email,
          phone: v.phone,
          onboardingStatus: v.onboarding_status,
        }));
        setVendors(mapped);
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Vendor list is being exported to Excel.',
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/export/?format=xlsx`,
        `vendors_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Vendor list exported successfully.',
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/import/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Import Successful',
          description: data.message || `Successfully imported vendors`,
          variant: 'default',
        });
        fetchVendors();
      } else {
        toast({
          title: 'Import Failed',
          description: data.error || (data.errors ? data.errors.join(', ') : 'Failed to import vendors'),
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

  const handleToggleActive = async (vendorId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/${vendorId}/toggle-active/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: currentStatus === 'active' ? 'Vendor Disabled' : 'Vendor Activated',
          description: data.message || `Vendor status updated successfully.`,
        });
        fetchVendors();
      } else {
        throw new Error(data.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleResendCredentials = async (vendorId: string) => {
    const confirm = window.confirm("Are you sure you want to resend login credentials to this vendor?");
    if (!confirm) return;
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/${vendorId}/resend-credentials/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Credentials sent successfully.',
        });
        fetchVendors();
      } else {
        throw new Error('Unable to send credentials. Please check email configuration.');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Unable to send credentials. Please check email configuration.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (vendorId: string) => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/${vendorId}/reset-password/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        if (data.warning) {
          toast({
            title: 'Password Reset with Warning',
            description: data.warning,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Password Reset Successful',
            description: data.message || 'Temporary password has been emailed to the vendor.',
          });
        }
        fetchVendors();
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  function OnboardingStatusBadge({ status }: { status: string }) {
    let style = 'bg-muted text-muted-foreground';
    if (status === 'Account Created') style = 'bg-blue-500/10 text-blue-500';
    else if (status === 'Email Sent') style = 'bg-sky-500/10 text-sky-500';
    else if (status === 'First Login Pending') style = 'bg-amber-500/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]';
    else if (status === 'Active') style = 'bg-emerald-500/10 text-emerald-500';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {status || 'Account Created'}
      </span>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vendor Master</h1>
            <p className="text-muted-foreground">
              Manage all vendors, suppliers, and service providers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="vendor-import-input"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => document.getElementById('vendor-import-input')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                  <DialogDescription>
                    Enter vendor details to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <VendorForm
                  onClose={() => setIsAddDialogOpen(false)}
                  onSuccess={() => {
                    setIsAddDialogOpen(false);
                    fetchVendors();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{vendors.length}</div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">
                {vendors.filter((v) => v.status === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">
                {vendors.filter((v) => v.msmeStatus).length}
              </div>
              <p className="text-sm text-muted-foreground">MSME Registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {vendors.filter((v) => new Date(v.complianceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <p className="text-sm text-muted-foreground">Compliance Due</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vendor List */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Onboarding Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Compliance</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">{vendor.id} • GST: {vendor.gstNumber}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="capitalize text-muted-foreground">
                          {vendor.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{vendor.category}</td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{vendor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{vendor.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="py-4 px-4">
                        <OnboardingStatusBadge status={vendor.onboardingStatus} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span className="font-medium">{vendor.slaRating}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm">
                            {new Date(vendor.complianceExpiry).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          {new Date(vendor.complianceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                            <p className="text-xs text-warning">Expiring soon</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Resend Credentials"
                            onClick={() => handleResendCredentials(vendor.id)}
                            className="h-8 w-8 text-primary"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Reset Password"
                            onClick={() => handleResetPassword(vendor.id)}
                            className="h-8 w-8 text-warning"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedVendor(vendor)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingVendor(vendor)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResendCredentials(vendor.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Resend Credentials
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(vendor.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(vendor.id, vendor.status)}>
                                {vendor.status === 'active' ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Disable Vendor
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Enable Vendor
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Detail Dialog */}
        <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage vendor details details and actions here.</DialogDescription>
            </DialogHeader>
            {selectedVendor && <VendorDetails vendor={selectedVendor} />}
          </DialogContent>
        </Dialog>

        {/* Edit Vendor Dialog */}
        <Dialog open={!!editingVendor} onOpenChange={(open) => !open && setEditingVendor(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Vendor Details</DialogTitle>
              <DialogDescription>
                Modify vendor details.
              </DialogDescription>
            </DialogHeader>
            {editingVendor && (
              <VendorForm
                vendor={editingVendor}
                onClose={() => setEditingVendor(null)}
                onSuccess={() => {
                  setEditingVendor(null);
                  fetchVendors();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function VendorForm({ vendor, onClose, onSuccess }: { vendor?: any; onClose: () => void; onSuccess: () => void }) {
  const [selectedTowers, setSelectedTowers] = useState<string[]>(vendor?.approvedTowers || vendor?.approved_towers || []);
  const [name, setName] = useState(vendor?.name || '');
  const [type, setType] = useState(vendor?.type || '');
  const [category, setCategory] = useState(vendor?.category || '');
  const [contactPerson, setContactPerson] = useState(vendor?.contactPerson || vendor?.contact_person || '');
  const [email, setEmail] = useState(vendor?.email || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [gstNumber, setGstNumber] = useState(vendor?.gstNumber || vendor?.gst_number || '');
  const [pan, setPan] = useState(vendor?.pan || '');
  const [msme, setMsme] = useState(vendor?.msmeStatus || vendor?.msme_status || false);
  const [isUniversal, setIsUniversal] = useState(vendor?.isUniversalVendor || vendor?.is_universal_vendor || false);
  const [bankName, setBankName] = useState(vendor?.bankDetails?.bankName || vendor?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(vendor?.bankDetails?.accountNumber || vendor?.account_number || '');
  const [ifsc, setIfsc] = useState(vendor?.bankDetails?.ifsc || vendor?.ifsc || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const token = localStorage.getItem('campusspend_token');
      const isEdit = !!vendor;
      const url = isEdit
        ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/${vendor.id}/`
        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        id: vendor?.id || `V${Date.now()}`,
        name,
        type,
        category: isUniversal ? 'universal' : category,
        contact_person: contactPerson,
        email,
        phone,
        gst_number: gstNumber,
        pan,
        msme_status: msme,
        is_universal_vendor: isUniversal,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc,
        approved_towers: selectedTowers,
        sla_rating: vendor?.slaRating || vendor?.sla_rating || '0.00',
        compliance_expiry: vendor?.complianceExpiry || vendor?.compliance_expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: vendor?.status || 'active',
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        if (!isEdit && data.warning) {
          toast({
            title: 'Vendor Created with Warning',
            description: data.warning,
            variant: 'destructive',
          });
        } else {
          toast({
            title: isEdit ? 'Vendor Updated' : 'Vendor Created',
            description: isEdit ? 'Vendor details updated successfully.' : 'New vendor added successfully.',
          });
        }
        onSuccess();
      } else {
        const parsedErrors: Record<string, string> = {};
        let errorList: string[] = [];
        for (const key in data) {
          const val = data[key];
          const errorText = Array.isArray(val) ? val[0] : String(val);
          parsedErrors[key] = errorText;
          errorList.push(`${key}: ${errorText}`);
        }
        setErrors(parsedErrors);
        toast({ 
          title: 'Validation Error', 
          description: errorList.join(', '), 
          variant: 'destructive' 
        });
        throw new Error('Validation failed');
      }
    } catch (err: any) {
      if (err.message !== 'Validation failed') {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., ABC Facilities Pvt Ltd" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Vendor Type *</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="material">Material Supplier</SelectItem>
                <SelectItem value="service">Service Provider</SelectItem>
                <SelectItem value="amc">AMC Vendor</SelectItem>
                <SelectItem value="soft_services">Soft Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Service Category {isUniversal ? '' : '*'}</Label>
            <Select value={isUniversal ? 'universal' : category} onValueChange={setCategory} disabled={isUniversal}>
              <SelectTrigger>
                <SelectValue placeholder={isUniversal ? "Universal (All Categories)" : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {isUniversal && <SelectItem value="universal">Universal</SelectItem>}
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat.toLowerCase()}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Person *</Label>
            <Input id="contact" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Contact person name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" required className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>
        </div>
      </div>

      {/* Compliance Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Compliance Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gst">GST Number *</Label>
            <Input id="gst" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="27AABCU9603R1ZM" required className={errors.gst_number ? 'border-destructive focus-visible:ring-destructive' : ''} />
            {errors.gst_number && <p className="text-xs text-destructive">{errors.gst_number}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan">PAN *</Label>
            <Input id="pan" value={pan} onChange={e => setPan(e.target.value)} placeholder="AABCU9603R" required className={errors.pan ? 'border-destructive focus-visible:ring-destructive' : ''} />
            {errors.pan && <p className="text-xs text-destructive">{errors.pan}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="msme" checked={msme} onCheckedChange={(checked) => setMsme(!!checked)} />
            <Label htmlFor="msme">MSME Registered</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="universal" checked={isUniversal} onCheckedChange={(checked) => setIsUniversal(!!checked)} />
            <Label htmlFor="universal">Is Universal Vendor (Bids on all categories)</Label>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Bank Details</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bank">Bank Name *</Label>
            <Input id="bank" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="HDFC Bank" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account Number *</Label>
            <Input id="account" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="50200012345678" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifsc">IFSC Code *</Label>
            <Input id="ifsc" value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="HDFC0001234" required />
          </div>
        </div>
      </div>

      {/* Approved Towers */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Approved Towers/Areas</h3>
        <div className="flex flex-wrap gap-4">
          {towers.map((tower) => (
            <div key={tower} className="flex items-center space-x-2">
              <Checkbox
                id={tower}
                checked={selectedTowers.includes(tower)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTowers([...selectedTowers, tower]);
                  } else {
                    setSelectedTowers(selectedTowers.filter((t) => t !== tower));
                  }
                }}
              />
              <Label htmlFor={tower}>{tower}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (vendor ? 'Saving...' : 'Creating...') : (vendor ? 'Save Changes' : 'Create Vendor')}
        </Button>
      </div>
    </form>
  );
}

function VendorDetails({ vendor }: { vendor: Vendor }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xl font-bold">
          {vendor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{vendor.name}</h3>
            <StatusBadge status={vendor.status} />
          </div>
          <p className="text-muted-foreground">{vendor.id}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span className="font-medium">{vendor.slaRating}/5</span>
              <span className="text-muted-foreground">SLA Rating</span>
            </div>
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{vendor.approvedTowers.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="font-semibold">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact Person</span>
              <span>{vendor.contactPerson}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{vendor.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{vendor.phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Compliance Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST Number</span>
              <span>{vendor.gstNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN</span>
              <span>{vendor.pan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">MSME Status</span>
              <span>{vendor.msmeStatus ? 'Registered' : 'Not Registered'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compliance Expiry</span>
              <span>{new Date(vendor.complianceExpiry).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Bank Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bank Name</span>
              <span>{vendor.bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Number</span>
              <span>****{vendor.bankDetails.accountNumber.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IFSC Code</span>
              <span>{vendor.bankDetails.ifsc}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold">Service Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor Type</span>
              <span className="capitalize">{vendor.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span>{vendor.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Approved Areas</span>
              <span>{vendor.approvedTowers.length} towers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
