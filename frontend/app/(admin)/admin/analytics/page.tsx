'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api-client';
import { formatIDR } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, FileText, Search, Package, Activity } from 'lucide-react';

interface Kpi {
  new_leads_today: number; rfqs_this_week: number; rfq_value_this_week: number;
  active_pipeline: number; pending_approvals: number; searches_today: number;
  active_customers_30d: number;
}

export default function AnalyticsPage() {
  const [kpi, setKpi]           = useState<Kpi | null>(null);
  const [rfqTrend, setRfqTrend] = useState<{ period: string; count: number; total_value: number }[]>([]);
  const [topParts, setTopParts] = useState<{ query: string; count: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ company_name: string; rfq_count: number; total_value: number }[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      adminApi.kpis(),
      adminApi.rfqTrends('daily'),
      adminApi.searchTrends(30),
      adminApi.topCustomers(),
    ]).then(([kpiR, rfqR, searchR, custR]) => {
      if (kpiR.status === 'fulfilled') setKpi(kpiR.value.data.data);
      if (rfqR.status === 'fulfilled') setRfqTrend(rfqR.value.data.data?.trends || []);
      if (searchR.status === 'fulfilled') setTopParts((searchR.value.data.data?.trends || []).slice(0, 10));
      if (custR.status === 'fulfilled') setTopCustomers(custR.value.data.data?.customers || []);
    }).finally(() => setLoading(false));
  }, []);

  const kpiCards = kpi ? [
    { label: 'Lead Hari Ini',       value: kpi.new_leads_today,                      icon: <TrendingUp size={20} />, color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'RFQ Minggu Ini',      value: kpi.rfqs_this_week,                       icon: <FileText size={20} />,   color: 'text-blue-600',   bg: 'bg-blue-50'  },
    { label: 'Pencarian Hari Ini',  value: kpi.searches_today,                       icon: <Search size={20} />,     color: 'text-purple-600', bg: 'bg-purple-50'},
    { label: 'Customer Aktif 30hr', value: kpi.active_customers_30d,                 icon: <Users size={20} />,      color: 'text-brand-600',  bg: 'bg-brand-50' },
    { label: 'Nilai RFQ Minggu Ini',value: formatIDR(kpi.rfq_value_this_week ?? 0),  icon: <Activity size={20} />,   color: 'text-amber-600',  bg: 'bg-amber-50', isStr: true },
    { label: 'Pipeline Aktif',      value: formatIDR(kpi.active_pipeline ?? 0),      icon: <Package size={20} />,    color: 'text-red-600',    bg: 'bg-red-50',   isStr: true },
  ] : [];

  if (loading) return <AdminShell title="Analitik"><div className="animate-pulse text-gray-400 text-sm">Memuat data...</div></AdminShell>;

  return (
    <AdminShell title="Analitik">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((c) => (
          <div key={c.label} className="card">
            <div className={`w-10 h-10 ${c.bg} ${c.color} rounded-lg flex items-center justify-center mb-3`}>{c.icon}</div>
            <p className={`text-2xl font-black ${c.color}`}>
              {c.isStr ? c.value : (typeof c.value === 'number' ? c.value.toLocaleString('id-ID') : c.value)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* RFQ Trend Chart */}
      {rfqTrend.length > 0 && (
        <div className="card mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-brand-600" /> Tren RFQ (30 Hari Terakhir)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={rfqTrend.slice(-30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v, 'RFQ']} />
              <Line type="monotone" dataKey="count" stroke="#1a3a5c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Terms */}
        {topParts.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search size={16} className="text-purple-600" /> Part Paling Sering Dicari
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topParts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="query" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#7aafd9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Customers */}
        {topCustomers.length > 0 && (
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={16} className="text-brand-600" /> Customer Paling Aktif
            </h3>
            <div className="space-y-2">
              {topCustomers.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{c.company_name || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-400 rounded-full"
                          style={{ width: `${Math.min(100, (c.rfq_count / (topCustomers[0]?.rfq_count || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{c.rfq_count} RFQ</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-brand-600 flex-shrink-0">{formatIDR(c.total_value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rfqTrend.length === 0 && topParts.length === 0 && topCustomers.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <Activity size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Data analitik akan muncul setelah ada aktivitas.</p>
        </div>
      )}
    </AdminShell>
  );
}
