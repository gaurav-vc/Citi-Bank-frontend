import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Undo2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export default function RTVEntry() {
  const [rtvs, setRtvs] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [selectedGrn, setSelectedGrn] = useState('');
  const [vendorRef, setVendorRef] = useState('');
  const [reason, setReason] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    fetchRtvs();
    fetchGrns();
  }, []);

  const fetchRtvs = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/rtvs/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setRtvs(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGrns = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      // Fetch only partial_accepted or rejected GRNs for RTV creation
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/grns/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const allGrns = Array.isArray(data) ? data : data.results || [];
        setGrns(allGrns.filter((g: any) => g.status === 'rejected' || g.status === 'partial_accepted'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!selectedGrn || !vendorRef) {
      toast({ title: 'Error', description: 'Please select a GRN and provide a vendor reference.', variant: 'destructive' });
      return;
    }

    const grn = grns.find(g => g.id === selectedGrn);
    if (!grn) return;

    // Filter items to only include those that were rejected
    const returnItems = grn.status === 'rejected' 
      ? grn.items.map((i: any) => ({ item_id: i.item_id, item_name: i.item_name, quantity: i.received_qty, uom: i.uom }))
      : grn.items.filter((i: any) => i.rejected_qty > 0).map((i: any) => ({
          item_id: i.item_id,
          item_name: i.item_name,
          quantity: i.rejected_qty,
          uom: i.uom
        }));

    if (returnItems.length === 0) {
      toast({ title: 'Error', description: 'Selected GRN has no rejected quantities to return.', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('campusspend_token');
      const payload = {
        id: `RTV-${Date.now()}`,
        grn_id: selectedGrn,
        vendor_reference: vendorRef,
        reason,
        items: returnItems,
        status: 'returned'
      };

      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/rtvs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: 'RTV Created', description: 'Return To Vendor successfully generated.' });
        setIsCreating(false);
        setVendorRef('');
        setReason('');
        setSelectedGrn('');
        fetchRtvs();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create RTV');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Return To Vendor (RTV)</h1>
            <p className="text-muted-foreground">Manage rejected items returning to vendors.</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Undo2 className="h-4 w-4 mr-2" />
                Create RTV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate RTV</DialogTitle>
                <DialogDescription>Select a GRN with rejected quantities.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source GRN</label>
                  <select 
                    className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedGrn}
                    onChange={(e) => setSelectedGrn(e.target.value)}
                  >
                    <option value="">Select GRN...</option>
                    {grns.map(g => (
                      <option key={g.id} value={g.id}>{g.id} ({g.vendor_name || 'Internal'})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vendor RMA/Reference</label>
                  <Input 
                    placeholder="e.g. RMA-99812" 
                    value={vendorRef}
                    onChange={(e) => setVendorRef(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for Return</label>
                  <Input 
                    placeholder="e.g. Damaged in transit" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleCreate}>Generate Return</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RTV Number</TableHead>
                  <TableHead>Source GRN</TableHead>
                  <TableHead>Vendor Reference</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rtvs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No Return To Vendor records found
                    </TableCell>
                  </TableRow>
                ) : (
                  rtvs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((rtv) => (
                    <TableRow key={rtv.id}>
                      <TableCell className="font-mono text-sm">{rtv.id}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{rtv.grn_id}</TableCell>
                      <TableCell className="font-medium">{rtv.vendor_reference}</TableCell>
                      <TableCell>{new Date(rtv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rtv.items?.length || 0} items</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-destructive/10 text-destructive border-destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {rtv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {rtvs.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(rtvs.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(rtvs.length / PAGE_SIZE), p + 1))}
                  onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
