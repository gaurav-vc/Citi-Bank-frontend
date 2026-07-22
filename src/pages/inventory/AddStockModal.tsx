import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  onSuccess: () => void;
}

export function AddStockModal({ isOpen, onClose, items, onSuccess }: AddStockModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const selectedItem = items.find(i => i.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !quantity || !reason || !remarks) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    
    if (Number(quantity) <= 0) {
      toast({ title: 'Error', description: 'Quantity must be strictly > 0.', variant: 'destructive' });
      return;
    }

    if (remarks.length < 10) {
      toast({ title: 'Error', description: 'Remarks must be at least 10 characters long.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/inventory/add-stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          item_id: itemId,
          quantity: Number(quantity),
          reason,
          reference_number: referenceNumber,
          remarks
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Success', description: data.message });
        onSuccess();
        onClose();
        setItemId('');
        setQuantity('');
        setReason('');
        setReferenceNumber('');
        setRemarks('');
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to add stock.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Network error.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock (Manual Adjustment)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item *</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item" />
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom">UOM</Label>
              <Input
                id="uom"
                readOnly
                value={selectedItem?.uom || ''}
                className="bg-muted"
                placeholder="Auto-populated"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Opening Stock">Opening Stock</SelectItem>
                <SelectItem value="Inventory Correction">Inventory Correction</SelectItem>
                <SelectItem value="Found During Audit">Found During Audit</SelectItem>
                <SelectItem value="Return From Site">Return From Site</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              placeholder="e.g. AUDIT-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks *</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Minimum 10 characters..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Stock'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
