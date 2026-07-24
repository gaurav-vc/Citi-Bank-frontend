import React, { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';

interface OrganizationBilling {
  id: number;
  organization: string;
  company: string;
  current_plan: string;
  billing_amount: number;
  next_billing_date: string;
  current_due: number;
  status: string;
}

export default function SuperAdminBillingLogs() {
  const [logs, setLogs] = useState<OrganizationBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('campusspend_token');
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${base}/api/reports/super-admin-billing-logs/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch billing logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.organization.toLowerCase().includes(search.toLowerCase()) || 
      log.company.toLowerCase().includes(search.toLowerCase())
    );
  }, [logs, search]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-slate-500 flex items-center justify-center min-h-screen">Loading billing data...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 min-h-screen bg-[#F8FAFC]">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Billing & Payments</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search organization billing..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Organization</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Current Plan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Billing Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Next Billing Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700">Current Due</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.organization}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.company}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.current_plan}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">${log.billing_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">{log.next_billing_date}</td>
                    <td className="px-6 py-4 text-[13px] text-slate-600">${log.current_due.toFixed(2)}</td>
                    <td className="px-6 py-4 text-[13px] text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-600">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-center">
                      <button 
                        onClick={() => navigate(`/super-admin/billing/${log.id}/log`)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
