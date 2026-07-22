import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { IndianRupee, Building2, Users, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardAPI } from '@/api/dashboard';

interface DashboardData {
  totalRevenue: number;
  activeSites: number;
  totalUsers: number;
  totalCompany: number;
  todaysUpsale: {
    id: number;
    name: string;
    sites: number;
    amount: number;
  }[];
  companyWiseSite: { name: string; sites: number }[];
  moduleWiseRevenue: { name: string; revenue: number }[];
  moduleWiseSite: { name: string; sites: number }[];
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await dashboardAPI.getSuperAdminDashboard();
      if (result) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground flex items-center justify-center min-h-screen">Loading dashboard data...</div>;
  }

  if (!data) {
    return <div className="p-6 text-destructive flex items-center justify-center min-h-screen">Failed to load dashboard data.</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Optimize Revenue and Track Sales Performance.</p>
        </div>
        <div className="bg-white rounded-full px-4 py-1.5 shadow-sm border text-sm font-medium">
          Today
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-1">Rs. {data.totalRevenue.toLocaleString('en-IN')}/-</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Active Sites</p>
              <h3 className="text-3xl font-bold mt-1">{data.activeSites}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Users</p>
              <h3 className="text-3xl font-bold mt-1">{data.totalUsers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Company</p>
              <h3 className="text-3xl font-bold mt-1">{data.totalCompany}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 shadow-sm border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Today's Upsale</CardTitle>
            <span className="text-sm text-blue-600 font-medium cursor-pointer">See all</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              {data.todaysUpsale.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Sites: {item.sites}</p>
                  </div>
                  <p className="font-semibold text-sm">Rs. {item.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
              {data.todaysUpsale.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent upsale data available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-sm border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Company Wise Site</CardTitle>
            <div className="bg-slate-50 border rounded-md px-3 py-1 text-xs text-muted-foreground cursor-pointer">
              Week
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.companyWiseSite}>
                  <defs>
                    <linearGradient id="colorSites" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4a34b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4a34b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sites" stroke="#d4a34b" strokeWidth={3} fillOpacity={1} fill="url(#colorSites)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Module Wise Revenue</CardTitle>
            <span className="text-sm text-blue-600 font-medium cursor-pointer">See all</span>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.moduleWiseRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Module Wise Site</CardTitle>
            <div className="bg-slate-50 border rounded-md px-3 py-1 text-xs text-muted-foreground cursor-pointer">
              Week
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.moduleWiseSite}>
                  <defs>
                    <linearGradient id="colorModSites" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sites" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorModSites)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </MainLayout>
  );
}
