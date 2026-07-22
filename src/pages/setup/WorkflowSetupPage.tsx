import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RoleLabels } from '@/types';
import { Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const MODULES = [
  { id: 'indents', label: 'Indents / Purchase Requisitions' },
  { id: 'rfqs', label: 'RFQs / Vendor Selection' },
  { id: 'orders', label: 'Purchase Orders' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payments', label: 'Payment Proposals' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'expenses', label: 'Expenses' },
];

export function WorkflowSetupPage() {
  const [activeModule, setActiveModule] = useState('indents');
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  // Form State
  const [role, setRole] = useState('');
  const [sequence, setSequence] = useState(1);
  const [slaHours, setSlaHours] = useState(24);
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(999999999);

  useEffect(() => {
    fetchRules();
  }, [activeModule]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkflowRules(activeModule);
      setRules(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load workflow rules');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setRole(rule.required_role_name);
      setSequence(rule.step_sequence);
      setSlaHours(rule.sla_hours);
      setMinAmount(Number(rule.min_amount));
      setMaxAmount(Number(rule.max_amount));
    } else {
      setEditingRule(null);
      setRole('');
      setSequence(rules.length + 1);
      setSlaHours(24);
      setMinAmount(0);
      setMaxAmount(999999999);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!role) {
      toast.error("Please select an approver role");
      return;
    }

    const payload = {
      module: activeModule,
      required_role_name: role,
      step_sequence: sequence,
      sla_hours: slaHours,
      min_amount: minAmount,
      max_amount: maxAmount,
    };

    try {
      if (editingRule) {
        await api.updateWorkflowRule(editingRule.id, payload);
        toast.success("Workflow rule updated!");
      } else {
        await api.createWorkflowRule(payload);
        toast.success("Workflow rule created!");
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save workflow rule");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this step?')) return;
    try {
      await api.deleteWorkflowRule(id);
      toast.success("Workflow rule deleted!");
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete workflow rule");
    }
  };

  return (
    <MainLayout>
      <div className="surface w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Approval Workflows</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure dynamic, multi-step approval routing rules based on document type and financial thresholds.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Module Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider px-2">Modules</h3>
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  activeModule === m.id 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {m.label}
                {activeModule === m.id && <ArrowRight className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {/* Rules List */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
                {MODULES.find(m => m.id === activeModule)?.label} Workflow
              </h2>
              <Button onClick={() => handleOpenModal()} className="h-9 px-4 text-sm font-medium shadow-sm transition-all hover:shadow bg-primary text-white">
                <Plus className="mr-2 h-4 w-4" /> Add Step
              </Button>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading rules...</div>
              ) : rules.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Workflow Steps</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                    Documents in this module will not require approval and will auto-approve immediately unless you add steps.
                  </p>
                  <Button onClick={() => handleOpenModal()} variant="outline">
                    Configure First Step
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rules.map((rule, idx) => (
                    <div key={rule.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200 dark:border-slate-700">
                        {rule.step_sequence}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Approver Role</p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {RoleLabels[rule.required_role_name as keyof typeof RoleLabels] || rule.required_role_name}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Amount Limit</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {Number(rule.min_amount) === 0 && Number(rule.max_amount) === 999999999
                              ? "Any Amount"
                              : `₹${Number(rule.min_amount).toLocaleString()} - ₹${Number(rule.max_amount).toLocaleString()}`}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Turnaround Time</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{rule.sla_hours} Hours SLA</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rule)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit' : 'Add'} Workflow Step</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Sequence Number</Label>
              <Input 
                type="number" 
                value={sequence} 
                onChange={e => setSequence(Number(e.target.value))}
                min={1}
              />
              <p className="text-xs text-muted-foreground">The order this approval happens in (1 = first).</p>
            </div>

            <div className="grid gap-2">
              <Label>Approver Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {Object.entries(RoleLabels)
                    .filter(([key]) => !['super_admin', 'system', 'employee'].includes(key))
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Min Amount (₹)</Label>
                <Input 
                  type="number" 
                  value={minAmount} 
                  onChange={e => setMinAmount(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Amount (₹)</Label>
                <Input 
                  type="number" 
                  value={maxAmount} 
                  onChange={e => setMaxAmount(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>SLA Turnaround (Hours)</Label>
              <Input 
                type="number" 
                value={slaHours} 
                onChange={e => setSlaHours(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Step</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
