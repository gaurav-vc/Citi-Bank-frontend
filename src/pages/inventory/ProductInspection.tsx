import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Filter, ClipboardCheck, Clock, CheckCircle, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface Inspection {
  id: string;
  po_id: string;
  vendor_name: string;
  received_date: string;
  inspector_name: string;
  items: any[];
  status: string;
  challan_number: string;
}

export default function ProductInspection() {
  const { token, user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inspections/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : (raw.results ?? []);
        setInspections(data);
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
    }
  };

  const filteredInspections = inspections.filter(ins => {
    return ins.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ins.po_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quality Inspection</h1>
            <p className="text-muted-foreground">Log incoming materials and perform QC to generate GRN</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Inspect Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Inspect Incoming Delivery</DialogTitle>
                <DialogDescription>Record quantities received and quality control results.</DialogDescription>
              </DialogHeader>
              <CreateInspectionForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchInspections} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="pending">Pending QC</TabsTrigger>
              <TabsTrigger value="completed">QC Completed</TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>

          <TabsContent value="pending">
            <InspectionTable 
              inspections={filteredInspections.filter(i => i.status === 'pending')} 
              onProcess={setSelectedInspection}
            />
          </TabsContent>
          <TabsContent value="completed">
            <InspectionTable 
              inspections={filteredInspections.filter(i => i.status === 'completed')} 
            />
          </TabsContent>
        </Tabs>
        
        {selectedInspection && (
          <Dialog open={!!selectedInspection} onOpenChange={(open) => !open && setSelectedInspection(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Complete QC - {selectedInspection.id}</DialogTitle>
                <DialogDescription>Finalize the accepted and rejected quantities for this delivery.</DialogDescription>
              </DialogHeader>
              <QCForm 
                inspection={selectedInspection} 
                onClose={() => setSelectedInspection(null)} 
                onSuccess={() => { setSelectedInspection(null); fetchInspections(); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}

function InspectionTable({ inspections, onProcess }: { inspections: Inspection[], onProcess?: (ins: Inspection) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [inspections.length]);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>PO Ref</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspections.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inspections found</TableCell></TableRow>
            ) : (
              inspections.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((ins) => (
                <TableRow key={ins.id}>
                  <TableCell className="font-mono text-sm">{ins.id}</TableCell>
                  <TableCell>{ins.po_id}</TableCell>
                  <TableCell>{ins.vendor_name || 'N/A'}</TableCell>
                  <TableCell>{ins.received_date}</TableCell>
                  <TableCell>{ins.items.length}</TableCell>
                  <TableCell>
                    <Badge variant={ins.status === 'completed' ? 'default' : 'secondary'}>
                      {ins.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ins.status === 'pending' && onProcess && (
                      <Button variant="outline" size="sm" onClick={() => onProcess(ins)}>
                        Complete QC
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {inspections.length > PAGE_SIZE && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <DataTablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(inspections.length / PAGE_SIZE)}
              onPageChange={setCurrentPage}
              onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(inspections.length / PAGE_SIZE), p + 1))}
              onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateInspectionForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token, user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanNumber, setChallanNumber] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [poTower, setPoTower] = useState('');
  const [poCategory, setPoCategory] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/orders/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const raw = await res.json();
          const data = Array.isArray(raw) ? raw : (raw.results ?? []);
          const eligible = data.filter((po: any) => po.status === 'approved' || po.status === 'active');
          setPurchaseOrders(eligible);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPOs();
  }, []);

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setVendorName(po.vendor_name || po.vendorName || po.vendor || '');
      setPoTower(po.tower || '');
      setPoCategory(po.category || '');
      
      setItems(po.items.map((item: any) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        orderedQty: item.quantity,
        receivedQty: item.quantity,
        acceptedQty: 0,
        rejectedQty: 0,
        uom: item.uom
      })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inspections/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          id: `INSP-${Date.now()}`,
          po_id: selectedPoId,
          received_date: receivedDate,
          challan_number: challanNumber,
          inspector_name: user?.name || 'Store Keeper',
          items
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'Inspection logged successfully.' });
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to create inspection');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Purchase Order</Label>
          <Select value={selectedPoId} onValueChange={handlePoChange}>
            <SelectTrigger><SelectValue placeholder="Select PO" /></SelectTrigger>
            <SelectContent>
              {purchaseOrders.map(po => (
                <SelectItem key={po.id} value={po.id}>{po.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Received Date</Label>
          <Input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Vendor Name</Label>
          <Input value={vendorName} readOnly className="bg-muted" placeholder="Autofilled from PO" />
        </div>
        <div className="space-y-2">
          <Label>Challan Number</Label>
          <Input value={challanNumber} onChange={e => setChallanNumber(e.target.value)} placeholder="Enter delivery challan number" required />
        </div>
        <div className="space-y-2">
          <Label>Tower / Location</Label>
          <Input value={poTower} readOnly className="bg-muted" placeholder="Autofilled from PO" />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={poCategory} readOnly className="bg-muted" placeholder="Autofilled from PO" />
        </div>
      </div>
      
      {items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Ordered</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.itemName}</TableCell>
                <TableCell>{item.orderedQty}</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={item.receivedQty} 
                    onChange={e => {
                      const newItems = [...items];
                      newItems[idx].receivedQty = Number(e.target.value);
                      setItems(newItems);
                    }} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!selectedPoId}>Log Delivery</Button>
      </div>
    </form>
  );
}

function QCForm({ inspection, onClose, onSuccess }: { inspection: Inspection; onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>(inspection.items);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inspections/${inspection.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status: 'completed',
          items
        })
      });

      if (res.ok) {
        toast({ title: 'Success', description: 'QC Completed. GRN will be automatically generated for accepted items.' });
        onSuccess();
      } else {
        throw new Error('Failed to complete QC');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Accepted</TableHead>
            <TableHead>Rejected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.itemName || item.item_name}</TableCell>
              <TableCell>{item.receivedQty || item.received_qty}</TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  value={item.acceptedQty} 
                  onChange={e => {
                    const newItems = [...items];
                    const accepted = Number(e.target.value);
                    newItems[idx].acceptedQty = accepted;
                    newItems[idx].rejectedQty = Math.max(0, (item.receivedQty || item.received_qty) - accepted);
                    setItems(newItems);
                  }} 
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  value={item.rejectedQty} 
                  onChange={e => {
                    const newItems = [...items];
                    newItems[idx].rejectedQty = Number(e.target.value);
                    setItems(newItems);
                  }} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit">Complete QC</Button>
      </div>
    </form>
  );
}
