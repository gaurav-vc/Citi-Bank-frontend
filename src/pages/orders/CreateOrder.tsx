import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { ordersAPI } from '@/api/orders';
import { commonAPI } from '@/api/common';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, ShoppingCart, Calendar, 
  Wrench, Send, Save, ArrowLeft, Upload
} from 'lucide-react';

interface OrderItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  amount: number;
  deliveredQty: number;
  balanceQty: number;
}

export default function CreateOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<'po' | 'wo' | 'amc'>('po');
  const [vendors, setVendors] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  
  const [selectedRfq, setSelectedRfq] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTower, setSelectedTower] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('delivery');
  const [retentionPercent, setRetentionPercent] = useState<number>(5);
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');
  const [attachments, setAttachments] = useState<any[]>([]);

  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', itemName: '', description: '', quantity: 1, uom: 'Nos', rate: 0, amount: 0, deliveredQty: 0, balanceQty: 1 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch Vendors
        const vendorsData = await commonAPI.getVendors();
        if (vendorsData) {
          setVendors(Array.isArray(vendorsData) ? vendorsData : (vendorsData.results ?? []));
        }

        // Fetch RFQs
        const rfqsQuery = id ? `unconverted=true&current_po=${id}` : 'unconverted=true';
        const rfqsRes = await api.get(`rfqs/?${rfqsQuery}`);
        if (rfqsRes) {
          setRfqs(Array.isArray(rfqsRes) ? rfqsRes : (rfqsRes.results ?? []));
        }

        // Fetch Catalog Items
        const itemsData = await commonAPI.getItems();
        if (itemsData) {
          setItemsCatalog(Array.isArray(itemsData) ? itemsData : (itemsData.results ?? []));
        }
      } catch (err) {
        console.error('Error fetching catalog data:', err);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchOrderDetails = async () => {
        setLoading(true);
        try {
          const data = await ordersAPI.getOrder(id);
          if (data) {
            setOrderType(data.type);
            setSelectedRfq(data.linked_rfq || '');
            setSelectedVendor(data.vendor);
            setSelectedCategory(data.category);
            setSelectedTower(data.tower);
            setDeliveryDate(data.start_date || '');
            setEndDate(data.end_date || '');
            setRetentionPercent(data.retention_percent ?? 5);
            setItems((data.items ?? []).map((i: any, index: number) => ({
              id: i.id || index.toString(),
              itemName: i.itemName || i.item_name || '',
              description: i.description || '',
              quantity: i.quantity || 1,
              uom: i.uom || 'Nos',
              rate: typeof i.rate === 'string' ? parseFloat(i.rate) : i.rate || 0,
              amount: (i.quantity || 1) * (i.rate || 0),
              deliveredQty: i.deliveredQty || 0,
              balanceQty: i.balanceQty || i.quantity || 1
            })));
            setTermsAndConditions(data.terms_and_conditions || '');
            setAttachments(data.attachments || []);
          } else {
            toast({ title: 'Error', description: 'Failed to fetch PO details.', variant: 'destructive' });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetails();
    }
  }, [id]);

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      itemName: '', 
      description: '', 
      quantity: 1, 
      uom: 'Nos', 
      rate: 0, 
      amount: 0,
      deliveredQty: 0,
      balanceQty: 1
    }]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const updateItem = (itemId: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
          updated.balanceQty = updated.quantity - updated.deliveredQty;
        }
        return updated;
      }
      return item;
    }));
  };

  const selectCatalogItem = (itemId: string, catalogItemId: string) => {
    const matched = itemsCatalog.find(i => i.id === catalogItemId);
    if (matched) {
      setItems(items.map(item => {
        if (item.id === itemId) {
          const rate = matched.unit_price || matched.unitPrice || 0;
          return {
            ...item,
            itemName: matched.name,
            uom: matched.uom || 'Nos',
            rate: rate,
            amount: item.quantity * rate,
            balanceQty: item.quantity
          };
        }
        return item;
      }));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gstPercent = 18;
  const gstAmount = subtotal * (gstPercent / 100);
  const retentionAmount = subtotal * (retentionPercent / 100);
  const total = subtotal + gstAmount - retentionAmount;

  const handleSavePO = async (statusVal: 'draft' | 'submitted') => {
    if (!selectedVendor || !selectedCategory || !selectedTower || !deliveryDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Vendor, Category, Tower, Date).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const poId = id || `PO-${Date.now()}`;
      
      const vendorObj = vendors.find(v => v.id === selectedVendor);
      const vendorName = vendorObj ? vendorObj.name : 'Unknown Vendor';

      const payload = {
        id: poId,
        type: orderType,
        vendor: selectedVendor,
        vendor_name: vendorName,
        linked_rfq: selectedRfq || null,
        items: items.map(item => ({
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          uom: item.uom,
          rate: item.rate,
          amount: item.amount,
          deliveredQty: item.deliveredQty,
          balanceQty: item.balanceQty
        })),
        total_value: subtotal,
        taxes: Number(gstAmount.toFixed(2)),
        net_value: subtotal + gstAmount,
        retention_percent: retentionPercent,
        milestones: orderType === 'wo' ? [
          { id: 'm1', name: 'Milestone 1 (Mobilization)', percentage: 30, dueDate: deliveryDate, status: 'pending' },
          { id: 'm2', name: 'Milestone 2 (Completion)', percentage: 70, dueDate: endDate || deliveryDate, status: 'pending' }
        ] : [],
        start_date: deliveryDate,
        end_date: endDate || deliveryDate,
        tower: selectedTower,
        category: selectedCategory,
        status: statusVal === 'submitted' 
          ? 'pending_finance_validation' 
          : 'draft',
        attachments: attachments
      };

      if (id) {
        await ordersAPI.updateOrder(id, payload);
      } else {
        await ordersAPI.createOrder(payload);
      }

      if (statusVal === 'submitted') {
        // Trigger approval workflow initiation
        try {
          await api.post('workflows/submit/', {
            module: 'orders',
            entity_id: poId
          });
          toast({ title: 'PO Submitted', description: 'Purchase Order submitted & workflow started successfully.' });
        } catch (wfErr) {
          toast({ title: 'Warning', description: 'PO saved but failed to trigger approval workflow.', variant: 'destructive' });
        }
      } else {
        toast({ title: 'PO Saved', description: 'Purchase Order draft saved successfully.' });
      }
      navigate('/orders/po');
    } catch (err: any) {
      toast({ title: 'Submission Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }));
      setAttachments([...attachments, ...filesArray]);
    }
  };

  const handleRfqSelection = async (rfqId: string) => {
    setSelectedRfq(rfqId);
    if (!rfqId) return;
    try {
      const rfqData = await api.get(`rfqs/${rfqId}/`);
      if (rfqData) {
        if (rfqData.category) setSelectedCategory(rfqData.category);
        if (rfqData.tower) setSelectedTower(rfqData.tower);
        
        if (rfqData.vendors && rfqData.vendors.length > 0) {
          const firstVendor = rfqData.vendors[0];
          const vId = typeof firstVendor === 'string' ? firstVendor : (firstVendor.id || firstVendor.vendor_id || '');
          if (vId) setSelectedVendor(vId);
        }
        
        if (rfqData.linked_pr) {
          const prData = await api.get(`indents/${rfqData.linked_pr}/`);
          if (prData) {
            if (prData.items && prData.items.length > 0) {
              const mappedItems = prData.items.map((i: any, idx: number) => {
                const qty = i.quantity || i.qty || 1;
                const rate = i.rate || i.estimated_rate || 0;
                return {
                  id: `rfq-${idx}-${Date.now()}`,
                  itemName: i.itemName || i.item_name || '',
                  description: i.description || '',
                  quantity: qty,
                  uom: i.uom || 'Nos',
                  rate: rate,
                  amount: qty * rate,
                  deliveredQty: 0,
                  balanceQty: qty
                };
              });
              setItems(mappedItems);
              toast({ title: 'RFQ Loaded', description: 'Vendor, category, tower, and items populated from RFQ successfully.' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error auto-populating from RFQ:', err);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/orders/po')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {id ? 'Edit Order' : 'Create Order'}
              </h1>
              <p className="text-muted-foreground">
                {id ? `Editing PO Draft: ${id}` : 'Create a new Purchase Order, Work Order, or AMC Order'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Type Selection */}
        {!id && (
          <div className="grid grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${orderType === 'po' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
              onClick={() => setOrderType('po')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${orderType === 'po' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Purchase Order</p>
                    <p className="text-sm text-muted-foreground">Material procurement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${orderType === 'wo' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
              onClick={() => setOrderType('wo')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${orderType === 'wo' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">Work Order</p>
                    <p className="text-sm text-muted-foreground">Service/labor work</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${orderType === 'amc' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
              onClick={() => setOrderType('amc')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${orderType === 'amc' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">AMC Order</p>
                    <p className="text-sm text-muted-foreground">Annual maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {orderType === 'po' && <ShoppingCart className="h-5 w-5" />}
              {orderType === 'wo' && <Wrench className="h-5 w-5" />}
              {orderType === 'amc' && <Calendar className="h-5 w-5" />}
              {orderType === 'po' ? 'Purchase Order' : orderType === 'wo' ? 'Work Order' : 'AMC Order'} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Linked RFQ (Optional)</Label>
                <Select value={selectedRfq || '__placeholder__'} onValueChange={(val) => handleRfqSelection(val === '__placeholder__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RFQ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">Select RFQ</SelectItem>
                    {rfqs
                      .filter(rfq => rfq && rfq.id && rfq.id.trim() !== '')
                      .map(rfq => (
                        <SelectItem key={rfq.id} value={rfq.id}>
                          {rfq.id} - {rfq.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={selectedVendor || '__placeholder__'} onValueChange={(val) => setSelectedVendor(val === '__placeholder__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">Select vendor</SelectItem>
                    {vendors
                      .filter(v => v && v.id && v.id.trim() !== '')
                      .map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={selectedCategory || '__placeholder__'} onValueChange={(val) => setSelectedCategory(val === '__placeholder__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">Select category</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Soft Services">Soft Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tower *</Label>
                <Select value={selectedTower || '__placeholder__'} onValueChange={(val) => setSelectedTower(val === '__placeholder__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tower" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">Select tower</SelectItem>
                    <SelectItem value="Tower A">Tower A</SelectItem>
                    <SelectItem value="Tower B">Tower B</SelectItem>
                    <SelectItem value="Tower C">Tower C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{orderType === 'amc' ? 'Start Date *' : 'Delivery Date *'}</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{orderType === 'amc' ? 'End Date *' : 'End Date (Optional)'}</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={paymentTerms || '__placeholder__'} onValueChange={(val) => setPaymentTerms(val === '__placeholder__' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__placeholder__">Select terms</SelectItem>
                    <SelectItem value="advance">100% Advance</SelectItem>
                    <SelectItem value="delivery">On Delivery</SelectItem>
                    <SelectItem value="net30">Net 30 Days</SelectItem>
                    <SelectItem value="net60">Net 60 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Retention Percentage (%)</Label>
                <Input type="number" min="0" max="100" value={retentionPercent} onChange={(e) => setRetentionPercent(parseInt(e.target.value) || 0)} />
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {orderType === 'po' ? 'Items' : orderType === 'wo' ? 'Work Items' : 'Service Items'}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Catalog Item (Optional)</TableHead>
                    <TableHead>Item/Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="w-24">UOM</TableHead>
                    <TableHead className="w-32">Rate (₹)</TableHead>
                    <TableHead className="w-32">Amount (₹)</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="w-[180px]">
                        <Select onValueChange={(val) => selectCatalogItem(item.id, val === '__placeholder__' ? '' : val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select from catalog" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__placeholder__">Select from catalog</SelectItem>
                            {itemsCatalog
                              .filter(catalog => catalog && catalog.id && catalog.id.trim() !== '')
                              .map(catalog => (
                                <SelectItem key={catalog.id} value={catalog.id}>
                                  {catalog.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Enter item name"
                          value={item.itemName}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="UOM"
                          value={item.uom}
                          onChange={(e) => updateItem(item.id, 'uom', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <Card className="w-80">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST ({gstPercent}%)</span>
                    <span className="font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {retentionPercent > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span className="text-muted-foreground text-rose-600">Retention ({retentionPercent}%)</span>
                      <span className="font-medium">-₹{retentionAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg text-primary">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea 
                placeholder="Enter additional terms and conditions..."
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-2 pt-2">
              <Label>Attachments</Label>
              <div className="flex items-center gap-4">
                <Input type="file" multiple onChange={handleFileUpload} className="max-w-xs" />
                <span className="text-xs text-muted-foreground">Upload supporting PDFs, specifications, or contracts.</span>
              </div>
              {attachments.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs border p-3 rounded-lg bg-slate-50/50">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center p-1 bg-white border rounded">
                      <span className="font-medium truncate max-w-[180px]">{file.name}</span>
                      <span className="text-muted-foreground">{file.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => navigate('/orders/po')} disabled={loading}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => handleSavePO('draft')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button onClick={() => handleSavePO('submitted')} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Submit for Approval
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
