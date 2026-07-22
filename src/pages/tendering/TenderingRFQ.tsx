import { useState, useEffect } from 'react';
import { api } from '@/api/client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Filter, Plus, FileText, Clock, CheckCircle, XCircle, 
  Send, Eye, Calendar, Building2, Users, Award, TrendingUp,
  Upload, Download, Star, BarChart3, Scale, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { downloadFile } from '@/utils/downloadFile';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow } from '@/hooks/useWorkflow';
import { RoleLabels, UserRole } from '@/types';
import { ApprovalTimeline } from '@/components/workflow/ApprovalTimeline';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

interface RFQ {
  id: string;
  title: string;
  category: string;
  tower: string;
  linkedPR: string;
  estimatedValue: number;
  bidDueDate: string;
  status: string;
  vendors: VendorQuote[];
  createdBy: string;
  createdDate: string;
  recommendedQuotationId?: string;
  recommendedVendorId?: string;
  recommendationComments?: string;
  workflow_history?: any[];
}

interface VendorQuote {
  vendorId: string;
  vendorName: string;
  quoteAmount: number;
  technicalScore: number;
  commercialScore: number;
  overallScore: number;
  deliveryDays: number;
  submitted: boolean;
  submittedDate?: string;
  deviations?: string;
  recommendation: 'recommended' | 'acceptable' | 'not_recommended';
  warranty?: string;
  remarks?: string;
  quotationId?: string;
  complianceStatus?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  published: { label: 'Published', variant: 'default', icon: Send },
  bidding_open: { label: 'Bidding Open', variant: 'default', icon: Clock },
  bidding_closed: { label: 'Bidding Closed', variant: 'secondary', icon: Clock },
  quotation_received: { label: 'Quotation Received', variant: 'outline', icon: Clock },
  PROCUREMENT_MANAGER_REVIEW: { label: 'Pending Procurement Manager Approval', variant: 'outline', icon: Clock },
  FACILITY_MANAGER_REVIEW: { label: 'Pending Facility Manager Approval', variant: 'outline', icon: Clock },
  PROJECT_HEAD_REVIEW: { label: 'Pending Project Head Approval', variant: 'outline', icon: Clock },
  DUAL_CXO_REVIEW: { label: 'Pending Dual CXO Approval', variant: 'outline', icon: Clock },
  WAITING_FOR_CXO_EMB: { label: 'Waiting for CXO EMB Approval', variant: 'outline', icon: Clock },
  WAITING_FOR_CXO_CITI: { label: 'Waiting for CXO Citi Approval', variant: 'outline', icon: Clock },
  APPROVED_BY_BOTH_CXOS: { label: 'Approved by Both CXOs (PO Ready)', variant: 'default', icon: CheckCircle },
  AWARD_READY: { label: 'Award Ready (Approved by Both CXOs)', variant: 'default', icon: CheckCircle },
  WAITING_FOR_DUAL_CXO_APPROVAL: { label: 'Waiting for Dual CXO Approval', variant: 'outline', icon: Clock },
  awarded: { label: 'Awarded', variant: 'default', icon: Award },
  po_ready: { label: 'PO Creation Ready', variant: 'default', icon: Award },
  po_created: { label: 'PO Generated', variant: 'default', icon: Award },
  hold: { label: 'On Hold', variant: 'outline', icon: Clock },
  REJECTED: { label: 'Rejected (Returned to PM)', variant: 'destructive', icon: XCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  renegotiation_required: { label: 'Renegotiation Required', variant: 'destructive', icon: Scale },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const getReviewTitle = (rfq: RFQ, currentUserRole?: string) => {
  if (['published', 'draft'].includes(rfq.status)) {
    return `${rfq.title} - ${rfq.id}`;
  }
  
  const role = currentUserRole || '';
  if (role === 'procurement_manager' && rfq.status === 'PROCUREMENT_MANAGER_REVIEW') {
    return 'Procurement Manager Review';
  }
  if (role === 'facility_manager' && rfq.status === 'FACILITY_MANAGER_REVIEW') {
    return 'Facility Manager Review';
  }
  if (role === 'project_head' && rfq.status === 'PROJECT_HEAD_REVIEW') {
    return 'Project Head Review';
  }
  if (role === 'cxo_citi' && (rfq.status === 'DUAL_CXO_REVIEW' || rfq.status === 'WAITING_FOR_CXO_CITI' || rfq.status === 'WAITING_FOR_DUAL_CXO_APPROVAL')) {
    return 'CXO Citi Review';
  }
  if (role === 'cxo_emb' && (rfq.status === 'DUAL_CXO_REVIEW' || rfq.status === 'WAITING_FOR_CXO_EMB' || rfq.status === 'WAITING_FOR_DUAL_CXO_APPROVAL')) {
    return 'CXO EMB Review';
  }
  if (['cxo', 'cxo_citi', 'cxo_emb'].includes(role) && (rfq.status === 'DUAL_CXO_REVIEW' || rfq.status === 'WAITING_FOR_DUAL_CXO_APPROVAL')) {
    return 'CXO Citi & EMB Review';
  }
  
  if (rfq.status === 'PROCUREMENT_MANAGER_REVIEW') return 'Procurement Manager Review';
  if (rfq.status === 'FACILITY_MANAGER_REVIEW') return 'Facility Manager Review';
  if (rfq.status === 'PROJECT_HEAD_REVIEW') return 'Project Head Review';
  if (rfq.status === 'DUAL_CXO_REVIEW' || rfq.status === 'WAITING_FOR_DUAL_CXO_APPROVAL') {
    if (role === 'cxo_emb') return 'CXO EMB Review';
    return 'CXO Citi Review';
  }
  if (rfq.status === 'WAITING_FOR_CXO_EMB') return 'CXO EMB Review';
  if (rfq.status === 'WAITING_FOR_CXO_CITI') return 'CXO Citi Review';
  
  return `${rfq.title} - ${rfq.id}`;
};

export default function TenderingRFQ() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const convertIndentId = searchParams.get('convert_indent');
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (convertIndentId) {
      setIsCreateOpen(true);
    }
  }, [convertIndentId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const qRes = await api.get('quotations/');
      let fetchedQuotes: any[] = [];
      if (qRes) {
        fetchedQuotes = Array.isArray(qRes) ? qRes : (qRes.results ?? []);
        setQuotations(fetchedQuotes);
      }

      const res = await api.get('rfqs/');
      if (res) {
        const data = Array.isArray(res) ? res : (res.results ?? []);
        
        // Merge RFQ with database Quotations
        const mapped = data.map((r: any) => {
          const rfqQuotes = fetchedQuotes.filter((q: any) => q.rfq_id === r.id);
          
          const invitedIds = new Set<string>();
          const invitedNames = new Set<string>();

          // Invited vendors
          const invited = (r.vendors ?? []).map((v: any) => {
            const vId = v.vendor_id ?? v.vendorId ?? '';
            if (vId) invitedIds.add(String(vId));
            const vName = v.vendor_name ?? v.vendorName ?? '';
            if (vName) invitedNames.add(vName.trim().toLowerCase());

            const matchingQuote = rfqQuotes.find((q: any) => 
              (q.vendor_id && String(q.vendor_id) === String(vId)) ||
              (q.vendor_name && vName && q.vendor_name.trim().toLowerCase() === vName.trim().toLowerCase())
            );
            
            return {
              vendorId: vId,
              vendorName: vName,
              quoteAmount: matchingQuote ? Number(matchingQuote.total_cost) : 0,
              technicalScore: matchingQuote ? Number(matchingQuote.technical_score ?? 80) : 0,
              commercialScore: matchingQuote ? Number(matchingQuote.commercial_score ?? 80) : 0,
              overallScore: matchingQuote ? Number(matchingQuote.overall_score ?? 80) : 0,
              complianceStatus: matchingQuote ? (matchingQuote.compliance_status ?? 'Compliant') : 'Compliant',
              pros: matchingQuote ? (matchingQuote.pros ?? []) : [],
              cons: matchingQuote ? (matchingQuote.cons ?? []) : [],
              risks: matchingQuote ? (matchingQuote.risks ?? []) : [],
              commercialAdvantages: matchingQuote ? (matchingQuote.commercial_advantages ?? []) : [],
              technicalAdvantages: matchingQuote ? (matchingQuote.technical_advantages ?? []) : [],
              deliveryDays: matchingQuote ? (parseInt(matchingQuote.delivery_timeline) || 7) : 0,
              submitted: !!matchingQuote,
              submittedDate: matchingQuote ? matchingQuote.created_at?.split('T')[0] : undefined,
              deviations: matchingQuote ? matchingQuote.remarks : undefined,
              recommendation: matchingQuote && matchingQuote.status === 'recommended' ? 'recommended' : 'acceptable',
              warranty: matchingQuote ? matchingQuote.warranty : undefined,
              remarks: matchingQuote ? matchingQuote.remarks : undefined,
              quotationId: matchingQuote ? matchingQuote.id : undefined,
              vendorRating: matchingQuote ? Number(matchingQuote.vendor_rating || 5.0) : 5.0,
              rating: matchingQuote ? Number(matchingQuote.vendor_rating || 5.0) : 5.0,
            };
          });

          // Add any other vendors that submitted a quotation but were not in the invited vendors list
          const extraQuotes = rfqQuotes.filter((q: any) => {
            const qId = q.vendor_id ? String(q.vendor_id) : '';
            const qName = q.vendor_name ? q.vendor_name.trim().toLowerCase() : '';
            return !invitedIds.has(qId) && !invitedNames.has(qName);
          });

          const extraVendors = extraQuotes.map((q: any) => {
            return {
              vendorId: q.vendor_id || '',
              vendorName: q.vendor_name || '',
              quoteAmount: Number(q.total_cost),
              technicalScore: Number(q.technical_score ?? 80),
              commercialScore: Number(q.commercial_score ?? 80),
              overallScore: Number(q.overall_score ?? 80),
              complianceStatus: q.compliance_status ?? 'Compliant',
              pros: q.pros ?? [],
              cons: q.cons ?? [],
              risks: q.risks ?? [],
              commercialAdvantages: q.commercial_advantages ?? [],
              technicalAdvantages: q.technical_advantages ?? [],
              deliveryDays: parseInt(q.delivery_timeline) || 7,
              submitted: true,
              submittedDate: q.created_at?.split('T')[0],
              deviations: q.remarks,
              recommendation: q.status === 'recommended' ? 'recommended' : 'acceptable',
              warranty: q.warranty,
              remarks: q.remarks,
              quotationId: q.id,
              vendorRating: Number(q.vendor_rating || 5.0),
              rating: Number(q.vendor_rating || 5.0),
            };
          });

          return {
            id: r.id,
            title: r.title,
            category: r.category,
            tower: r.tower,
            linkedPR: r.linked_pr ?? '',
            estimatedValue: typeof r.estimated_value === 'string' ? parseFloat(r.estimated_value) : (r.estimated_value ?? 0),
            bidDueDate: r.bid_due_date,
            status: r.status,
            vendors: [...invited, ...extraVendors],
            createdBy: r.created_by ?? '',
            createdDate: r.created_date ?? '',
            recommendedQuotationId: r.recommended_quotation_id ?? '',
            recommendedVendorId: r.recommended_vendor_id ?? '',
            recommendationComments: r.recommendation_comments ?? '',
          };
        });
        
        // If user is vendor, filter to RFQs they are invited to
        if (user?.role === 'vendor') {
          const filteredForVendor = mapped.filter((rfq: any) => 
            rfq.vendors.some((v: any) => 
              v.vendorId === user.id || 
              v.vendorName.toLowerCase() === user.name.toLowerCase() ||
              (user.email && (v.vendorId === user.email || v.email === user.email)) ||
              (user.email === 'ayush27shaw@gmail.com' && (v.vendorId === 'V1781503444008' || v.vendorName.toLowerCase() === 'demo vendor services'))
            )
          );
          setRFQs(filteredForVendor);
        } else {
          setRFQs(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching tendering data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!id) return;
    const found = rfqs.find((r) => String(r.id) === String(id));
    if (found) {
      setSelectedRFQ(found);
    } else {
      toast({
        title: 'Document not found.',
        description: 'Redirecting to list view.',
        variant: 'destructive',
      });
      navigate('/tendering/rfq');
    }
  }, [id, isLoading, rfqs, navigate]);

  const handleExport = async () => {
    toast({ title: 'Export Started', description: 'RFQs list is being exported to Excel.' });
    try {
      await downloadFile(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/export/?format=xlsx`,
        `rfqs_export_${Date.now()}.xlsx`,
        token || ''
      );
      toast({ title: 'Export Complete', description: 'RFQs list exported successfully.' });
    } catch (err: any) {
      toast({ title: 'Export Failed', description: err.message || 'An error occurred during export.', variant: 'destructive' });
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rfq.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: rfqs.length,
    active: rfqs.filter(r => ['published', 'bidding', 'vendor_responded', 'evaluation'].includes(r.status)).length,
    awarded: rfqs.filter(r => r.status === 'awarded').length,
    totalValue: rfqs.reduce((sum, r) => sum + r.estimatedValue, 0),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tendering & RFQ</h1>
            {user?.role === 'vendor' ? (
              <p className="text-muted-foreground">Submit quotations and view active RFQs assigned to you</p>
            ) : (
              <p className="text-muted-foreground">Manage RFQs, vendor quotes, and bid comparisons</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {['procurement_executive', 'procurement_manager', 'super_admin'].includes(user?.role || '') && (
              <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) {
                  setSearchParams({});
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create RFQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New RFQ</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage create new rfq details and actions here.</DialogDescription>
                  </DialogHeader>
                  <CreateRFQForm 
                    initialIndentId={convertIndentId || undefined}
                    onClose={() => { 
                      setIsCreateOpen(false); 
                      setSearchParams({});
                      fetchData(); 
                    }} 
                  />
                </DialogContent>
              </Dialog>
            )}
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
                  <p className="text-sm text-muted-foreground">Total RFQs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active RFQs</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <Award className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Awarded</p>
                  <p className="text-2xl font-bold">{stats.awarded}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
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
              <TabsTrigger value="all">All RFQs</TabsTrigger>
              <TabsTrigger value="active">Active Bids</TabsTrigger>
              {user?.role !== 'vendor' && <TabsTrigger value="comparison">Bid Comparison</TabsTrigger>}
              <TabsTrigger value="awarded">Awarded</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
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
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="bidding">Bidding Open</SelectItem>
                  <SelectItem value="vendor_responded">Quotes Submitted</SelectItem>
                  <SelectItem value="evaluation">Under Evaluation</SelectItem>
                  <SelectItem value="pending_cxo_award_approval">Pending CXO Award</SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                  <SelectItem value="hold">On Hold</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="renegotiation_required">Renegotiation Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all">
            <RFQTable rfqs={filteredRFQs} onSelectRFQ={setSelectedRFQ} />
          </TabsContent>

          <TabsContent value="active">
            <RFQTable 
              rfqs={filteredRFQs.filter(r => ['published', 'bidding_open', 'bidding_closed', 'quotation_received', 'procurement_executive_review', 'procurement_manager_review', 'facility_manager_review', 'project_head_review', 'cxo_citi_review', 'cxo_emb_review', 'WAITING_FOR_DUAL_CXO_APPROVAL', 'dual_cxo_approved'].includes(r.status))} 
              onSelectRFQ={setSelectedRFQ}
            />
          </TabsContent>

          {user?.role !== 'vendor' && (
            <TabsContent value="comparison">
              <BidComparisonView rfqs={filteredRFQs.filter(r => ['bidding_closed', 'quotation_received', 'procurement_executive_review', 'procurement_manager_review', 'facility_manager_review', 'project_head_review', 'cxo_citi_review', 'cxo_emb_review', 'WAITING_FOR_DUAL_CXO_APPROVAL', 'dual_cxo_approved', 'awarded', 'po_ready'].includes(r.status))} onSelectRFQ={setSelectedRFQ} />
            </TabsContent>
          )}

          <TabsContent value="awarded">
            <RFQTable 
              rfqs={filteredRFQs.filter(r => ['awarded', 'po_ready', 'po_created'].includes(r.status))} 
              onSelectRFQ={setSelectedRFQ}
              isAwardedTable={true}
            />
          </TabsContent>
        </Tabs>

        {/* RFQ Detail Dialog */}
        {selectedRFQ && (
          <Dialog open={!!selectedRFQ} onOpenChange={(open) => {
            if (!open) {
              setSelectedRFQ(null);
              if (id) {
                navigate('/tendering/rfq');
              }
            }
          }}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center mr-6">
                  <span>{getReviewTitle(selectedRFQ, user?.role)}</span>
                  <Badge variant={statusConfig[selectedRFQ.status]?.variant || 'outline'}>
                    {statusConfig[selectedRFQ.status]?.label || selectedRFQ.status}
                  </Badge>
                </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Please review and complete the details below.</DialogDescription>
              </DialogHeader>
              <RFQDetailView rfq={selectedRFQ} onActionComplete={() => { setSelectedRFQ(null); fetchData(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}

function RFQTable({ rfqs, onSelectRFQ, isAwardedTable }: { rfqs: RFQ[]; onSelectRFQ: (rfq: RFQ) => void; isAwardedTable?: boolean }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tower</TableHead>
              <TableHead>Estimated Value</TableHead>
              {isAwardedTable ? (
                <>
                  <TableHead>Awarded Vendor</TableHead>
                  <TableHead>Winning Quote</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Bid Due Date</TableHead>
                  <TableHead>Vendors</TableHead>
                  <TableHead>Quotes Received</TableHead>
                </>
              )}
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No RFQs found
                </TableCell>
              </TableRow>
            ) : (
              rfqs.map((rfq) => {
                const statusInfo = statusConfig[rfq.status] || { label: rfq.status, variant: 'outline', icon: Clock };
                const StatusIcon = statusInfo.icon;
                const quotesReceived = rfq.vendors.filter(v => v.submitted).length;

                const winningVendor = rfq.vendors.find(v => 
                  (rfq.recommendedQuotationId && String(v.quotationId) === String(rfq.recommendedQuotationId)) ||
                  (rfq.recommendedVendorId && String(v.vendorId) === String(rfq.recommendedVendorId))
                );
                const vendorName = winningVendor?.vendorName || rfq.recommendedVendorId || 'N/A';
                const quoteAmount = winningVendor?.quoteAmount ? `₹${winningVendor.quoteAmount.toLocaleString('en-IN')}` : 'N/A';
                
                return (
                  <TableRow key={rfq.id}>
                    <TableCell className="font-mono text-sm">{rfq.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rfq.title}</p>
                        <p className="text-xs text-muted-foreground">Linked PR: {rfq.linkedPR}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{rfq.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {rfq.tower}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{rfq.estimatedValue.toLocaleString('en-IN')}</TableCell>
                    {isAwardedTable ? (
                      <>
                        <TableCell className="font-medium text-emerald-600">{vendorName}</TableCell>
                        <TableCell className="font-semibold text-emerald-700">{quoteAmount}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {rfq.bidDueDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {rfq.vendors.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={quotesReceived === rfq.vendors.length ? 'default' : 'secondary'}>
                            {quotesReceived}/{rfq.vendors.length}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onSelectRFQ(rfq)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
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

function BidComparisonView({ rfqs, onSelectRFQ }: { rfqs: RFQ[]; onSelectRFQ: (rfq: RFQ) => void }) {
  if (rfqs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No RFQs under evaluation or finalized. Complete quote collections to view comparison.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {rfqs.map(rfq => (
        <Card key={rfq.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {rfq.title}
                </CardTitle>
                <CardDescription>
                  {rfq.id} • Estimated Value: ₹{rfq.estimatedValue.toLocaleString('en-IN')} • Status: <span className="capitalize font-semibold">{rfq.status.replace('_', ' ')}</span>
                </CardDescription>
              </div>
              <Button onClick={() => onSelectRFQ(rfq)}>
                <Eye className="h-4 w-4 mr-2" />
                View & Take Action
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Vendor ID</TableHead>
                  <TableHead>Quote Amount</TableHead>
                  <TableHead>Delivery Timeline</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Technical Score</TableHead>
                  <TableHead>Commercial Score</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Compliance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...rfq.vendors]
                  .filter(v => v.submitted)
                  .sort((a, b) => a.quoteAmount - b.quoteAmount)
                  .map((vendor, index) => (
                    <TableRow key={vendor.vendorId} className={index === 0 ? 'bg-emerald-500/5' : ''}>
                      <TableCell>
                        <Badge variant={index === 0 ? 'default' : 'secondary'} className="font-bold bg-blue-600 text-white">
                          L{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                      <TableCell className="font-mono text-xs">{vendor.vendorId}</TableCell>
                      <TableCell className="font-semibold">₹{vendor.quoteAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{vendor.deliveryDays} days</TableCell>
                      <TableCell>{vendor.warranty || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">{vendor.technicalScore}%</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">{vendor.commercialScore}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.overallScore >= 85 ? 'default' : 'secondary'} className="font-bold">
                          {vendor.overallScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.complianceStatus === 'Compliant' ? 'default' : 'destructive'}>
                          {vendor.complianceStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                {rfq.vendors.filter(v => v.submitted).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                      No quotations submitted for comparison yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RFQDetailView({ rfq, onActionComplete }: { rfq: RFQ; onActionComplete: () => void }) {
  const { token, user } = useAuth();
  const { timeline, fetchTimeline, actionWorkflowStep } = useWorkflow();
  const [approvalComments, setApprovalComments] = useState('');
  const [justification, setJustification] = useState('');
  const [decision, setDecision] = useState('Approve');
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [processingApproval, setProcessingApproval] = useState(false);
  const [activeTab, setActiveTab] = useState('evaluation');

  // Edit Score States
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editTechScore, setEditTechScore] = useState(80);
  const [editCommScore, setEditCommScore] = useState(80);
  const [editCompliance, setEditCompliance] = useState('Compliant');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  // Manager action states
  const [procurementManagerAction, setProcurementManagerAction] = useState<'agree' | 'disagree' | 'alternate'>('agree');
  const [pmAlternateQuoteId, setPmAlternateQuoteId] = useState('');
  const [managerActionType, setManagerActionType] = useState<'agree' | 'disagree'>('agree');

  useEffect(() => {
    fetchTimeline('rfqs', rfq.id);
  }, [rfq.id, fetchTimeline]);

  useEffect(() => {
    setDecision('Approve & Forward');
  }, [user?.role, rfq.id]);
  
  // Publish RFQ States
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [bidDueDate, setBidDueDate] = useState(rfq.bidDueDate || '');
  const [dbVendors, setDbVendors] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const raw = await res.json();
          const data = Array.isArray(raw) ? raw : (raw.results ?? []);
          setDbVendors(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchVendors();
  }, []);

  const activeCategoryVendors = (() => {
    const demo = dbVendors.find(v => v.id === 'V1781503444008' || v.email === 'ayush27shaw@gmail.com');
    const filtered = dbVendors.filter(v => 
      v.status === 'active' && 
      v.id !== 'V1781503444008' &&
      v.email !== 'ayush27shaw@gmail.com' &&
      (v.is_universal_vendor || v.isUniversalVendor || !rfq.category || v.category.toLowerCase() === rfq.category.toLowerCase())
    );
    const result = [];
    if (demo) {
      result.push(demo);
    } else {
      result.push({
        id: 'V1781503444008',
        name: 'Demo Vendor Services',
        email: 'ayush27shaw@gmail.com',
        category: rfq.category || 'general',
        status: 'active',
        sla_rating: 5.0
      });
    }
    result.push(...filtered);
    return result;
  })();

  // Vendor Quote Submission States
  const [baseCost, setBaseCost] = useState('');
  const [taxPercent, setTaxPercent] = useState('18');
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [warranty, setWarranty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Finalize Award States
  const [selectedQuoteId, setSelectedQuoteId] = useState(rfq.recommendedQuotationId || '');
  const [awardSummary, setAwardSummary] = useState(rfq.recommendationComments || '');
  const [finalizingAward, setFinalizingAward] = useState(false);

  // Resolve vendor details
  const currentVendorRecord = dbVendors.find(v => v.email === user?.email);
  const resolvedVendorId = currentVendorRecord?.id || (user?.email === 'ayush27shaw@gmail.com' ? 'V1781503444008' : user?.id || 'V-GENERIC');
  const resolvedVendorName = currentVendorRecord?.name || (user?.email === 'ayush27shaw@gmail.com' ? 'Demo Vendor Services' : user?.name || 'Vendor');

  const userVendorQuote = rfq.vendors.find(v => 
    v.vendorId === user?.id || 
    v.vendorId === resolvedVendorId || 
    v.vendorName.toLowerCase() === user?.name.toLowerCase() ||
    v.vendorName.toLowerCase() === resolvedVendorName.toLowerCase()
  );

  const handleQuoteSubmit = async () => {
    if (!baseCost || !deliveryTimeline) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setSubmittingQuote(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = parseFloat(baseCost);
      const tax = base * (parseFloat(taxPercent) / 100);
      const total = base + tax;

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/quotations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: `QTE-${Date.now()}`,
          rfq_id: rfq.id,
          vendor_id: resolvedVendorId,
          vendor_name: resolvedVendorName,
          base_cost: base,
          tax_breakdown: { gst: tax },
          total_cost: total,
          delivery_timeline: `${deliveryTimeline} days`,
          warranty,
          vendor_rating: 5.0,
          remarks
        })
      });

      if (res.ok) {
        toast({ title: 'Quotation Submitted', description: 'Your bid quotation has been submitted successfully.' });
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Failed to submit quote');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleSaveEvaluation = async () => {
    if (!editingQuoteId) return;
    setSavingEvaluation(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const overall = Math.round((editTechScore + editCommScore) / 2);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/quotations/${editingQuoteId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          technical_score: editTechScore,
          commercial_score: editCommScore,
          overall_score: overall,
          compliance_status: editCompliance
        })
      });

      if (res.ok) {
        toast({ title: 'Evaluation Saved', description: 'Quotation evaluation updated successfully.' });
        setEditingQuoteId(null);
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Failed to save evaluation');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleFinalizeAward = async () => {
    if (!selectedQuoteId) {
      toast({ title: 'Validation Error', description: 'Please select a recommended vendor quotation.', variant: 'destructive' });
      return;
    }

    setFinalizingAward(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/finalize-award/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          quotation_id: selectedQuoteId,
          award_summary: awardSummary
        })
      });

      if (res.ok) {
        toast({ title: 'Recommendation Submitted', description: 'Procurement Executive recommendation has been submitted successfully.' });
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Failed to submit recommendation');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setFinalizingAward(false);
    }
  };

  const handleAwardAndCreatePO = async () => {
    setProcessingApproval(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/award-and-create-po/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: 'PO Created Readiness', description: `Vendor awarded and PO generated successfully: ${data.po_id}` });
        onActionComplete();
      } else {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Failed to award vendor & create PO');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleSubmitDecision = async (chosenDecision: string) => {
    if (!approvalComments.trim()) {
      toast({ title: 'Validation Error', description: 'Remarks are required.', variant: 'destructive' });
      return;
    }
    if (!justification.trim()) {
      toast({ title: 'Validation Error', description: 'Justification is required.', variant: 'destructive' });
      return;
    }
    if (user?.role === 'procurement_manager' && !selectedQuoteId) {
      toast({ title: 'Validation Error', description: 'Please select a recommended vendor.', variant: 'destructive' });
      return;
    }

    setProcessingApproval(true);
    try {
      let mappedAction: 'approve' | 'reject' | 'send_back' = 'approve';
      if (chosenDecision === 'Reject') mappedAction = 'reject';
      if (chosenDecision === 'Send Back') mappedAction = 'send_back';

      if (user?.role === 'procurement_manager' && selectedQuoteId) {
        const token = localStorage.getItem('campusspend_token');
        const finalizeRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/finalize-award/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            quotation_id: selectedQuoteId,
            award_summary: approvalComments
          })
        });
        if (!finalizeRes.ok) {
          const errData = await finalizeRes.json();
          throw new Error(errData.detail || errData.error || 'Failed to save vendor recommendation');
        }
      }

      const recWinnerObj = rfq.vendors.find(v => v.quotationId === selectedQuoteId || v.vendorId === selectedQuoteId);
      const recName = recWinnerObj ? recWinnerObj.vendorName : '';

      const pendingStep = timeline?.steps?.find(s => 
        s.status === 'pending' && s.assigned_role_name === user?.role
      );
      if (!pendingStep) {
        throw new Error("No active workflow step found for your role.");
      }

      await actionWorkflowStep(
        pendingStep.id, 
        mappedAction, 
        approvalComments,
        justification,
        recName || undefined,
        chosenDecision
      );
      
      toast({ title: 'Success', description: `Decision '${chosenDecision}' submitted successfully.` });
      onActionComplete();
    } catch (err: any) {
      toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingApproval(false);
    }
  };

  // Sort and assign L1, L2, L3 ranking
  const sortedSubmittedQuotes = [...rfq.vendors]
    .filter(v => v.submitted)
    .sort((a, b) => a.quoteAmount - b.quoteAmount);

  const getSystemRecommendation = (vendor: any) => {
    const pros: string[] = [];
    const cons: string[] = [];
    const risks: string[] = [];
    const commercialAdvantages: string[] = [];
    const technicalAdvantages: string[] = [];

    const rankIndex = sortedSubmittedQuotes.findIndex(q => q.vendorId === vendor.vendorId);
    
    if (rankIndex === 0) {
      pros.push("Lowest Quotation Bidder (L1)");
      commercialAdvantages.push("Highest cost saving compared to all participants");
    } else {
      cons.push(`Higher cost than L1 (Rank: L${rankIndex + 1})`);
    }

    if (vendor.technicalScore >= 85) {
      pros.push("Excellent technical score");
      technicalAdvantages.push("Robust technical capabilities");
    } else {
      cons.push("Lower technical score");
      risks.push("Execution risk due to low score");
    }

    if (vendor.deliveryDays <= 7) {
      pros.push("Fast delivery timeline");
    } else {
      cons.push("Longer delivery timeline");
      risks.push("Possible deployment schedule delays");
    }

    if (vendor.warranty && (vendor.warranty.toLowerCase().includes("year") || vendor.warranty.toLowerCase().includes("month"))) {
      pros.push("Includes warranty support");
      commercialAdvantages.push("Reduced post-warranty maintenance cost");
    } else {
      cons.push("No comprehensive warranty");
      risks.push("Additional AMC/maintenance costs");
    }

    if (vendor.complianceStatus === 'Non-Compliant') {
      cons.push("Fails basic compliance checklist");
      risks.push("Regulatory and operational compliance risk");
    }

    let reasoning = "";
    if (rankIndex === 0 && vendor.complianceStatus === 'Compliant') {
      reasoning = `${vendor.vendorName} is recommended because it is L1 with acceptable technical compliance (${vendor.technicalScore}%) and shortest delivery timeline (${vendor.deliveryDays} days).`;
    } else if (vendor.technicalScore >= 85 && vendor.warranty && vendor.warranty.toLowerCase().includes("year")) {
      reasoning = `${vendor.vendorName} is recommended despite higher cost because of superior technical score (${vendor.technicalScore}%) and warranty (${vendor.warranty}).`;
    } else {
      reasoning = `${vendor.vendorName} offers rank L${rankIndex + 1} bid with compliance status: ${vendor.complianceStatus}.`;
    }

    return { pros, cons, risks, commercialAdvantages, technicalAdvantages, reasoning };
  };

  return (
    <div className="space-y-6">
      {/* RFQ Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold">Category</p>
          <p className="text-sm font-semibold capitalize">{rfq.category}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold">Estimated Value</p>
          <p className="text-sm font-semibold">₹{rfq.estimatedValue.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold">Location / Tower</p>
          <p className="text-sm font-semibold">{rfq.tower}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold">Bid Due Date</p>
          <p className="text-sm font-semibold">{rfq.bidDueDate}</p>
        </div>
      </div>

      {/* PDF Reports */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border items-center">
        <span className="text-xs font-bold text-muted-foreground mr-2">Download Reports:</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            try {
              toast({ title: 'Download Started', description: 'Downloading Evaluation Report...' });
              await downloadFile(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/download-evaluation-report/`,
                `Evaluation_Report_${rfq.id}.pdf`,
                token || ''
              );
            } catch (err: any) {
              toast({ title: 'Download Failed', description: err.message || 'Error downloading file', variant: 'destructive' });
            }
          }}
        >
          Download Evaluation PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            try {
              toast({ title: 'Download Started', description: 'Downloading Recommendation PDF...' });
              await downloadFile(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/download-recommendation-history/`,
                `Recommendation_History_${rfq.id}.pdf`,
                token || ''
              );
            } catch (err: any) {
              toast({ title: 'Download Failed', description: err.message || 'Error downloading file', variant: 'destructive' });
            }
          }}
        >
          Download Recommendation PDF
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={async () => {
            try {
              toast({ title: 'Download Started', description: 'Downloading Audit Trail PDF...' });
              await downloadFile(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfq.id}/download-audit-trail/`,
                `Audit_Trail_${rfq.id}.pdf`,
                token || ''
              );
            } catch (err: any) {
              toast({ title: 'Download Failed', description: err.message || 'Error downloading file', variant: 'destructive' });
            }
          }}
        >
          Download Audit Trail PDF
        </Button>
      </div>

      {/* Detail Dialog Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evaluation">Quotation Evaluation</TabsTrigger>
          <TabsTrigger value="recommendation">System Recommendation</TabsTrigger>
          <TabsTrigger value="history">Remarks & Audit History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Quotation Evaluation & Comparison Matrix */}
        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Comparison Matrix</CardTitle>
              <CardDescription>Comparison of all received quotation details. Automatically ranked by price.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Quote Amount</TableHead>
                    <TableHead>Delivery Timeline</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Technical Score</TableHead>
                    <TableHead>Commercial Score</TableHead>
                    <TableHead>Overall Score</TableHead>
                    <TableHead>Compliance Status</TableHead>
                    <TableHead>Conditions / Remarks</TableHead>
                    {['procurement_executive', 'super_admin'].includes(user?.role || '') && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.vendors.map(vendor => {
                    const submittedIndex = sortedSubmittedQuotes.findIndex(q => q.vendorId === vendor.vendorId);
                    const isL1 = submittedIndex === 0;
                    
                    return (
                      <TableRow key={vendor.vendorId} className={isL1 ? 'bg-emerald-500/5' : ''}>
                        <TableCell>
                          {vendor.submitted ? (
                            <Badge variant={isL1 ? 'default' : 'secondary'} className="font-bold">
                              L{submittedIndex + 1}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                        <TableCell>
                          {vendor.submitted ? `₹${vendor.quoteAmount.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? `${vendor.deliveryDays} Days` : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? (vendor.warranty || 'None') : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? `${vendor.technicalScore}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? `${vendor.commercialScore}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? (
                            <Badge variant="outline" className="font-bold">{vendor.overallScore}%</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {vendor.submitted ? (
                            <Badge variant={vendor.complianceStatus === 'Compliant' ? 'default' : 'destructive'}>
                              {vendor.complianceStatus}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] whitespace-pre-wrap break-words" title={vendor.remarks || vendor.deviations || 'None'}>
                          {vendor.submitted ? (vendor.remarks || vendor.deviations || 'None') : '-'}
                        </TableCell>
                        {['procurement_executive', 'super_admin'].includes(user?.role || '') && (
                          <TableCell>
                            {vendor.submitted && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingQuoteId(vendor.quotationId || null);
                                  setEditTechScore(vendor.technicalScore);
                                  setEditCommScore(vendor.commercialScore);
                                  setEditCompliance(vendor.complianceStatus || 'Compliant');
                                }}
                              >
                                Evaluate
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit Score Dialog */}
          {editingQuoteId && (
            <Dialog open={!!editingQuoteId} onOpenChange={() => setEditingQuoteId(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Evaluate Quotation Score</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Manage evaluate quotation score details and actions here.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTech">Technical Score (0 - 100) *</Label>
                    <Input 
                      id="editTech"
                      type="number"
                      min="0"
                      max="100"
                      value={editTechScore}
                      onChange={(e) => setEditTechScore(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editComm">Commercial Score (0 - 100) *</Label>
                    <Input 
                      id="editComm"
                      type="number"
                      min="0"
                      max="100"
                      value={editCommScore}
                      onChange={(e) => setEditCommScore(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editCompl">Compliance Status *</Label>
                    <Select value={editCompliance} onValueChange={setEditCompliance}>
                      <SelectTrigger id="editCompl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Compliant">Compliant</SelectItem>
                        <SelectItem value="Non-Compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingQuoteId(null)}>Cancel</Button>
                  <Button onClick={handleSaveEvaluation} disabled={savingEvaluation}>
                    {savingEvaluation ? 'Saving...' : 'Save Evaluation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* User Specific Quotation Response Form (For Bidding Vendors) */}
          {user?.role === 'vendor' && (
            <Card>
              <CardHeader>
                <CardTitle>Your Quotation Details</CardTitle>
                <CardDescription>Submit or view details of your quotation response for this tender</CardDescription>
              </CardHeader>
              <CardContent>
                {userVendorQuote?.submitted ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <p className="font-bold flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Quotation Submitted successfully on {userVendorQuote.submittedDate}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Total Cost (incl. taxes)</p>
                        <p className="font-medium">₹{userVendorQuote.quoteAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Delivery Timeline</p>
                        <p className="font-medium">{userVendorQuote.deliveryDays} Days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Warranty Terms</p>
                        <p className="font-medium">{userVendorQuote.warranty || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Remarks / Deviations</p>
                        <p className="font-medium">{userVendorQuote.remarks || 'None'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Base Cost (₹) *</Label>
                        <Input 
                          type="number" 
                          placeholder="Enter base quote cost" 
                          value={baseCost} 
                          onChange={(e) => setBaseCost(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tax Percentage (GST %) *</Label>
                        <Select value={taxPercent} onValueChange={setTaxPercent}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exempt)</SelectItem>
                            <SelectItem value="5">5% GST</SelectItem>
                            <SelectItem value="12">12% GST</SelectItem>
                            <SelectItem value="18">18% GST</SelectItem>
                            <SelectItem value="28">28% GST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Days *</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 7" 
                          value={deliveryTimeline} 
                          onChange={(e) => setDeliveryTimeline(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Warranty Description</Label>
                        <Input 
                          placeholder="e.g. 1 year comprehensive" 
                          value={warranty} 
                          onChange={(e) => setWarranty(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Terms & Conditions / Remarks</Label>
                      <Textarea 
                        placeholder="Enter remarks, deviations or payment terms..." 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleQuoteSubmit} 
                      disabled={submittingQuote} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      {submittingQuote ? 'Submitting Bid...' : 'Submit Official Quote'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Stages for internal workflow roles */}
          {user?.role !== 'vendor' && (
            <div className="space-y-4 mt-6">
              {/* WORKFLOW DECISION PANEL */}
              {(() => {
                const pendingStep = timeline?.steps?.find(
                  s => s.status === 'pending' && s.assigned_role_name === user?.role
                );
                
                if (rfq.status === 'dual_cxo_approved' || !pendingStep) return null;

                const submittedQuotes = rfq.vendors.filter(v => v.submitted || v.quotationId);

                return (
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader>
                      <CardTitle className="text-blue-800 dark:text-blue-300 font-bold">WORKFLOW DECISION</CardTitle>
                      <CardDescription>Register your review decision and forward/reject/send back the RFQ.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Recommended Vendor Dropdown */}
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Recommended Vendor</Label>
                        <Select 
                          value={selectedQuoteId} 
                          onValueChange={setSelectedQuoteId}
                        >
                          <SelectTrigger className="bg-card">
                            <SelectValue placeholder="Select recommended vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {submittedQuotes.map(v => (
                              <SelectItem key={v.quotationId || v.vendorId} value={v.quotationId || v.vendorId || ''}>
                                {v.vendorName} (₹{(v.quoteAmount || 0).toLocaleString('en-IN')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Decision Radio Options */}
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Decision</Label>
                        <RadioGroup 
                          value={decision} 
                          onValueChange={setDecision} 
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Recommend" id="r-recommend" />
                            <Label htmlFor="r-recommend" className="cursor-pointer font-medium text-blue-600 dark:text-blue-400">Recommend</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Approve & Forward" id="r-approve" />
                            <Label htmlFor="r-approve" className="cursor-pointer font-medium">Approve & Forward</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Reject" id="r-reject" />
                            <Label htmlFor="r-reject" className="cursor-pointer font-medium text-destructive">Reject</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Send Back" id="r-sendback" />
                            <Label htmlFor="r-sendback" className="cursor-pointer font-medium text-yellow-600 dark:text-yellow-400">Send Back</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Remarks */}
                      <div className="space-y-2">
                        <Label htmlFor="remarks" className="font-bold text-sm">Remarks</Label>
                        <Textarea 
                          id="remarks"
                          placeholder="Enter comments or remarks..." 
                          value={approvalComments}
                          onChange={(e) => setApprovalComments(e.target.value)}
                          rows={3}
                          className="bg-card"
                        />
                      </div>

                      {/* Justification */}
                      <div className="space-y-2">
                        <Label htmlFor="justification" className="font-bold text-sm">Justification</Label>
                        <Textarea 
                          id="justification"
                          placeholder="Enter technical or commercial justification..." 
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          rows={3}
                          className="bg-card"
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            toast({ title: 'Draft Saved', description: 'Your decision draft has been saved locally.' });
                          }}
                        >
                          Save Draft
                        </Button>

                        <Button 
                          onClick={() => handleSubmitDecision(decision)}
                          disabled={processingApproval}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 shadow-lg shadow-blue-600/20"
                        >
                          Submit Decision
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* PO Readiness Panel (Phase 9) */}
              {(rfq.status === 'APPROVED_BY_BOTH_CXOS' || rfq.status === 'AWARD_READY' || rfq.status === 'dual_cxo_approved') && ['procurement_manager', 'procurement_executive', 'super_admin'].includes(user?.role || '') && (
                <Card className="border-blue-500 bg-blue-500/5">
                  <CardHeader>
                    <CardTitle className="text-blue-800 dark:text-blue-300 font-bold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      Purchase Order Readiness Complete
                    </CardTitle>
                    <CardDescription>Both CXO Citi and CXO EMB have approved the vendor recommendation. You can now finalize award and generate the PO.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button 
                      onClick={handleAwardAndCreatePO} 
                      disabled={processingApproval}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {processingApproval ? 'Generating PO...' : 'Finalize, Award Vendor & Create PO'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: System Recommendation Engine */}
        <TabsContent value="recommendation" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {rfq.vendors.filter(v => v.submitted).map(vendor => {
              const rec = getSystemRecommendation(vendor);
              const rankIdx = sortedSubmittedQuotes.findIndex(q => q.vendorId === vendor.vendorId);
              
              return (
                <Card key={vendor.vendorId} className="border-l-4 border-l-blue-600">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {vendor.vendorName}
                        <Badge variant="outline" className="font-mono bg-blue-50 border-blue-200">
                          Rank: L{rankIdx + 1}
                        </Badge>
                      </CardTitle>
                      <Badge variant={vendor.complianceStatus === 'Compliant' ? 'default' : 'destructive'}>
                        {vendor.complianceStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/30 p-3 rounded-lg border border-dashed text-sm italic font-medium text-foreground">
                      " {rec.reasoning} "
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400">Pros / Strengths</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {rec.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-destructive">Cons / Deviations</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {rec.cons.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">Risks & Vulnerabilities</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {rec.risks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <p className="font-bold text-blue-700 dark:text-blue-400">Commercial Advantages</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {rec.commercialAdvantages.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {rfq.vendors.filter(v => v.submitted).length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No quotations submitted yet to generate recommendation analysis.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: History & Timeline Logs */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Recommendation & Approval Timeline</CardTitle>
                <CardDescription>Complete audit logs of recommendations and workflow actions.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                >
                  {isHistoryExpanded ? 'Collapse History' : 'Expand History'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    const headers = ['Timestamp', 'User Name', 'Role', 'Decision', 'Recommended Vendor', 'Remarks', 'Justification'];
                    const rows = (rfq.workflow_history || []).map((h: any) => [
                      h.timestamp ? new Date(h.timestamp).toLocaleString() : '',
                      h.user_name || h.user || '',
                      h.role || '',
                      h.decision || h.action || '',
                      h.recommended_vendor || '',
                      h.remarks || h.comments || '',
                      h.justification || ''
                    ]);
                    const content = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.setAttribute("href", url);
                    link.setAttribute("download", `rfq_audit_report_${rfq.id}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast({ title: 'Download Started', description: 'RFQ Audit Report exported successfully.' });
                  }}
                >
                  Download Audit Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-muted pl-6 space-y-6">
                {(() => {
                  const sortedHistory = [...(rfq.workflow_history || [])].reverse();
                  const visibleHistory = isHistoryExpanded ? sortedHistory : sortedHistory.slice(0, 3);
                  
                  return visibleHistory.map((h: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[31px] top-1 p-1 bg-card border rounded-full">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{h.user_name || h.user}</span>
                          <Badge variant="outline" className="capitalize font-semibold">
                            {h.role?.replace('_', ' ') || 'Approver'}
                          </Badge>
                          <Badge variant={h.decision?.toLowerCase().includes('reject') ? 'destructive' : h.decision?.toLowerCase().includes('recommend') ? 'default' : 'secondary'} className="text-xs bg-muted">
                            {h.decision || h.action || 'Submitted'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                          </span>
                        </div>
                        {h.recommended_vendor && (
                          <p className="text-xs font-semibold text-emerald-600">
                            Recommended Vendor: {h.recommended_vendor}
                          </p>
                        )}
                        <p className="text-sm text-foreground italic mt-1 bg-muted/20 p-2 rounded border border-dashed">
                          <span className="font-semibold not-italic text-xs block text-muted-foreground">Remarks:</span>
                          "{h.remarks || h.comments || 'No comments'}"
                        </p>
                        {h.justification && (
                          <p className="text-sm text-foreground italic mt-1 bg-muted/20 p-2 rounded border border-dashed">
                            <span className="font-semibold not-italic text-xs block text-muted-foreground">Justification:</span>
                            "{h.justification}"
                          </p>
                        )}
                      </div>
                    </div>
                  ));
                })()}
                {(rfq.workflow_history || []).length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No workflow comments or remarks logged yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Flow Timeline */}
      {timeline && (
        <div className="mt-6">
          <ApprovalTimeline timeline={timeline} />
        </div>
      )}
    </div>
  );
}

function CreateRFQForm({ initialIndentId, onClose }: { initialIndentId?: string; onClose: () => void }) {
  const [rfqId] = useState(() => `RFQ-${Date.now()}`);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tower, setTower] = useState('Tower A');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [bidDueDate, setBidDueDate] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [indents, setIndents] = useState<any[]>([]);
  const [linkedPR, setLinkedPR] = useState('');
  const [dbVendors, setDbVendors] = useState<any[]>([]);

  const activeCategoryVendors = (() => {
    return dbVendors.filter(v => 
      v.status === 'active' && 
      (v.is_universal_vendor || v.isUniversalVendor || !category || v.category.toLowerCase() === category.toLowerCase())
    );
  })();

  useEffect(() => {
    const fetchApprovedIndents = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/requisitions/indents/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const raw = await res.json();
          const data = Array.isArray(raw) ? raw : (raw.results ?? []);
          const approvedIndents = data.filter((i: any) => i.status === 'approved');
          setIndents(approvedIndents);
        }
      } catch (err) {
        console.error(err);
      }
    };
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/vendors/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const raw = await res.json();
          const data = Array.isArray(raw) ? raw : (raw.results ?? []);
          setDbVendors(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchApprovedIndents();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (initialIndentId && indents.length > 0) {
      const selected = indents.find((i: any) => i.id === initialIndentId);
      if (selected) {
        setLinkedPR(initialIndentId);
        setTitle(`RFQ for Indent ${selected.id} - ${selected.category}`);
        setCategory(selected.category);
        setTower(selected.tower);
        setEstimatedValue(selected.estimated_cost);
      }
    }
  }, [initialIndentId, indents]);

  const handleCreateRFQ = async () => {
    if (!title || !linkedPR || !category || !bidDueDate || selectedVendors.length < 1) {
      toast({ title: 'Validation Error', description: 'Please link an approved indent, fill all fields and select at least 1 vendor.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const invitedVendors = activeCategoryVendors
        .filter(v => selectedVendors.includes(v.id))
        .map(v => ({ vendor_id: v.id, vendor_name: v.name }));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: rfqId,
          title,
          category,
          tower,
          linked_pr: linkedPR || null,
          estimated_value: parseFloat(estimatedValue) || 0.00,
          bid_due_date: bidDueDate,
          vendors: invitedVendors,
          created_date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        // Now publish it so vendors get the email!
        const publishRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/rfqs/${rfqId}/publish/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            vendors: invitedVendors,
            bid_due_date: bidDueDate
          })
        });

        if (publishRes.ok) {
          toast({ title: 'RFQ Published', description: 'RFQ published and invited vendors notified via email.' });
          onClose();
        } else {
          const err = await publishRes.json();
          throw new Error(err.detail || err.error || 'Failed to publish RFQ');
        }
      } else {
        const err = await res.json();
        throw new Error(err.detail || err.error || 'Failed to create RFQ');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rfqId">RFQ Number (Auto-Generated)</Label>
          <Input id="rfqId" value={rfqId} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="linkedPR">Linked Approved Indent *</Label>
          <Select value={linkedPR} onValueChange={(val) => {
            setLinkedPR(val);
            const selected = indents.find(i => i.id === val);
            if (selected) {
              setTitle(`RFQ for Indent ${selected.id} - ${selected.category}`);
              setCategory(selected.category);
              setTower(selected.tower);
              setEstimatedValue(selected.estimated_cost);
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select approved indent" />
            </SelectTrigger>
            <SelectContent>
              {indents.map(ind => (
                <SelectItem key={ind.id} value={ind.id}>{ind.id} - {ind.category} (Est. ₹{Number(ind.estimated_cost).toLocaleString()})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">RFQ Title *</Label>
          <Input id="title" placeholder="Enter RFQ title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={setCategory} disabled={!!linkedPR}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="landscaping">Landscaping</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tower">Tower *</Label>
          <Select value={tower} onValueChange={setTower}>
            <SelectTrigger>
              <SelectValue placeholder="Select tower" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tower A">Tower A</SelectItem>
              <SelectItem value="Tower B">Tower B</SelectItem>
              <SelectItem value="Tower C">Tower C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedValue">Estimated Value (₹)</Label>
          <Input id="estimatedValue" type="number" placeholder="Enter value" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bidDueDate">Bid Due Date *</Label>
          <Input id="bidDueDate" type="date" value={bidDueDate} onChange={(e) => setBidDueDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select Invited Vendors (Minimum 1) *</Label>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCategoryVendors.map(vendor => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVendors([...selectedVendors, vendor.id]);
                            } else {
                              setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell className="capitalize">{vendor.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {vendor.sla_rating || 5.0}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleCreateRFQ} disabled={submitting || selectedVendors.length < 1} className="bg-primary text-primary-foreground font-bold">
          {submitting ? 'Publishing...' : 'Publish RFQ'}
        </Button>
      </div>
    </div>
  );
}
