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
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Switch } from "@/components/ui/switch";

interface InventoryField {
  id: number;
  field_type: string;
  value: string;
  label: string;
  description: string;
  is_mandatory: boolean;
  is_active: boolean;
}

export default function InventoryMaster() {
  const { token } = useAuth();
  const [fields, setFields] = useState<InventoryField[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingField, setEditingField] = useState<InventoryField | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredFields.length, filterType]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Master Indent Setup</h1>
            <p className="text-muted-foreground">Manage advanced configuration and dynamic options for Indents and Inventory</p>
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
                <CreateFieldForm onClose={() => setIsCreateOpen(false)} onSuccess={fetchFields} token={token} existingFields={fields} />
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Option</DialogTitle>
                  <DialogDescription>Modify an existing dropdown field option.</DialogDescription>
                </DialogHeader>
                {editingField && (
                  <EditFieldForm 
                    field={editingField} 
                    onClose={() => setEditingField(null)} 
                    onSuccess={fetchFields} 
                    token={token} 
                    existingFields={fields} 
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 items-center mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by Field Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {Array.from(new Set(fields.map(f => f.field_type))).map(type => (
                <SelectItem key={type} value={type}>
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {filterType !== 'all' && (
            <Button variant="ghost" onClick={() => { setFilterType('all'); setCurrentPage(1); }} className="text-muted-foreground hover:text-foreground">
              Clear Filter
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Value (Internal)</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No options found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFields.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="font-medium">
                        {field.field_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{field.label}</span>
                          {field.description && <span className="text-xs text-muted-foreground mt-0.5">{field.description}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{field.value}</TableCell>
                      <TableCell>
                        <Badge variant={field.is_mandatory ? 'default' : 'secondary'} className={field.is_mandatory ? 'bg-rose-500 hover:bg-rose-600' : ''}>
                          {field.is_mandatory ? 'Required' : 'Optional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={field.is_active ? 'default' : 'secondary'}>
                          {field.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingField(field)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteField(field.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredFields.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredFields.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(filteredFields.length / PAGE_SIZE), p + 1))}
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

function CreateFieldForm({ onClose, onSuccess, token, existingFields }: { onClose: () => void; onSuccess: () => void, token: string | null, existingFields: InventoryField[] }) {
  const [fieldType, setFieldType] = useState<string>('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);

  const uniqueTypes = Array.from(new Set(existingFields.map(f => f.field_type)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('campusspend_token') || token;
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };
    
    // Auto generate value from label if empty
    const finalValue = value.trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    // Auto format fieldType
    const finalFieldType = fieldType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/setups/inventory-master-fields/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          field_type: finalFieldType,
          label,
          value: finalValue,
          description,
          is_mandatory: isMandatory,
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
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Category Type *</Label>
        <Input 
          list="field-types" 
          className="h-11" 
          placeholder="e.g. request_type or Cost Center" 
          value={fieldType} 
          onChange={e => setFieldType(e.target.value)} 
          required 
        />
        <datalist id="field-types">
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">Select an existing category or type a new one.</p>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Label (Display Name) *</Label>
        <Input className="h-11" placeholder="e.g. Electrical, Tower A" value={label} onChange={e => setLabel(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Internal Value (Optional)</Label>
        <Input className="h-11" placeholder="Auto-generated if left blank" value={value} onChange={e => setValue(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Advanced Description (Optional)</Label>
        <Input className="h-11" placeholder="Help text or instructions for users" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="flex items-center space-x-3 pt-2 pb-2">
        <Switch 
          id="is_mandatory" 
          checked={isMandatory}
          onCheckedChange={setIsMandatory}
        />
        <Label htmlFor="is_mandatory" className="text-sm font-semibold text-slate-700 cursor-pointer">Strict Compliance (Mandatory)</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Create Option</Button>
      </div>
    </form>
  );
}

function EditFieldForm({ field, onClose, onSuccess, token, existingFields }: { field: InventoryField, onClose: () => void; onSuccess: () => void, token: string | null, existingFields: InventoryField[] }) {
  const [fieldType, setFieldType] = useState<string>(field.field_type);
  const [label, setLabel] = useState(field.label);
  const [value, setValue] = useState(field.value);
  const [description, setDescription] = useState(field.description || '');
  const [isMandatory, setIsMandatory] = useState(field.is_mandatory);

  const uniqueTypes = Array.from(new Set(existingFields.map(f => f.field_type)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('campusspend_token') || token;
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    };
    
    const finalValue = value.trim() || label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const finalFieldType = fieldType.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    try {
      const res = await fetch(`${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/setups/inventory-master-fields/${field.id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          field_type: finalFieldType,
          label,
          value: finalValue,
          description,
          is_mandatory: isMandatory,
          is_active: field.is_active
        })
      });
      if (res.ok) {
        toast({ title: 'Success', description: 'Option updated successfully' });
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to update option', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Error updating option', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Category Type *</Label>
        <Input 
          list="edit-field-types" 
          className="h-11" 
          placeholder="e.g. request_type or Cost Center" 
          value={fieldType} 
          onChange={e => setFieldType(e.target.value)} 
          required 
        />
        <datalist id="edit-field-types">
          {uniqueTypes.map(t => (
            <option key={t} value={t}>{t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
          ))}
        </datalist>
      </div>
      
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Label (Display Name) *</Label>
        <Input className="h-11" placeholder="e.g. Electrical, Tower A" value={label} onChange={e => setLabel(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Internal Value</Label>
        <Input className="h-11" value={value} onChange={e => setValue(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700">Advanced Description (Optional)</Label>
        <Input className="h-11" placeholder="Help text or instructions for users" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div className="flex items-center space-x-3 pt-2 pb-2">
        <Switch 
          id="edit_is_mandatory" 
          checked={isMandatory}
          onCheckedChange={setIsMandatory}
        />
        <Label htmlFor="edit_is_mandatory" className="text-sm font-semibold text-slate-700 cursor-pointer">Strict Compliance (Mandatory)</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
}
