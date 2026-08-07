import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon } from 'lucide-react';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface OrganizationItem {
  id: string;
  name: string;
  companyName: string;
  entityName: string;
  totalSites: number;
  country: string;
  region: string;
  state: string;
  city: string;
  zone: string;
  status: string;
  createdDateTime: string;
  createdBy: string;
}

const initialOrgs: OrganizationItem[] = [
  {
    id: '1',
    name: 'Logicon',
    companyName: '-',
    entityName: '-',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/11/2024, 20:52',
    createdBy: 'Admin',
  },
  {
    id: '2',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '25/04/2026, 11:57',
    createdBy: 'Admin',
  },
  {
    id: '3',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 10:13',
    createdBy: 'Admin',
  },
  {
    id: '4',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 10:14',
    createdBy: 'Admin',
  },
  {
    id: '5',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 10:20',
    createdBy: 'Admin',
  },
  {
    id: '6',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 11:08',
    createdBy: 'Admin',
  },
  {
    id: '7',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 11:34',
    createdBy: 'Admin',
  },
  {
    id: '8',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 11:59',
    createdBy: 'Admin',
  },
  {
    id: '9',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 12:04',
    createdBy: 'Admin',
  },
  {
    id: '10',
    name: 'pratganes Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 12:07',
    createdBy: 'Admin',
  },
  {
    id: '11',
    name: 'Acme Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 12:20',
    createdBy: 'Admin',
  },
  {
    id: '12',
    name: 'qwerty Corporation',
    companyName: 'Acme Inc.',
    entityName: 'Acme Global Entity',
    totalSites: 0,
    country: '-',
    region: '-',
    state: '-',
    city: '-',
    zone: '-',
    status: 'active',
    createdDateTime: '28/04/2026, 12:20',
    createdBy: 'Admin',
  },
];

export default function OrganizationMaster() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [organizations, setOrganizations] = useState<OrganizationItem[]>(initialOrgs);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  // Form states
  const [formOrgName, setFormOrgName] = useState('Acme Corporation');
  const [formCompName, setFormCompName] = useState('Acme Inc.');
  const [formEntity, setFormEntity] = useState('Acme Global Entity');
  const [formSite, setFormSite] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formRegion, setFormRegion] = useState('');
  const [formState, setFormState] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formWhiteLabel, setFormWhiteLabel] = useState(false);
  const [formSubdomain, setFormSubdomain] = useState('www.hml.com');
  const [formSolutionType, setFormSolutionType] = useState('');
  const [formSolutionFor, setFormSolutionFor] = useState('');
  const [formBillingTerm, setFormBillingTerm] = useState('');
  const [formBillingRate, setFormBillingRate] = useState('');
  const [formBillingCycle, setFormBillingCycle] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formProjectDuration, setFormProjectDuration] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBillingDate, setFormBillingDate] = useState('');

  const handleClearFilters = () => {
    setSearchQuery('');
    setRegionFilter('all');
    setCountryFilter('all');
    setStateFilter('all');
    setCityFilter('all');
    setZoneFilter('all');
  };

  const handleSaveOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    // Add logic here in Phase 2. For Phase 1, just transition back to list
    const newOrg: OrganizationItem = {
      id: String(organizations.length + 1),
      name: formOrgName || 'New Org',
      companyName: formCompName || '-',
      entityName: formEntity || '-',
      totalSites: 0,
      country: formCountry || '-',
      region: formRegion || '-',
      state: formState || '-',
      city: formCity || '-',
      zone: formZone || '-',
      status: 'active',
      createdDateTime: new Date().toLocaleDateString('en-GB') + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      createdBy: 'Admin',
    };
    setOrganizations([newOrg, ...organizations]);
    setView('list');
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          org.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          org.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrgs.length]);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {view === 'list' ? (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Organization List</h1>
              </div>
              <div>
                <Button 
                  onClick={() => setView('add')}
                  className="bg-[#5F5AF6] hover:bg-[#5F5AF6]/90 text-white font-medium"
                >
                  Add Organization
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="border border-border/50 shadow-sm bg-card">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-2 space-y-1.5">
                      <Input
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border-border/70 text-sm h-10"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Select value={regionFilter} onValueChange={setRegionFilter}>
                        <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                          <SelectValue placeholder="Region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Region</SelectItem>
                          <SelectItem value="north">North</SelectItem>
                          <SelectItem value="south">South</SelectItem>
                          <SelectItem value="east">East</SelectItem>
                          <SelectItem value="west">West</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Select value={countryFilter} onValueChange={countryFilter => setCountryFilter(countryFilter)}>
                        <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Country</SelectItem>
                          <SelectItem value="in">India</SelectItem>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Select value={stateFilter} onValueChange={stateFilter => setStateFilter(stateFilter)}>
                        <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">State</SelectItem>
                          <SelectItem value="mh">Maharashtra</SelectItem>
                          <SelectItem value="dl">Delhi</SelectItem>
                          <SelectItem value="ka">Karnataka</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Select value={cityFilter} onValueChange={cityFilter => setCityFilter(cityFilter)}>
                        <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">City</SelectItem>
                          <SelectItem value="mumbai">Mumbai</SelectItem>
                          <SelectItem value="delhi">Delhi</SelectItem>
                          <SelectItem value="bangalore">Bangalore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Select value={zoneFilter} onValueChange={zoneFilter => setZoneFilter(zoneFilter)}>
                        <SelectTrigger className="bg-background border-border/70 text-muted-foreground text-sm h-10">
                          <SelectValue placeholder="Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Zone</SelectItem>
                          <SelectItem value="east">East Zone</SelectItem>
                          <SelectItem value="west">West Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 lg:col-span-1">
                      <Button 
                        variant="outline" 
                        onClick={handleClearFilters}
                        className="w-full border-border/70 hover:bg-muted/30 text-sm font-normal h-10"
                      >
                        Clear Filters
                      </Button>
                    </div>
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
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Organization Name</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Company Name</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Entity Name</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Total Sites</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Country</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Region</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">State</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">City</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Zone</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Status</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Created Date Time</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider">Created By</TableHead>
                      <TableHead className="py-4 px-4 font-semibold text-foreground text-xs uppercase tracking-wider text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((org) => (
                      <TableRow key={org.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3 px-4 font-medium text-foreground">{org.name}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.companyName}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.entityName}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.totalSites}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.country}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.region}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.state}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.city}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.zone}</TableCell>
                        <TableCell className="py-3 px-4">
                          <StatusBadge status={org.status} className="bg-[#EBEBFF] text-[#5F5AF6] border-none font-semibold px-3 py-0.5 rounded-md" />
                        </TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground whitespace-nowrap">{org.createdDateTime}</TableCell>
                        <TableCell className="py-3 px-4 text-muted-foreground">{org.createdBy}</TableCell>
                        <TableCell className="py-3 px-4 text-right">
                          <button className="text-[#5F5AF6] hover:underline font-medium text-sm">
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={13} className="py-8 text-center text-muted-foreground">
                          No organizations found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredOrgs.length > PAGE_SIZE && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <DataTablePagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(filteredOrgs.length / PAGE_SIZE)}
                      onPageChange={setCurrentPage}
                      onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredOrgs.length / PAGE_SIZE), p + 1))}
                      onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : (
          <form onSubmit={handleSaveOrganization} className="space-y-6">
            {/* Header */}
            <div className="border-b pb-5 border-border/50">
              <h1 className="text-3xl font-bold text-foreground">Add New Organization</h1>
            </div>

            <Card className="border border-border/50 shadow-sm bg-card p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Organization Details</h2>
                <p className="text-muted-foreground text-sm mt-1">Provide the essential information for the new organization.</p>
              </div>

              {/* General Information Section */}
              <div className="space-y-4 pt-2 border-t border-border/40">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">General Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-sm font-semibold text-foreground">
                      Organization Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="orgName"
                      value={formOrgName}
                      onChange={(e) => setFormOrgName(e.target.value)}
                      placeholder="Acme Corporation"
                      className="bg-background border-border/70 h-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Details Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Company details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="compName" className="text-sm font-semibold text-foreground">
                      Company Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="compName"
                      value={formCompName}
                      onChange={(e) => setFormCompName(e.target.value)}
                      placeholder="Acme Inc."
                      className="bg-background border-border/70 h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity" className="text-sm font-semibold text-foreground">Entity</Label>
                    <Input
                      id="entity"
                      value={formEntity}
                      onChange={(e) => setFormEntity(e.target.value)}
                      placeholder="Acme Global Entity"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site" className="text-sm font-semibold text-foreground">Site</Label>
                    <Input
                      id="site"
                      value={formSite}
                      onChange={(e) => setFormSite(e.target.value)}
                      placeholder="Enter your site"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Location Details Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-semibold text-foreground">Country</Label>
                    <Input
                      id="country"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="Select or type country"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm font-semibold text-foreground">Region</Label>
                    <Input
                      id="region"
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                      placeholder="Select or type region"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-semibold text-foreground">State</Label>
                    <Input
                      id="state"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      placeholder="Select or type state"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-foreground">City</Label>
                    <Input
                      id="city"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="Select or type city"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="zone" className="text-sm font-semibold text-foreground">Zone</Label>
                    <Input
                      id="zone"
                      value={formZone}
                      onChange={(e) => setFormZone(e.target.value)}
                      placeholder="Select or type zone"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Advanced Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-2 flex flex-col justify-center">
                    <Label htmlFor="whiteLabel" className="text-sm font-semibold text-foreground mb-1">White Label</Label>
                    <div className="h-10 flex items-center">
                      <Switch
                        id="whiteLabel"
                        checked={formWhiteLabel}
                        onCheckedChange={setFormWhiteLabel}
                        className="data-[state=checked]:bg-[#5F5AF6]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="subdomain" className="text-sm font-semibold text-foreground">Sub - Domain</Label>
                    <Input
                      id="subdomain"
                      value={formSubdomain}
                      onChange={(e) => setFormSubdomain(e.target.value)}
                      placeholder="www.hml.com"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Section */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Billing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Solution Type</Label>
                    <Select value={formSolutionType} onValueChange={setFormSolutionType}>
                      <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                        <SelectValue placeholder="-- Please choose an option --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS Subscription</SelectItem>
                        <SelectItem value="onprem">On-Premise Enterprise</SelectItem>
                        <SelectItem value="managed">Managed Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Solution For</Label>
                    <Select value={formSolutionFor} onValueChange={setFormSolutionFor}>
                      <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                        <SelectValue placeholder="-- Please choose an option --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Property</SelectItem>
                        <SelectItem value="portfolio">Multi-Property Portfolio</SelectItem>
                        <SelectItem value="corporate">Global Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Billing Term</Label>
                    <Select value={formBillingTerm} onValueChange={setFormBillingTerm}>
                      <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                        <SelectValue placeholder="-- Please choose an option --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly Advance</SelectItem>
                        <SelectItem value="net30">Net 30 Days</SelectItem>
                        <SelectItem value="annual">Annual Advance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingRate" className="text-sm font-semibold text-foreground">Rate of Billing</Label>
                    <Input
                      id="billingRate"
                      value={formBillingRate}
                      onChange={(e) => setFormBillingRate(e.target.value)}
                      placeholder="Enter billing rate"
                      className="bg-background border-border/70 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Billing Cycle</Label>
                    <Select value={formBillingCycle} onValueChange={setFormBillingCycle}>
                      <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                        <SelectValue placeholder="-- Please choose an option --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-semibold text-foreground">Start Date</Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="bg-background border-border/70 h-10 pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-foreground">Project Duration</Label>
                    <Select value={formProjectDuration} onValueChange={setFormProjectDuration}>
                      <SelectTrigger className="bg-background border-border/70 h-10 text-muted-foreground text-sm">
                        <SelectValue placeholder="-- Please choose an option --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6m">6 Months</SelectItem>
                        <SelectItem value="1y">1 Year</SelectItem>
                        <SelectItem value="2y">2 Years</SelectItem>
                        <SelectItem value="3y">3 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-semibold text-foreground">End Date</Label>
                    <div className="relative">
                      <Input
                        id="endDate"
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="bg-background border-border/70 h-10 pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingDate" className="text-sm font-semibold text-foreground">Billing Date</Label>
                    <div className="relative">
                      <Input
                        id="billingDate"
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={formBillingDate}
                        onChange={(e) => setFormBillingDate(e.target.value)}
                        className="bg-background border-border/70 h-10 pr-10"
                      />
                      <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
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
                  Save Organization
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
