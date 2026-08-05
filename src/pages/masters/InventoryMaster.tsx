import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryField {
  id: number;
  field_type: string;
  value: string;
  label: string;
  is_active: boolean;
}

const FIELD_CHOICES = [
  { value: 'request_type', label: 'Request Type' },
  { value: 'budget_head', label: 'Budget Head' },
  { value: 'tower', label: 'Tower' },
  { value: 'floor', label: 'Floor' },
  { value: 'category', label: 'Category' },
];

export default function InventoryMaster() {
  const { token } = useAuth();
  const [fields, setFields] = useState<InventoryField[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const authToken = localStorage.getItem('campusspend_token') || token;
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/setups/inventory-master-fields/`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setFields(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Error fetching inventory master fields:', err);
    }
  };

  const deleteField = async (id: number) => {
    try {
      const authToken = localStorage.getItem('campusspend_token') || token;
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/setups/inventory-master-fields/${id}/`, {
        method: 'DELETE',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Field deleted successfully' });
        fetchFields();
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error deleting field', variant: 'destructive' });
    }
  };

  const filteredFields = filterType === 'all' ? fields : fields.filter(f => f.field_type === filterType);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Master</h1>
            <p className="text-muted-foreground">Manage configurable dropdown options for Indent and Inventory</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Option</DialogTitle>
                  <DialogDescription>Add a new option to a dropdown field.</DialogDescription>
                </DialogHeader>
                <CreateFieldForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchFields} token={token} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by Field Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {FIELD_CHOICES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Value (Internal)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No options found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">
                        {FIELD_CHOICES.find(c => c.value === field.field_type)?.label || field.field_type}
                      </TableCell>
                      <TableCell>{field.label}</TableCell>
                      <TableCell className="font-mono text-sm">{field.value}</TableCell>
                      <TableCell>
                        <Badge variant={field.is_active ? 'default' : 'secondary'}>
                          {field.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

function CreateFieldForm({ onClose, onSuccess, token }: { onClose: () => void; onSuccess: () => void, token: string | null }) {
  const [fieldType, setFieldType] = useState<string>(FIELD_CHOICES[0].value);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  // Reset fields when field type changes
  useEffect(() => {
    setLabel('');
    setValue('');
  }, [fieldType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('campusspend_token') || token;
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };
    
    // Auto generate value from label if empty
    const finalValue = value.trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/setups/inventory-master-fields/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          field_type: fieldType,
          label,
          value: finalValue,
          is_active: true
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Option created successfully' });
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to create option', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error creating option', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="space-y-3">
        <Label className="text-base font-semibold">Field Type *</Label>
        <Select value={fieldType} onValueChange={setFieldType}>
          <SelectTrigger className="h-12 text-base w-full">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_CHOICES.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-base py-3 cursor-pointer">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label className="text-base font-semibold">Label (Display Name) *</Label>
        <Input className="h-12 text-base" placeholder="e.g. Electrical, Tower A" value={label} onChange={e => setLabel(e.target.value)} required />
      </div>
      <div className="space-y-3">
        <Label className="text-base font-semibold">Value (Internal ID, Optional)</Label>
        <Input className="h-12 text-base" placeholder="Leave blank to auto-generate from label" value={value} onChange={e => setValue(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-6">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="lg">Add Option</Button>
      </div>
    </form>
  );
}
