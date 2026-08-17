import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface SiteItem {
  id: string;
  company: string;
  organizationId: string;
  siteProject: string;
  address: string;
  productType: string;
  contact: string;
  totalUsers: number;
  status: string;
  createdBy: string;
  createdDateTime: string;
}

const initialSites: SiteItem[] = [
  {
    id: '47',
    company: 'VC - Demo',
    organizationId: '45',
    siteProject: 'VC - Demo',
    address: '-',
    productType: 'Vibecopilot',
    contact: '-',
    totalUsers: 9,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '10/10/2024, 16:56',
  },
  {
    id: '107',
    company: 'g4',
    organizationId: '-',
    siteProject: 'g4',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 0,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '28/04/2026, 10:58',
  },
  {
    id: '111',
    company: 'Acme Inc.',
    organizationId: '23',
    siteProject: 'qwerty',
    address: 'zbdgtum dt mru zsf djgf',
    productType: '-',
    contact: '-',
    totalUsers: 0,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '28/04/2026, 11:36',
  },
  {
    id: '113',
    company: 'Acme Inc.',
    organizationId: '23',
    siteProject: 'rhtef',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 0,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '28/04/2026, 11:59',
  },
  {
    id: '115',
    company: 'Godrej',
    organizationId: '-',
    siteProject: 'Godrej IT Park',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 3,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '09/05/2026, 13:43',
  },
  {
    id: '84',
    company: 'Vibe FM Company',
    organizationId: '-',
    siteProject: 'Commercial Plaza 20260302052212',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 10,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '02/03/2026, 10:59',
  },
  {
    id: '80',
    company: 'Piramal',
    organizationId: '-',
    siteProject: 'Piramal Tower',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 65,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '22/12/2025, 12:21',
  },
  {
    id: '76',
    company: 'Goyal & Co',
    organizationId: '-',
    siteProject: 'Titanium Tech Park',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 185,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '10/10/2025, 16:32',
  },
  {
    id: '61',
    company: 'Lotus Developers',
    organizationId: '-',
    siteProject: 'Signature',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 3,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '01/02/2025, 23:33',
  },
  {
    id: '75',
    company: 'Lotus Developers',
    organizationId: '-',
    siteProject: 'ArcOne',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 211,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '08/10/2025, 15:08',
  },
  {
    id: '83',
    company: 'Lotus Developers',
    organizationId: '-',
    siteProject: 'Lotus Tower',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 1,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '14/02/2026, 11:53',
  },
  {
    id: '74',
    company: 'Horizon Industrial Parks Limited',
    organizationId: '-',
    siteProject: 'Chakan II',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 35,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '10/10/2025, 14:43',
  },
  {
    id: '77',
    company: 'Horizon Industrial Parks Limited',
    organizationId: '-',
    siteProject: 'Farukh Nagar 1',
    address: '-',
    productType: '-',
    contact: '-',
    totalUsers: 30,
    status: 'active',
    createdBy: 'Admin',
    createdDateTime: '11/11/2025, 11:12',
  },
];

interface Module {
  id: string;
  name: string;
  category: 'core' | 'finance';
}

const availableModules: Module[] = [
  // Core Services
  { id: 'tickets', name: 'Tickets', category: 'core' },
  { id: 'service_tickets', name: 'Service Tickets', category: 'core' },
  { id: 'vendors', name: 'Vendors', category: 'core' },
  { id: 'contacts', name: 'Contacts', category: 'core' },
  { id: 'space_management', name: 'Space Management', category: 'core' },
  { id: 'meeting_management', name: 'Meeting Management', category: 'core' },
  { id: 'assets', name: 'Assets', category: 'core' },
  { id: 'items', name: 'Items', category: 'core' },
  { id: 'staff', name: 'Staff', category: 'core' },
  { id: 'business_cards', name: 'Business Cards', category: 'core' },
  { id: 'communication', name: 'Communication', category: 'core' },
  { id: 'my_tickets', name: 'My Tickets', category: 'core' },
  
  // Financial & Accounting
  { id: 'accounting', name: 'Accounting', category: 'finance' },
  { id: 'purchase_order', name: 'Purchase Order', category: 'finance' },
  { id: 'salary_processing', name: 'Salary Processing', category: 'finance' },
  { id: 'bills', name: 'Bills', category: 'finance' },
  { id: 'bill_pay', name: 'Bill Pay', category: 'finance' },
  { id: 'other_bills', name: 'Other Bills', category: 'finance' },
  { id: 'cam_bill', name: 'CAM Bill', category: 'finance' },
  { id: 'advance_salary', name: 'Advance Salary', category: 'finance' },
];

export default function SiteMaster() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [sites, setSites] = useState<SiteItem[]>(initialSites);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Form states
  const [formSiteName, setFormSiteName] = useState('VC - Demo');
  const [formSiteCode, setFormSiteCode] = useState('VCD');
  const [formSiteType, setFormSiteType] = useState('office');
  const [formAddress, setFormAddress] = useState('123 Enterprise St');
  const [formCountry, setFormCountry] = useState('India');
  const [formState, setFormState] = useState('Maharashtra');
  const [formCity, setFormCity] = useState('Mumbai');
  const [formPincode, setFormPincode] = useState('400001');
  const [formBudgetLimit, setFormBudgetLimit] = useState('1000000');
  const [formActiveProjects, setFormActiveProjects] = useState('1');
  const [formManagerName, setFormManagerName] = useState('Vikram Chaudhary');
  const [formManagerEmail, setFormManagerEmail] = useState('vikram@vibecopilot.com');

  // Contact Person
  const [contactName, setContactName] = useState('John Doe');
  const [contactPhone, setContactPhone] = useState('+1 (555) 123-4567');
  const [contactEmail, setContactEmail] = useState('john.doe@example.com');

  // Module Access
  const [moduleSearch, setModuleSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [checkedModules, setCheckedModules] = useState<Record<string, boolean>>({
    tickets: true,
    vendors: true,
    space_management: true,
    meeting_management: true,
    assets: true,
    communication: true,
    accounting: true,
    cam_bill: true,
  });

  // Collapsible categories
  const [coreOpen, setCoreOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.siteProject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          site.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProductType = productTypeFilter === 'all' || 
                               (productTypeFilter === 'vibecopilot' && site.productType === 'Vibecopilot') ||
                               (productTypeFilter === 'none' && site.productType === '-');
    return matchesSearch && matchesProductType;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSites.length]);

  const handleSelectAllModules = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    availableModules.forEach(mod => {
      // Filter logic: if user searched, only select all visible search results
      if (mod.name.toLowerCase().includes(moduleSearch.toLowerCase())) {
        next[mod.id] = checked;
      } else {
        next[mod.id] = checkedModules[mod.id] || false;
      }
    });
    setCheckedModules(next);
  };

  const handleModuleCheckboxChange = (modId: string, checked: boolean) => {
    setCheckedModules(prev => ({
      ...prev,
      [modId]: checked,
    }));
  };

  // Group modules by category and filter by moduleSearch query
  const coreModules = availableModules.filter(
    m => m.category === 'core' && m.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );
  const financeModules = availableModules.filter(
    m => m.category === 'finance' && m.name.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const isAllChecked = availableModules.every(mod => checkedModules[mod.id]);

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    const newSite: SiteItem = {
      id: String(Math.max(...sites.map(s => Number(s.id))) + 1),
      company: 'VC - Demo',
      organizationId: '45',
      siteProject: formSiteName || 'New Site',
      address: formAddress || '-',
      productType: '-',
      contact: contactName || '-',
      totalUsers: 0,
      status: 'active',
      createdBy: 'Admin',
      createdDateTime: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
    setSites([newSite, ...sites]);
    setView('list');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {view === 'list' ? (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Sites List</h1>
              </div>
              <div>
                <Button 
                  onClick={() => setView('add')}
                  className="bg-[#5F5AF6] hover:bg-[#5F5AF6]/90 text-white font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Site
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="border border-border/50 shadow-sm bg-card">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search site..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background border-border/70 h-10 text-sm"
                    />
                  </div>
                  <div className="w-full md:w-[200px]">
                    <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                      <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                        <SelectValue placeholder="Product Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Product Type</SelectItem>
                        <SelectItem value="vibecopilot">Vibecopilot</SelectItem>
                        <SelectItem value="none">-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="border border-border/50 shadow-sm overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/20">
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Site ID</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Company</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Organization ID</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Site / Project</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Address</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Product Type</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Contact</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Total Users</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Created By</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Created Date & Time</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSites.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((site) => (
                      <TableRow key={site.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-foreground">{site.id}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{site.company}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{site.organizationId}</TableCell>
                        <TableCell className="py-3 px-4 text-foreground font-medium">{site.siteProject}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{site.address}</TableCell>
                        <TableCell className="py-3 px-4">
                          {site.productType !== '-' ? (
                            <Badge variant="outline" className="bg-[#EBEBFF] text-[#5F5AF6] border-none font-semibold px-3 py-0.5 rounded-md text-[10px]">
                              {site.productType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">{site.productType}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{site.contact}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{site.totalUsers}</TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={site.status} className="bg-[#EBEBFF] text-[#5F5AF6] border-none font-semibold px-3 py-0.5 rounded-md" />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{site.createdBy}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground whitespace-nowrap">{site.createdDateTime}</TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-[#5F5AF6] hover:underline font-medium text-xs">
                              Manage Site
                            </button>
                            <span className="text-muted-foreground/30 text-xs">•</span>
                            <button className="text-destructive hover:underline font-medium text-xs">
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSites.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                          No sites found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredSites.length > PAGE_SIZE && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredSites.length / PAGE_SIZE)}
                      onPageChange={setCurrentPage}
                      onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredSites.length / PAGE_SIZE), p + 1))}
                      onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <form onSubmit={handleSaveSite} className="space-y-6">
            {/* Header */}
            <div className="border-b pb-5 border-border/50">
              <h1 className="text-3xl font-bold text-foreground">Add New Site</h1>
            </div>

            {/* Site Details Card */}
            <Card className="border border-border/50 shadow-sm bg-card p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Site Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName" className="text-sm font-semibold text-foreground">Name *</Label>
                  <Input
                    id="siteName"
                    value={formSiteName}
                    onChange={(e) => setFormSiteName(e.target.value)}
                    placeholder="Enter site name"
                    className="bg-background border-border/70 h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteCode" className="text-sm font-semibold text-foreground">Code *</Label>
                  <Input
                    id="siteCode"
                    value={formSiteCode}
                    onChange={(e) => setFormSiteCode(e.target.value)}
                    placeholder="Enter site code"
                    className="bg-background border-border/70 h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Site Type *</Label>
                  <Select value={formSiteType} onValueChange={formSiteType => setFormSiteType(formSiteType)}>
                    <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                      <SelectValue placeholder="Select site type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office Building</SelectItem>
                      <SelectItem value="industrial">Industrial Complex</SelectItem>
                      <SelectItem value="campus">Educational Campus</SelectItem>
                      <SelectItem value="retail">Retail Mall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-foreground">Address</Label>
                  <Input
                    id="address"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Enter address"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold text-foreground">Country</Label>
                  <Input
                    id="country"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="Enter country"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold text-foreground">State</Label>
                  <Input
                    id="state"
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="Enter state"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-foreground">City</Label>
                  <Input
                    id="city"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="Enter city"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-sm font-semibold text-foreground">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value)}
                    placeholder="Enter pincode"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetLimit" className="text-sm font-semibold text-foreground">Budget Limit</Label>
                  <Input
                    id="budgetLimit"
                    value={formBudgetLimit}
                    onChange={(e) => setFormBudgetLimit(e.target.value)}
                    placeholder="Enter budget limit"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activeProjects" className="text-sm font-semibold text-foreground">Active Projects</Label>
                  <Input
                    id="activeProjects"
                    value={formActiveProjects}
                    onChange={(e) => setFormActiveProjects(e.target.value)}
                    placeholder="Enter active projects count"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                {/* Custom fields instead of lat/long */}
                <div className="space-y-2">
                  <Label htmlFor="managerName" className="text-sm font-semibold text-foreground">Site Manager Name</Label>
                  <Input
                    id="managerName"
                    value={formManagerName}
                    onChange={(e) => setFormManagerName(e.target.value)}
                    placeholder="Enter site manager name"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerEmail" className="text-sm font-semibold text-foreground">Site Manager Email</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formManagerEmail}
                    onChange={(e) => setFormManagerEmail(e.target.value)}
                    placeholder="Enter site manager email"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
              </div>
            </Card>

            {/* Contact Person Card */}
            <Card className="border border-border/50 shadow-sm bg-card p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Contact Person</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="text-sm font-semibold text-foreground">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-background border-border/70 h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-semibold text-foreground">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-semibold text-foreground">Email Address</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    className="bg-background border-border/70 h-10"
                  />
                </div>
              </div>
            </Card>

            {/* Module Access Card */}
            <Card className="border border-border/50 shadow-sm bg-card p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Module Access</h2>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search modules..."
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      className="pl-10 bg-background border-border/70 h-10 text-sm"
                    />
                  </div>
                  <Button type="button" className="bg-[#5F5AF6] hover:bg-[#5F5AF6]/90 text-white font-medium h-10">
                    + Add Module
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <button type="button" className="text-[#5F5AF6] hover:underline text-sm font-medium">
                    Bulk Import (CSV)
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider whitespace-nowrap">Assign to Role:</span>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-[120px] bg-background border-border/70 h-10 text-sm">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Select All Modules checkbox */}
              <div className="flex items-center gap-2 py-2 border-b border-border/40">
                <Checkbox
                  id="selectAllModules"
                  checked={isAllChecked}
                  onCheckedChange={handleSelectAllModules}
                  className="border-primary data-[state=checked]:bg-[#5F5AF6]"
                />
                <Label htmlFor="selectAllModules" className="cursor-pointer text-sm font-semibold text-foreground">
                  Select All Modules
                </Label>
              </div>

              {/* Collapsible grouped categories */}
              <div className="space-y-4">
                {/* Core Services Category */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
                  <button
                    type="button"
                    onClick={() => setCoreOpen(!coreOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/50"
                  >
                    <span className="text-sm font-bold text-foreground uppercase tracking-wider">Core Services</span>
                    {coreOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {coreOpen && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coreModules.map(mod => (
                        <div key={mod.id} className="flex items-start gap-2.5">
                          <Checkbox
                            id={mod.id}
                            checked={checkedModules[mod.id] || false}
                            onCheckedChange={(checked) => handleModuleCheckboxChange(mod.id, !!checked)}
                            className="border-primary mt-0.5 data-[state=checked]:bg-[#5F5AF6]"
                          />
                          <Label htmlFor={mod.id} className="cursor-pointer text-sm font-normal text-foreground leading-tight">
                            {mod.name}
                          </Label>
                        </div>
                      ))}
                      {coreModules.length === 0 && (
                        <span className="text-xs text-muted-foreground col-span-2">No matching modules found in Core Services.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Financial & Accounting Category */}
                <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
                  <button
                    type="button"
                    onClick={() => setFinanceOpen(!financeOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors border-b border-border/50"
                  >
                    <span className="text-sm font-bold text-foreground uppercase tracking-wider">Financial & Accounting</span>
                    {financeOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {financeOpen && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {financeModules.map(mod => (
                        <div key={mod.id} className="flex items-start gap-2.5">
                          <Checkbox
                            id={mod.id}
                            checked={checkedModules[mod.id] || false}
                            onCheckedChange={(checked) => handleModuleCheckboxChange(mod.id, !!checked)}
                            className="border-primary mt-0.5 data-[state=checked]:bg-[#5F5AF6]"
                          />
                          <Label htmlFor={mod.id} className="cursor-pointer text-sm font-normal text-foreground leading-tight">
                            {mod.name}
                          </Label>
                        </div>
                      ))}
                      {financeModules.length === 0 && (
                        <span className="text-xs text-muted-foreground col-span-2">No matching modules found in Financial & Accounting.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setView('list')}
                  className="border-border/70 hover:bg-muted/30 text-sm font-medium h-10 px-6 rounded-md"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#5F5AF6] hover:bg-[#5F5AF6]/90 text-white font-medium h-10 px-6 rounded-md"
                >
                  Save Site
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
