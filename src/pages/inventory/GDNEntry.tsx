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
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function GDNEntry() {
  const [gdns, setGdns] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [selectedGrn, setSelectedGrn] = useState('');
  const [destination, setDestination] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchGdns();
    fetchGrns();
  }, []);

  const fetchGdns = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/gdns/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setGdns(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGrns = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      // Fetch only accepted or partial_accepted GRNs for GDN creation
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/grns/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const allGrns = Array.isArray(data) ? data : data.results || [];
        setGrns(allGrns.filter((g: any) => g.status === 'accepted' || g.status === 'partial_accepted'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!selectedGrn || !destination) {
      toast({ title: 'Error', description: 'Please select a GRN and provide a destination.', variant: 'destructive' });
      return;
    }

    const grn = grns.find(g => g.id === selectedGrn);
    if (!grn) return;

    // Filter items to only include those that were accepted
    const dispatchItems = grn.items
      .filter((i: any) => i.accepted_qty > 0)
      .map((i: any) => ({
        item_id: i.item_id,
        item_name: i.item_name,
        quantity: i.accepted_qty,
        uom: i.uom
      }));

    try {
      const token = localStorage.getItem('campusspend_token');
      const payload = {
        id: `GDN-${Date.now()}`,
        grn_id: selectedGrn,
        destination,
        items: dispatchItems,
        status: 'dispatched'
      };

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/gdns/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: 'GDN Created', description: 'Goods Dispatch Note successfully generated.' });
        setIsCreating(false);
        setDestination('');
        setSelectedGrn('');
        fetchGdns();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create GDN');
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
            <h1 className="text-3xl font-bold text-foreground">Goods Dispatch Note (GDN)</h1>
            <p className="text-muted-foreground">Manage outbound stock movement from accepted GRNs.</p>
          </div>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Truck className="h-4 w-4 mr-2" />
                Create GDN
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate GDN</DialogTitle>
                <DialogDescription>Select an accepted GRN to dispatch.</DialogDescription>
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
                  <label className="text-sm font-medium">Destination</label>
                  <Input 
                    placeholder="e.g. Project Site Alpha" 
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Generate Note</Button>
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
                  <TableHead>GDN Number</TableHead>
                  <TableHead>Source GRN</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gdns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No Goods Dispatch Notes found
                    </TableCell>
                  </TableRow>
                ) : (
                  gdns.map((gdn) => (
                    <TableRow key={gdn.id}>
                      <TableCell className="font-mono text-sm">{gdn.id}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{gdn.grn_id}</TableCell>
                      <TableCell className="font-medium">{gdn.destination}</TableCell>
                      <TableCell>{new Date(gdn.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{gdn.items?.length || 0} items</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {gdn.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
