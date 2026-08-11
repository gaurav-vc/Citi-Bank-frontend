import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface InvoiceHistory {
  invoice_number: string;
  billing_date: string;
  due_date: string;
  amount: number;
  status: string;
}

interface BillingDashboardData {
  organization_name: string;
  next_billing_amount: number;
  next_billing_date: string | null;
  current_balance_due: number;
  billing_contact: {
    email: string;
    phone: string;
  };
  tax_id: string;
  billing_address: string;
  invoice_history: InvoiceHistory[];
}

export default function SuperAdminBillingLogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Overdue'>('All');

  useEffect(() => {
    if (id) {
      fetchDashboardData();
    }
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
      const res = await fetch(`${base}/api/reports/super-admin-billing-logs/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch billing dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-slate-500 flex items-center justify-center min-h-screen">Loading billing data...</div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="p-6 text-red-500 flex items-center justify-center min-h-screen">Failed to load billing dashboard.</div>
      </MainLayout>
    );
  }

  const filteredInvoices = data.invoice_history.filter((inv) => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDownloadCSV = () => {
    if (!data) return;
    const headers = ['Invoice Number', 'Billing Date', 'Due Date', 'Amount', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.billing_date,
      inv.due_date,
      inv.amount,
      inv.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.organization_name}_billing_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="p-8 min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Header section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/super-admin/billing')}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              title="Back to Organizations"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="text-sm text-slate-500 mb-1">
                Organization &gt; Billing &amp; Subscriptions
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{data.organization_name}</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDownloadCSV} className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              Download CSV
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
              Pay Now
            </button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded w-max mb-3 tracking-wider">
              NB
            </div>
            <div className="text-[13px] font-medium text-slate-500 mb-2 flex items-center gap-2">
              Next Billing Amount
            </div>
            <div className="text-3xl font-bold mb-3 tracking-tight">
              ${data.next_billing_amount.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Estimated for next cycle · Renews on {data.next_billing_date ? format(new Date(data.next_billing_date), 'dd MMM yyyy') : '-'}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="text-[10px] font-bold text-purple-600 bg-purple-50 inline-block px-1.5 py-0.5 rounded w-max mb-3 tracking-wider">
              CD
            </div>
            <div className="text-[13px] font-medium text-slate-500 mb-2 flex items-center gap-2">
              Current Balance Due
            </div>
            <div className="text-3xl font-bold mb-3 tracking-tight">
              ${data.current_balance_due.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {data.current_balance_due > 0 ? 'Payment required' : 'Everything looks good!'}
            </div>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-bold">Invoice History</h2>
              <p className="text-[13px] text-slate-500 mt-1">Review and download your recent billing statements</p>
            </div>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                placeholder="Search invoice #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm placeholder:text-slate-400"
              />
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(['All', 'Paid', 'Overdue'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === opt
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Invoice #</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Billing Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Due Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.invoice_number} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-medium text-slate-700">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">{format(new Date(inv.billing_date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">{format(new Date(inv.due_date), 'dd MMM yyyy')}</td>
                      <td className="px-6 py-4 text-[13px] text-slate-600">${inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-[11px] font-semibold ${
                            inv.status.toLowerCase() === 'paid'
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-slate-100 text-slate-500' // Using gray for overdue/other matching screenshot
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[18px] font-bold mb-1">Billing Information</h3>
              <p className="text-[13px] text-slate-500 mb-6">Tax details and invoice contact information</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Billing Contact</div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">{data.billing_contact.email}</div>
                <div className="text-[13px] text-slate-500">{data.billing_contact.phone}</div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">Tax ID / VAT</div>
                <div className="text-[13px] text-slate-900">{data.tax_id}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Billing Address</div>
                <div className="text-[13px] text-slate-900 mb-4 max-w-[200px] leading-relaxed">
                  {data.billing_address || 'No address provided'}
                </div>
                <Link to={`/masters/organizations/${id}/edit`} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  Edit Billing Details
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-[18px] font-bold mb-4">Billing Help</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                How do I change my billing cycle?
              </button>
              <button className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                When are invoices generated?
              </button>
              <button className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg text-[13px] text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                Accepted payment methods?
              </button>
            </div>
            <Link to="/super-admin/billing-help" className="w-full mt-4 px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-center block">
              Visit Help Center
            </Link>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
