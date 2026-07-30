import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Download,
  RefreshCw,
  Eye,
  Package,
  Search,
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';

interface QCItem {
  item_id?: string;
  itemId?: string;
  item_name: string;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  remarks?: string;
  uom?: string;
}

interface QCGRN {
  id: string;
  grn_number: string;
  po_reference: string;
  vendor_name: string;
  vendor?: { name: string };
  received_date: string;
  status: 'pending' | 'pending_qc' | 'qc_completed' | 'accepted' | 'partial_accepted' | 'rejected';
  inspected_by?: string;
  inspected_at?: string;
  items: QCItem[];
}

export default function QualityInspection() {
  const { token, user } = useAuth();
  const [grns, setGrns] = useState<QCGRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'pending_qc' | 'qc_completed' | 'accepted' | 'rejected' | null>(null);
  
  // Modals state
  const [inspectingGrn, setInspectingGrn] = useState<QCGRN | null>(null);
  const [viewingGrn, setViewingGrn] = useState<QCGRN | null>(null);
  const [acceptingGrn, setAcceptingGrn] = useState<QCGRN | null>(null);

  // Form states for inspection
  const [inspectionItems, setInspectionItems] = useState<QCItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Acceptance flow states
  const [inventoryDecision, setInventoryDecision] = useState<'surplus' | 'site'>('surplus');

  // Role permissions checks
  const isStoreKeeper = user?.role === 'store_keeper' || user?.role === 'super_admin';
  const isSiteKeeper = user?.role === 'site_keeper';

  useEffect(() => {
    fetchQCGRNs();
  }, []);

  const fetchQCGRNs = async () => {
    try {
      setLoading(true);
      const data = await api.get('qc/grns/');
      if (data) {
        setGrns(data);
      }
    } catch (err) {
      console.error('Error fetching GRNs:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch GRN list for Quality Inspection.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    toast({
      title: 'Export Started',
      description: 'Quality inspection logs are being exported to Excel.',
    });

    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/grns/export/?format=xlsx`,
        `qc_inspection_export_${Date.now()}.xlsx`,
        token || ''
      );

      toast({
        title: 'Export Complete',
        description: 'Quality inspection logs exported successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'An error occurred during export.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenInspect = async (grn: QCGRN) => {
    try {
      const detailedGrn = await api.get(`qc/grns/${grn.id}/`);
      if (detailedGrn) {
        setInspectingGrn(detailedGrn);
        
        // Initialize inspection inputs using received qty as starting point for accepted qty
        const items = (detailedGrn.items || []).map((i: any) => ({
          item_id: i.item_id || i.itemId || '',
          item_name: i.item_name || i.itemName || '',
          ordered_quantity: i.ordered_quantity || 0,
          received_quantity: i.received_quantity || 0,
          accepted_quantity: i.accepted_quantity || i.received_quantity || 0,
          rejected_quantity: i.rejected_quantity || 0,
          remarks: i.remarks || '',
          uom: i.uom || 'Nos'
        }));
        setInspectionItems(items);
        setValidationError(null);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch GRN detail.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenView = async (grn: QCGRN) => {
    try {
      const detailedGrn = await api.get(`qc/grns/${grn.id}/`);
      if (detailedGrn) {
        setViewingGrn(detailedGrn);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to fetch inspection details.',
        variant: 'destructive'
      });
    }
  };

  const handleQtyChange = (index: number, type: 'accepted' | 'rejected', val: number) => {
    const updated = [...inspectionItems];
    const item = updated[index];
    const recQty = item.received_quantity;

    if (type === 'accepted') {
      const acc = Math.min(Math.max(0, val), recQty);
      item.accepted_quantity = acc;
      item.rejected_quantity = recQty - acc;
    } else {
      const rej = Math.min(Math.max(0, val), recQty);
      item.rejected_quantity = rej;
      item.accepted_quantity = recQty - rej;
    }
    
    setInspectionItems(updated);
    setValidationError(null);
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    const updated = [...inspectionItems];
    updated[index].remarks = remarks;
    setInspectionItems(updated);
  };

  const handleCompleteInspection = async () => {
    if (!inspectingGrn) return;

    // Perform validation checks
    for (const item of inspectionItems) {
      if (item.accepted_quantity + item.rejected_quantity !== item.received_quantity) {
        setValidationError(`Validation Error: Accepted Qty + Rejected Qty must equal Received Qty (${item.received_quantity}) for ${item.item_name}.`);
        return;
      }
      if (item.rejected_quantity > 0 && (!item.remarks || item.remarks.trim() === '')) {
        setValidationError(`Validation Error: Remarks/Rejection reason is mandatory for item with rejected quantities: ${item.item_name}.`);
        return;
      }
    }

    try {
      await api.post(`qc/grns/${inspectingGrn.id}/inspect/`, {
        items: inspectionItems.map(item => ({
          item_id: item.item_id,
          item_name: item.item_name,
          accepted_qty: item.accepted_quantity,
          rejected_qty: item.rejected_quantity,
          remarks: item.remarks
        }))
      });

      toast({
        title: 'Success',
        description: 'Quality Inspection completed successfully.',
      });
      setInspectingGrn(null);
      fetchQCGRNs();
    } catch (err: any) {
      setValidationError(err.message || 'Inspection submission failed.');
      toast({
        title: 'Error',
        description: err.message || 'An error occurred during submission.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenAcceptance = (grn: QCGRN) => {
    setAcceptingGrn(grn);
    setInventoryDecision('surplus');
  };

  const handleConfirmAcceptance = async () => {
    if (!acceptingGrn) return;

    // Determine computed action type from the saved inspection results
    const totalReceived = acceptingGrn.items.reduce((sum, i) => sum + (i.received_quantity || 0), 0);
    const totalAccepted = acceptingGrn.items.reduce((sum, i) => sum + (i.accepted_quantity || 0), 0);
    const totalRejected = acceptingGrn.items.reduce((sum, i) => sum + (i.rejected_quantity || 0), 0);

    let action = 'accept';
    if (totalAccepted === totalReceived && totalRejected === 0) {
      action = 'accept';
    } else if (totalAccepted === 0 && totalRejected === totalReceived) {
      action = 'reject';
    } else {
      action = 'partial_accept';
    }

    try {
      await api.post(`grns/${acceptingGrn.id}/action/`, {
        action,
        inventory_decision: inventoryDecision
      });

      toast({
        title: 'Success',
        description: `GRN Acceptance processed successfully as "${action.replace('_', ' ')}"`,
      });
      setAcceptingGrn(null);
      fetchQCGRNs();
    } catch (err: any) {
      toast({
        title: 'Acceptance Failed',
        description: err.message || 'Failed to complete GRN acceptance.',
        variant: 'destructive',
      });
    }
  };

  const getComputedActionLabel = (grn: QCGRN) => {
    const totalReceived = grn.items.reduce((sum, i) => sum + (i.received_quantity || 0), 0);
    const totalAccepted = grn.items.reduce((sum, i) => sum + (i.accepted_quantity || 0), 0);
    const totalRejected = grn.items.reduce((sum, i) => sum + (i.rejected_quantity || 0), 0);

    if (totalAccepted === totalReceived && totalRejected === 0) {
      return { label: 'GRN Accepted', color: 'text-emerald-600 font-bold' };
    } else if (totalAccepted === 0 && totalRejected === totalReceived) {
      return { label: 'GRN Rejected', color: 'text-destructive font-bold' };
    } else {
      return { label: 'Partial Accept', color: 'text-amber-500 font-bold' };
    }
  };

  // Filtered list
  const filteredGrns = grns.filter(g => {
    const searchMatch = g.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.po_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let filterMatch = true;
    if (activeFilter) {
      if (activeFilter === 'pending_qc') filterMatch = g.status === 'pending_qc' || g.status === 'pending';
      else if (activeFilter === 'qc_completed') filterMatch = g.status === 'qc_completed';
      else if (activeFilter === 'accepted') filterMatch = g.status === 'accepted';
      else if (activeFilter === 'rejected') filterMatch = g.status === 'rejected';
    }

    return searchMatch && filterMatch;
  });

  // Statistics calculation
  const stats = {
    pendingQc: grns.filter(g => g.status === 'pending_qc' || g.status === 'pending').length,
    completedToday: grns.filter(g => g.status === 'qc_completed').length,
    accepted: grns.filter(g => g.status === 'accepted').length,
    rejected: grns.filter(g => g.status === 'rejected').length
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'pending_qc' || s === 'pending') {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium whitespace-nowrap">Pending QC</Badge>;
    }
    if (s === 'qc_completed') {
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap">QC Completed</Badge>;
    }
    if (s === 'accepted') {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium whitespace-nowrap">Accepted</Badge>;
    }
    if (s === 'partial_accepted') {
      return <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-medium whitespace-nowrap">Partial Accept</Badge>;
    }
    if (s === 'rejected') {
      return <Badge className="bg-destructive hover:bg-destructive/90 text-white font-medium whitespace-nowrap">Rejected</Badge>;
    }
    return <Badge variant="secondary" className="whitespace-nowrap">{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Quality Inspection</h1>
            <p className="text-muted-foreground text-sm">
              Inspect received materials before GRN acceptance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchQCGRNs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            className={`shadow-sm border-muted cursor-pointer transition-all hover:border-amber-500/50 ${activeFilter === 'pending_qc' ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'pending_qc' ? null : 'pending_qc')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending QC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-extrabold text-amber-500">{stats.pendingQc}</p>
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">GRNs awaiting inspection</p>
            </CardContent>
          </Card>
          <Card 
            className={`shadow-sm border-muted cursor-pointer transition-all hover:border-blue-600/50 ${activeFilter === 'qc_completed' ? 'ring-2 ring-blue-600 bg-blue-600/5' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'qc_completed' ? null : 'qc_completed')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                QC Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-extrabold text-blue-600">{stats.completedToday}</p>
                <div className="p-2 bg-blue-600/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Inspections completed today</p>
            </CardContent>
          </Card>
          <Card 
            className={`shadow-sm border-muted cursor-pointer transition-all hover:border-emerald-600/50 ${activeFilter === 'accepted' ? 'ring-2 ring-emerald-600 bg-emerald-600/5' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'accepted' ? null : 'accepted')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-extrabold text-emerald-600">{stats.accepted}</p>
                <div className="p-2 bg-emerald-600/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Accepted GRNs</p>
            </CardContent>
          </Card>
          <Card 
            className={`shadow-sm border-muted cursor-pointer transition-all hover:border-destructive/50 ${activeFilter === 'rejected' ? 'ring-2 ring-destructive bg-destructive/5' : ''}`}
            onClick={() => setActiveFilter(activeFilter === 'rejected' ? null : 'rejected')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-extrabold text-destructive">{stats.rejected}</p>
                <div className="p-2 bg-destructive/10 rounded-full">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Rejected GRNs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by GRN, PO, or Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Main Quality Inspection Table */}
        <Card className="shadow-sm border-muted">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-sm">Loading GRN list...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6 py-4">GRN Number</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead className="min-w-[140px]">Items</TableHead>
                    <TableHead className="min-w-[130px]">Inspection Status</TableHead>
                    <TableHead>Inspected By</TableHead>
                    <TableHead className="pr-6 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10">
                        <div className="flex flex-col items-center max-w-xl mx-auto space-y-4">
                          <Alert variant="destructive" className="bg-red-50 border-red-200">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <AlertTitle className="text-red-800 font-bold ml-2">Workflow Action Required</AlertTitle>
                            <AlertDescription className="text-red-700 ml-2 mt-2">
                              You cannot perform a Quality/Physical Inspection directly after a PO is approved.
                              <br/><br/>
                              <strong>Required Next Step:</strong> You must first go to <strong>Inventory &rarr; GRN Entry</strong> and click "+ Create GRN" to officially log that the delivery truck has arrived. 
                              <br/><br/>
                              Once the GRN is created, the items will automatically appear here on this page awaiting your physical inspection!
                            </AlertDescription>
                          </Alert>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrns.map((grn) => {
                      const totalQty = grn.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
                      return (
                        <TableRow key={grn.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="pl-6 font-mono font-medium text-foreground text-sm whitespace-nowrap">{grn.id}</TableCell>
                          <TableCell className="font-mono text-sm whitespace-nowrap">{grn.po_reference}</TableCell>
                          <TableCell className="font-medium">{grn.vendor_name || 'System Vendor'}</TableCell>
                          <TableCell className="whitespace-nowrap">{grn.received_date}</TableCell>
                          <TableCell className="min-w-[140px] whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <Badge variant="secondary" className="w-fit text-xs font-semibold whitespace-nowrap">
                                {grn.items.length} {grn.items.length === 1 ? 'Item' : 'Items'}
                              </Badge>
                              <Badge variant="outline" className="w-fit text-xs font-semibold whitespace-nowrap bg-primary/5 text-primary border-primary/20">
                                {totalQty} {totalQty === 1 ? 'Unit' : 'Units'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[130px] whitespace-nowrap">{getStatusBadge(grn.status)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {grn.inspected_by || <span className="text-muted-foreground/50">-</span>}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-2">
                              {(grn.status === 'pending_qc' || grn.status === 'pending') && (
                                <>
                                  {isStoreKeeper ? (
                                    <Button size="sm" onClick={() => handleOpenInspect(grn)}>
                                      Perform Inspection
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleOpenView(grn)}>
                                      <Eye className="h-4 w-4 mr-1" /> View Status
                                    </Button>
                                  )}
                                </>
                              )}

                              {grn.status === 'qc_completed' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleOpenView(grn)}>
                                    <Eye className="h-4 w-4 mr-1" /> View Inspection
                                  </Button>
                                  {isStoreKeeper && (
                                    <Button size="sm" onClick={() => handleOpenAcceptance(grn)}>
                                      Proceed to Acceptance
                                    </Button>
                                  )}
                                </>
                              )}

                              {(grn.status === 'accepted' || grn.status === 'partial_accepted' || grn.status === 'rejected') && (
                                <Button size="sm" variant="outline" onClick={() => handleOpenView(grn)}>
                                  <Eye className="h-4 w-4 mr-1" /> View Details
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
            )}
          </CardContent>
        </Card>

        {/* Perform Inspection Modal */}
        <Dialog open={!!inspectingGrn} onOpenChange={(open) => !open && setInspectingGrn(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-6 w-6 text-primary" /> Perform Quality Inspection
              </DialogTitle>
              <DialogDescription>
                Compare physical items received with purchase specifications and log deviations.
              </DialogDescription>
            </DialogHeader>

            {inspectingGrn && (
              <div className="space-y-6 pt-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">GRN Number</span>
                    <span className="font-mono font-medium text-foreground">{inspectingGrn.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">PO Reference</span>
                    <span className="font-mono font-medium text-foreground">{inspectingGrn.po_reference}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Vendor</span>
                    <span className="font-medium text-foreground">{inspectingGrn.vendor_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Received Date</span>
                    <span className="font-medium text-foreground">{inspectingGrn.received_date}</span>
                  </div>
                </div>

                {/* Items inspection table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Received Items Verification
                  </h3>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="w-24 text-center">Ordered Qty</TableHead>
                        <TableHead className="w-24 text-center">Received Qty</TableHead>
                        <TableHead className="w-28 text-center">Accepted Qty</TableHead>
                        <TableHead className="w-28 text-center">Rejected Qty</TableHead>
                        <TableHead className="w-64">Remarks / Rejection Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inspectionItems.map((item, index) => (
                        <TableRow key={index} className="hover:bg-transparent">
                          <TableCell className="font-medium text-foreground text-sm">{item.item_name}</TableCell>
                          <TableCell className="text-center font-medium">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{item.received_quantity}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.received_quantity}
                              value={item.accepted_quantity}
                              onChange={(e) => handleQtyChange(index, 'accepted', parseInt(e.target.value, 10) || 0)}
                              className="text-center font-semibold text-emerald-600"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={item.received_quantity}
                              value={item.rejected_quantity}
                              onChange={(e) => handleQtyChange(index, 'rejected', parseInt(e.target.value, 10) || 0)}
                              className="text-center font-semibold text-destructive"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder={item.rejected_quantity > 0 ? "Damaged specification, Broken, Mismatch (Mandatory)" : "Good Condition..."}
                              value={item.remarks || ''}
                              onChange={(e) => handleRemarksChange(index, e.target.value)}
                              className={item.rejected_quantity > 0 && (!item.remarks || item.remarks.trim() === '') ? 'border-destructive' : ''}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Validation Error Alert */}
                {validationError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/25 text-destructive rounded-md text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Modal actions */}
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setInspectingGrn(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCompleteInspection}>
                    Complete Inspection
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Details / View Inspection Modal */}
        <Dialog open={!!viewingGrn} onOpenChange={(open) => !open && setViewingGrn(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Eye className="h-6 w-6 text-primary" /> Quality Inspection Details
              </DialogTitle>
              <DialogDescription>
                Detailed audit history of the items inspected for acceptance decision.
              </DialogDescription>
            </DialogHeader>

            {viewingGrn && (
              <div className="space-y-6 pt-4">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">GRN Number</span>
                    <span className="font-mono font-medium text-foreground">{viewingGrn.id}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">PO Reference</span>
                    <span className="font-mono font-medium text-foreground">{viewingGrn.po_reference}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Vendor</span>
                    <span className="font-medium text-foreground">{viewingGrn.vendor?.name || viewingGrn.vendor_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Received Date</span>
                    <span className="font-medium text-foreground">{viewingGrn.received_date}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Inspected By</span>
                    <span className="font-medium text-foreground">{viewingGrn.inspected_by || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Inspected At</span>
                    <span className="font-medium text-foreground">
                      {viewingGrn.inspected_at ? new Date(viewingGrn.inspected_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold block uppercase">Current Status</span>
                    <span>{getStatusBadge(viewingGrn.status)}</span>
                  </div>
                </div>

                {/* Items inspection table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Quality Verification Records
                  </h3>
                  <Table className="border rounded-md">
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="w-28 text-center">Ordered Qty</TableHead>
                        <TableHead className="w-28 text-center">Received Qty</TableHead>
                        <TableHead className="w-28 text-center">Accepted Qty</TableHead>
                        <TableHead className="w-28 text-center">Rejected Qty</TableHead>
                        <TableHead>Remarks / Rejection Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingGrn.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-foreground text-sm">{item.item_name}</TableCell>
                          <TableCell className="text-center">{item.ordered_quantity}</TableCell>
                          <TableCell className="text-center font-semibold">{item.received_quantity}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">{item.accepted_quantity}</TableCell>
                          <TableCell className="text-center font-bold text-destructive">{item.rejected_quantity}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.remarks || 'No remarks recorded'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Modal actions */}
                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={() => setViewingGrn(null)}>
                    Close Details
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Proceed to Acceptance Dialog */}
        <Dialog open={!!acceptingGrn} onOpenChange={(open) => !open && setAcceptingGrn(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" /> Confirm GRN Acceptance
              </DialogTitle>
              <DialogDescription>
                Apply the quality inspection results to update system inventory and generate documentation.
              </DialogDescription>
            </DialogHeader>

            {acceptingGrn && (
              <div className="space-y-4 pt-4 text-sm">
                <div className="p-4 bg-muted/30 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">GRN Number:</span>
                    <span className="font-mono font-semibold">{acceptingGrn.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">PO Reference:</span>
                    <span className="font-mono font-semibold">{acceptingGrn.po_reference}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-medium">Inspection Decision:</span>
                    <span className={getComputedActionLabel(acceptingGrn).color}>
                      {getComputedActionLabel(acceptingGrn).label}
                    </span>
                  </div>
                </div>

                {/* Inventory Action selection (Only if there are accepted items) */}
                {acceptingGrn.items.some(i => i.accepted_quantity > 0) && (
                  <div className="space-y-3 p-3 border rounded-lg bg-emerald-50/10">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      Inventory Action for Accepted Quantities
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="acceptInvDecision"
                          value="surplus"
                          checked={inventoryDecision === 'surplus'}
                          onChange={() => setInventoryDecision('surplus')}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="text-sm font-medium">Add to Surplus Stock (Retain in Inventory)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="acceptInvDecision"
                          value="site"
                          checked={inventoryDecision === 'site'}
                          onChange={() => setInventoryDecision('site')}
                          className="h-4 w-4 text-primary"
                        />
                        <span className="text-sm font-medium">Generate GDN for Site Issue (Deduct from Inventory)</span>
                      </label>
                    </div>
                  </div>
                )}

                {acceptingGrn.items.some(i => i.rejected_quantity > 0) && (
                  <div className="p-3 border border-amber-200 bg-amber-50/20 text-amber-800 text-xs rounded-lg flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      Rejected quantities will automatically generate a Return-To-Vendor (RTV) transaction.
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" onClick={() => setAcceptingGrn(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmAcceptance} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Confirm & Update Inventory
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
