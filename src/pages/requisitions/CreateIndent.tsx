import { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { requisitionsAPI } from '@/api/requisitions';
import { commonAPI } from '@/api/common';
import { ordersAPI } from '@/api/orders';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkflowTimeline } from '@/components/dashboard/WorkflowTimeline';
import { StatusBadge } from '@/components/ui/status-badge';
import { WorkflowContainer } from '@/components/workflow/WorkflowContainer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Upload,
  CalendarIcon,
  FileText,
  Save,
  Send,
  AlertCircle,
  Search,
  Eye,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { IndentItem, Approval } from '@/types';

const defaultCategories = [{ value: 'electrical', label: 'Electrical' }, { value: 'hvac', label: 'HVAC' }, { value: 'plumbing', label: 'Plumbing' }, { value: 'housekeeping', label: 'Housekeeping' }, { value: 'security', label: 'Security' }];
const defaultTowers = [{ value: 'tower_a', label: 'Tower A' }, { value: 'tower_b', label: 'Tower B' }];
const defaultFloors = Array.from({ length: 15 }, (_, i) => ({ value: `${i + 1}f`, label: `${i + 1}${['st', 'nd', 'rd'][i] || 'th'} Floor` }));
const defaultRequestTypes = [{ value: 'material', label: 'Material Request' }, { value: 'service', label: 'Service Request' }, { value: 'amc', label: 'AMC Request' }];
const defaultBudgetHeads = [{ value: 'opex', label: 'OPEX (Operational)' }, { value: 'capex', label: 'CAPEX (Capital)' }];

export default function CreateIndent() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const isListView = ['/requisitions/my-requests', '/requisitions/approvals', '/requisitions/all'].includes(location.pathname) || location.pathname.startsWith('/indents/');
  
  const [invStatus, setInvStatus] = useState('fully_available');
  const [invComments, setInvComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState<any[]>(defaultCategories);
  const [towers, setTowers] = useState<any[]>(defaultTowers);
  const [floors, setFloors] = useState<any[]>(defaultFloors);
  const [requestTypes, setRequestTypes] = useState<any[]>(defaultRequestTypes);
  const [budgetHeads, setBudgetHeads] = useState<any[]>(defaultBudgetHeads);

  const [items, setItems] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [requestType, setRequestType] = useState<string>('material');
  const [selectedTower, setSelectedTower] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetHead, setBudgetHead] = useState<string>('opex');
  const [requiredDate, setRequiredDate] = useState<Date>();
  const [justification, setJustification] = useState('');
  const [indentItems, setIndentItems] = useState<IndentItem[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('upload/', formData);
      setAttachments(prev => [...prev, { name: res.name, url: res.url, size: res.size }]);
      toast({ title: 'Upload Successful', description: `${file.name} uploaded.` });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const [indentsList, setIndentsList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIndentDetail, setSelectedIndentDetail] = useState<any | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [rfqsList, setRfqsList] = useState<any[]>([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const itemsData = await commonAPI.getItems();
        if (itemsData) {
          const list = Array.isArray(itemsData) ? itemsData : (itemsData.results ?? []);
          const mapped = list.map((i: any) => ({
            id: i.id,
            name: i.name,
            uom: i.uom,
            unitPrice: i.unit_price ?? i.unitPrice ?? 0,
            category: i.category,
            currentStock: i.current_stock ?? 0,
          }));
          setItems(mapped);
        }
        
        const vendorsData = await commonAPI.getVendors();
        if (vendorsData) {
          const list = Array.isArray(vendorsData) ? vendorsData : (vendorsData.results ?? []);
          const mapped = list.map((v: any) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            slaRating: v.sla_rating ?? v.slaRating ?? 0,
            status: v.status,
          }));
          setVendors(mapped);
        }

        const fieldsData = await api.get('setups/inventory-master-fields/');
        if (fieldsData) {
          const fields = Array.isArray(fieldsData) ? fieldsData : (fieldsData.results ?? []);
          const activeFields = fields.filter((f: any) => f.is_active);
          
          const cats = activeFields.filter((f: any) => f.field_type === 'category');
          if (cats.length > 0) setCategories(cats);
          
          const twrs = activeFields.filter((f: any) => f.field_type === 'tower');
          if (twrs.length > 0) setTowers(twrs);
          
          const flrs = activeFields.filter((f: any) => f.field_type === 'floor');
          if (flrs.length > 0) setFloors(flrs);
          
          const reqs = activeFields.filter((f: any) => f.field_type === 'request_type');
          if (reqs.length > 0) setRequestTypes(reqs);
          
          const bgts = activeFields.filter((f: any) => f.field_type === 'budget_head');
          if (bgts.length > 0) setBudgetHeads(bgts);
        }
      } catch (err) {
        console.error('Error fetching items or vendors:', err);
      }
    };
    fetchCatalog();
  }, []);

  const fetchIndents = async () => {
    setIsLoading(true);
    try {
      const approvalsQuery = location.pathname === '/requisitions/approvals' ? '?approvals_only=true' : '';
      const data = await requisitionsAPI.getIndents(approvalsQuery);
      if (data) {
        setIndentsList(Array.isArray(data) ? data : (data.results ?? []));
      }
    } catch (err) {
      console.error('Error fetching indents list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPOs = async () => {
    try {
      const data = await ordersAPI.getOrders();
      if (data) {
        setPurchaseOrders(Array.isArray(data) ? data : (data.results ?? []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRfqs = async () => {
    try {
      const data = await api.get('rfqs/');
      if (data) {
        setRfqsList(Array.isArray(data) ? data : (data.results ?? []));
      }
    } catch (err) {
      console.error('Error fetching RFQs:', err);
    }
  };

  useEffect(() => {
    if (isListView) {
      fetchIndents();
      fetchPOs();
      fetchRfqs();
    }
  }, [isListView, location.pathname]);

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = indentsList.find((item) => String(item.id) === String(id));
    if (found) {
      setSelectedIndentDetail(found);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/requisitions/all');
    }
  }, [id, isLoading, indentsList, navigate]);

  useEffect(() => {
    if (selectedIndentDetail) {
      const updated = indentsList.find((item) => String(item.id) === String(selectedIndentDetail.id));
      if (updated) {
        setSelectedIndentDetail(updated);
      } else {
        setSelectedIndentDetail(null);
      }
    }
  }, [indentsList]);


  const getFilteredIndents = () => {
    let list = indentsList.filter((indent) => {
      const matchesSearch =
        (indent.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (indent.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (indent.tower || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = false;
      if (statusFilter === 'all') {
        matchesStatus = true;
      } else if (statusFilter === 'converted_to_rfq') {
        matchesStatus = rfqsList.some(r => r.linked_pr === indent.id);
      } else if (statusFilter === 'approved') {
        matchesStatus = indent.status === 'approved' && !rfqsList.some(r => r.linked_pr === indent.id);
      } else if (statusFilter === 'pending') {
        matchesStatus = indent.status.startsWith('pending') || indent.status === 'submitted' || indent.status.includes('review') || indent.status.includes('approval');
      } else {
        matchesStatus = indent.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });

    if (location.pathname === '/requisitions/my-requests') {
      if (['site_keeper', 'site_manager', 'site_engineer'].includes(user?.role || '')) {
        return list.filter((i) => i.created_by === user.email);
      }
      if (user?.role === 'store_keeper') {
        return list.filter((i) => i.status === 'pending_store_keeper');
      }
      return list.filter((i) => i.created_by === user?.email);
    }

    if (location.pathname === '/requisitions/approvals') {
      if (user?.role === 'store_keeper') {
        return list.filter((i) => i.status === 'pending_store_keeper');
      }
      if (user?.role === 'procurement_manager') {
        return list.filter((i) => i.status === 'pending_procurement_manager');
      }
      if (user?.role === 'facility_manager') {
        return list.filter((i) => i.status === 'pending_facility_manager');
      }
      if (user?.role === 'super_admin') {
        return list.filter((i) => !['draft', 'approved', 'rejected'].includes(i.status));
      }
      return [];
    }

    return list;
  };

  const filteredItems = items.filter((item) => {
    if (!selectedCategory) return true;
    return (item.category || '').toLowerCase() === (selectedCategory || '').toLowerCase();
  });

  const addItem = () => {
    setIndentItems([
      ...indentItems,
      { itemId: '', itemName: '', quantity: 1, uom: '', estimatedRate: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setIndentItems(indentItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof IndentItem, value: string | number) => {
    const updated = [...indentItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill item details when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find((i) => String(i.id) === value);
      if (selectedItem) {
        updated[index] = {
          ...updated[index],
          itemName: selectedItem.name,
          uom: selectedItem.uom,
          estimatedRate: selectedItem.unitPrice,
          currentStock: selectedItem.currentStock,
        };
      }
    }
    
    setIndentItems(updated);
  };

  const totalEstimatedCost = indentItems.reduce(
    (sum, item) => sum + item.quantity * item.estimatedRate,
    0
  );

  const [approvalWorkflow, setApprovalWorkflow] = useState<Approval[]>([]);

  useEffect(() => {
    setApprovalWorkflow([
      { id: '1', stage: 'Created by Site Manager', approver: 'Site Manager', approverRole: 'site_manager', status: 'approved' },
      { id: '2', stage: 'Approved by Store Keeper', approver: 'Store Keeper', approverRole: 'store_keeper', status: 'pending' },
      { id: '3', stage: 'Approved by Procurement Manager', approver: 'Procurement Manager', approverRole: 'procurement_manager', status: 'pending' },
      { id: '4', stage: 'Approved by Facility Manager', approver: 'Facility Manager', approverRole: 'facility_manager', status: 'pending' },
      { id: '5', stage: 'Completed', approver: 'System', approverRole: 'system', status: 'pending' },
    ]);
  }, []);
  const handleSaveDraft = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await requisitionsAPI.createIndent({
        id: `IND-${Date.now()}`,
        type: requestType,
        tower: selectedTower,
        floor: selectedFloor,
        category: selectedCategory,
        items: indentItems.map(item => ({
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: item.quantity,
          uom: item.uom,
          estimated_rate: item.estimatedRate,
        })),
        estimated_cost: totalEstimatedCost,
        required_date: requiredDate ? requiredDate.toISOString().split('T')[0] : null,
        budget_head: budgetHead,
        justification,
        attachments,
        status: 'draft',
      });
      toast({ title: 'Draft Saved', description: 'Your indent has been saved as draft.' });
      navigate('/requisitions/my-requests');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedTower || !selectedFloor || !selectedCategory || indentItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields and add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const indentId = `IND-${Date.now()}`;
      await requisitionsAPI.createIndent({
        id: indentId,
        type: requestType,
        tower: selectedTower,
        floor: selectedFloor,
        category: selectedCategory,
        items: indentItems.map(item => ({
          item_id: item.itemId,
          item_name: item.itemName,
          quantity: item.quantity,
          uom: item.uom,
          estimated_rate: item.estimatedRate,
        })),
        estimated_cost: totalEstimatedCost,
        required_date: requiredDate ? requiredDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        budget_head: budgetHead,
        justification,
        attachments,
        status: 'submitted',
      });

      try {
        await api.post('workflows/submit/', {
          module: 'indents',
          entity_id: indentId,
        });
      } catch (wfErr) {
        console.error('Workflow submission failed:', wfErr);
      }

      toast({
        title: 'Indent Submitted',
        description: 'Your indent has been submitted for approval.',
      });
      setIndentItems([]);
      setJustification('');
      setSelectedTower('');
      setSelectedFloor('');
      setSelectedCategory('');
      setRequiredDate(undefined);
      navigate('/requisitions/my-requests');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInventoryCheckSubmit = async () => {
    if (!selectedIndentDetail) return;
    try {
      await api.post(`indents/${selectedIndentDetail.id}/inventory-check/`, {
        inventory_status: invStatus,
        inventory_recommendation: invComments
      });
      toast({
        title: 'Inventory Check Submitted',
        description: 'Inventory availability status has been updated successfully.'
      });
      fetchIndents();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <MainLayout>
      {isListView ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {location.pathname === '/requisitions/approvals' 
                  ? 'Requisition Approvals' 
                  : location.pathname === '/requisitions/all' 
                    ? 'All Requisitions' 
                    : 'My Requests'}
              </h1>
              <p className="text-muted-foreground">
                {location.pathname === '/requisitions/approvals'
                  ? 'Verify stock availability and approve pending requisitions'
                  : location.pathname === '/requisitions/all'
                    ? 'View and manage all organization indents'
                    : 'Track and manage your submitted indents and MOR requests'}
              </p>
            </div>
            {['site_keeper', 'site_manager', 'site_engineer', 'super_admin'].includes(user?.role || '') && (
              <Button onClick={() => navigate('/requisitions/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, Category, Tower..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="converted_to_rfq">Converted to RFQ</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="sent_back">Sent Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked PO</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {getFilteredIndents().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredIndents().map((indent) => {
                        // Find linked PO
                        const linkedRfq = rfqsList.find(r => r.linked_pr === indent.id);
                        const linkedPo = purchaseOrders.find(p => p.linked_rfq === linkedRfq?.id);

                        return (
                          <TableRow key={indent.id}>
                            <TableCell className="font-mono text-sm">{indent.id}</TableCell>
                            <TableCell className="capitalize">{indent.type}</TableCell>
                            <TableCell className="capitalize">{indent.category}</TableCell>
                            <TableCell>{indent.tower} - {indent.floor}</TableCell>
                            <TableCell className="font-semibold">
                              ₹{Number(indent.estimated_cost || 0).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>{indent.required_date}</TableCell>
                            <TableCell>
                              <StatusBadge status={rfqsList.some(r => r.linked_pr === indent.id) ? 'converted_to_rfq' : indent.status} />
                            </TableCell>
                            <TableCell>
                              {linkedPo ? (
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-bold text-blue-600 dark:text-blue-400"
                                  onClick={() => navigate('/orders/po')}
                                >
                                  {linkedPo.id}
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">No PO yet</span>
                              )}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIndentDetail(indent)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {indent.status === 'approved' &&
                               ['procurement_manager', 'super_admin'].includes(user?.role || '') &&
                               !rfqsList.some(r => r.linked_pr === indent.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tendering/rfq?convert_indent=${indent.id}`);
                                  }}
                                >
                                  Convert to RFQ
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Details Dialog */}
          <Dialog open={!!selectedIndentDetail} onOpenChange={(open) => {
            if (!open) {
              setSelectedIndentDetail(null);
              if (id) {
                navigate('/requisitions/all');
              }
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center mr-6">
                  <span>Indent Details - {selectedIndentDetail?.id}</span>
                  {selectedIndentDetail && (
                    <StatusBadge status={rfqsList.some(r => r.linked_pr === selectedIndentDetail.id) ? 'converted_to_rfq' : selectedIndentDetail.status} />
                  )}
                </DialogTitle>
                <DialogDescription>
                  Detailed breakdown of the requisition request and its workflow approval stage
                </DialogDescription>
              </DialogHeader>

              {selectedIndentDetail && (
                <div className="space-y-6 pt-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Request Type</p>
                      <p className="text-sm font-semibold capitalize">{selectedIndentDetail.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Category</p>
                      <p className="text-sm font-semibold capitalize">{selectedIndentDetail.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Budget Head</p>
                      <p className="text-sm font-semibold uppercase">{selectedIndentDetail.budget_head}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold">Location</p>
                      <p className="text-sm font-semibold">
                        {selectedIndentDetail.tower} - {selectedIndentDetail.floor}
                      </p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Required Date</p>
                      <p className="text-sm font-semibold">{selectedIndentDetail.required_date}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Estimated Cost</p>
                      <p className="text-sm font-semibold text-primary">
                        ₹{Number(selectedIndentDetail.estimated_cost || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                    {selectedIndentDetail.inventory_status && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Inventory Status</p>
                        <p className="text-sm font-semibold capitalize">
                          {selectedIndentDetail.inventory_status.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    {selectedIndentDetail.inventory_recommendation && (
                      <div className="mt-2 col-span-2">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Store Recommendation</p>
                        <p className="text-sm font-semibold">
                          {selectedIndentDetail.inventory_recommendation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Justification */}
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Justification</h3>
                    <p className="text-sm text-muted-foreground bg-muted/10 p-3 rounded border">
                      {selectedIndentDetail.justification || 'No justification provided.'}
                    </p>
                  </div>

                  {/* Attachments */}
                  {selectedIndentDetail.attachments && selectedIndentDetail.attachments.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Attachments</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedIndentDetail.attachments.map((file: any, index: number) => (
                          <a 
                            key={index} 
                            href={file.url ? (file.url.startsWith('http') ? file.url : `${((import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))).replace(/\/$/, '')}/${file.url.replace(/^\//, '')}`) : '#'} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm text-primary bg-primary/5 p-2 px-3 rounded border border-primary/20 hover:bg-primary/10 flex items-center gap-2 transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            {file.name || 'Attachment'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items Table */}
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Requested Items / Services</h3>
                    <Table className="border rounded-lg overflow-hidden">
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>UOM</TableHead>
                          <TableHead>Est. Rate</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(selectedIndentDetail.items || []).map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{item.item_name || item.itemName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.uom || 'Nos'}</TableCell>
                            <TableCell>₹{Number(item.estimated_rate || item.estimatedRate || 0).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{Number((item.quantity || 0) * (item.estimated_rate || item.estimatedRate || 0)).toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Linked Purchase Order (if created) */}
                  {(() => {
                    const rfq = rfqsList.find(r => r.linked_pr === selectedIndentDetail.id);
                    const po = purchaseOrders.find(p => p.linked_rfq === rfq?.id);

                    if (po) {
                      return (
                        <div className="p-4 border border-success/30 bg-success/5 rounded-lg space-y-2">
                          <h4 className="font-bold text-sm text-success flex items-center gap-2">
                            <span>✔ Linked Purchase Order Generated</span>
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-muted-foreground font-semibold">PO Number</p>
                              <Button
                                variant="link"
                                className="p-0 h-auto font-bold text-blue-600 dark:text-blue-400 text-xs"
                                onClick={() => {
                                  setSelectedIndentDetail(null);
                                  navigate('/orders/po');
                                }}
                              >
                                {po.id}
                              </Button>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">Vendor</p>
                              <p className="font-medium">{po.vendor_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">PO Value</p>
                              <p className="font-medium">₹{Number(po.net_value || po.totalValue || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground font-semibold">PO Status</p>
                              <p className="font-medium capitalize">{po.status}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Action Panel */}
                  {selectedIndentDetail.status === 'pending_store_keeper' && user?.role === 'store_keeper' && (
                    <div className="p-4 border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 rounded-lg space-y-4">
                      <h4 className="font-bold text-sm text-blue-700 dark:text-blue-400">Inventory Stock Verification</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stock Availability Status *</Label>
                          <Select value={invStatus} onValueChange={setInvStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fully_available">Fully Available (In-Stock)</SelectItem>
                              <SelectItem value="partially_available">Partially Available</SelectItem>
                              <SelectItem value="not_available">Not Available (Required Procurement)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Recommendation / Comments</Label>
                          <Textarea 
                            placeholder="Enter store check comments..."
                            value={invComments}
                            onChange={(e) => setInvComments(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button onClick={handleInventoryCheckSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Save Inventory Details
                      </Button>
                    </div>
                  )}

                  {selectedIndentDetail.status === 'approved' && user?.role === 'procurement_manager' && !rfqsList.some(r => r.linked_pr === selectedIndentDetail.id) && (
                    <div className="p-4 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 rounded-lg space-y-2">
                      <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Approved Requisition Action</h4>
                      <p className="text-xs text-muted-foreground">Convert this approved indent into a Request For Quotation (RFQ) to obtain quotes from vendors.</p>
                      <Button onClick={() => {
                        setSelectedIndentDetail(null);
                        navigate(`/tendering/rfq?convert_indent=${selectedIndentDetail.id}`);
                      }} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Convert to RFQ
                      </Button>
                    </div>
                  )}

                  {/* Workflow Integration */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-sm mb-3">Workflow Engine Progress</h3>
                    <WorkflowContainer 
                      module="indents" 
                      entityId={selectedIndentDetail.id} 
                      onWorkflowUpdate={fetchIndents}
                    />
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Indent | MOR</h1>
              <p className="text-muted-foreground">
                Submit a material or service request for approval
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Request Type *</Label>
                      <Select value={requestType} onValueChange={setRequestType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {requestTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Head *</Label>
                      <Select value={budgetHead} onValueChange={setBudgetHead}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget head" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetHeads.map((bh) => (
                            <SelectItem key={bh.value} value={bh.value}>
                              {bh.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tower *</Label>
                      <Select value={selectedTower} onValueChange={setSelectedTower}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tower" />
                        </SelectTrigger>
                        <SelectContent>
                          {towers.map((tower) => (
                            <SelectItem key={tower.value} value={tower.value}>
                              {tower.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Floor *</Label>
                      <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {floors.map((floor) => (
                            <SelectItem key={floor.value} value={floor.value}>
                              {floor.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Required Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !requiredDate && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {requiredDate ? format(requiredDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={requiredDate}
                            onSelect={setRequiredDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Justification / Purpose *</Label>
                    <Textarea
                      placeholder="Describe the need for this request..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items/Services */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Items / Services</CardTitle>
                  <Button onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardHeader>
                <CardContent>
                  {indentItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No items added yet</p>
                      <p className="text-sm">Click "Add Item" to start adding items to your request</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {indentItems.map((item, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Item {index + 1}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label>Item/Service *</Label>
                              <Select
                                value={item.itemId || undefined}
                                onValueChange={(value) => updateItem(index, 'itemId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredItems.map((i) => (
                                    <SelectItem key={i.id} value={String(i.id)}>
                                      {i.name} ({i.uom})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity *</Label>
                              <div className="flex flex-col gap-1">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                />
                                {item.itemId && (
                                  <span className={cn("text-xs font-medium", (item.currentStock || 0) >= item.quantity ? "text-emerald-600" : "text-destructive")}>
                                    Available: {item.currentStock || 0}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>UOM</Label>
                              <Input value={item.uom} disabled />
                            </div>
                            <div className="space-y-2">
                              <Label>Est. Rate (₹)</Label>
                              <Input
                                type="number"
                                value={item.estimatedRate}
                                onChange={(e) => updateItem(index, 'estimatedRate', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Amount (₹)</Label>
                              <Input
                                value={(item.quantity * item.estimatedRate).toLocaleString('en-IN')}
                                disabled
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Total */}
                      <div className="flex justify-end p-4 bg-muted/50 rounded-lg">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
                          <p className="text-2xl font-bold">
                            ₹{totalEstimatedCost.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle>Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium">Drop files here or click to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      BOQ, Scope documents, Images (PDF, DOC, XLS, JPG - Max 10MB each)
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Browse Files'}
                    </Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">
                            <a href={file.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              {file.name}
                            </a>
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Approval Workflow */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkflowTimeline approvals={approvalWorkflow} />
                </CardContent>
              </Card>

              {/* Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-info" />
                    Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Ensure accurate quantity and specifications</p>
                  <p>• Attach relevant supporting documents (BOQ/Scope)</p>
                  <p>• Procurement Manager reviews and verifies budget compliance</p>
                  <p>• Facility Manager provides final sign-off before RFQ generation</p>
                  <p>• Preferred vendors will be auto-suggested based on category</p>
                </CardContent>
              </Card>

              {/* Suggested Vendors */}
              {selectedCategory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Vendors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vendors
                      .filter((v) => v.category.toLowerCase() === selectedCategory.toLowerCase())
                      .slice(0, 3)
                      .map((vendor) => (
                        <div key={vendor.id} className="p-2 bg-muted/50 rounded-lg">
                          <p className="font-medium text-sm">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Rating: {vendor.slaRating}/5 • {vendor.status}
                          </p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

