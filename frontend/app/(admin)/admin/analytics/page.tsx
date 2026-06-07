'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi, api } from '@/lib/api-client';
import { formatIDR } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, FileText, Search, Package, Activity, Gauge, AlertTriangle, XCircle, CheckCircle, BarChart2, Download, Loader2 } from 'lucide-react';

interface Kpi {
  new_leads_today: number; rfqs_this_week: number; rfq_value_this_week: number;
  active_pipeline: number; pending_approvals: number; searches_today: number;
  active_customers_30d: number;
}

interface AdminUnit {
  id: string; unit_name: string; model: string;
  current_hm: number; last_pm_hm: number; last_pm_date: string | null;
  hm_since_pm: number; hm_to_next_pm: number; pm_status: 'ok' | 'due_soon' | 'overdue';
  interval_hm: number; site_location: string | null;
  full_name: string; company_name: string | null; phone: string | null;
  hm_updated_at: string | null;
}

interface PmSummary { total: number; ok: number; due_soon: number; overdue: number; }

const PM_STATUS = {
  ok:       { label: 'Normal',    color: '#22c55e', icon: CheckCircle,   cls: 'text-green-600 bg-green-50' },
  due_soon: { label: 'Segera PM', color: '#f59e0b', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  overdue:  { label: 'Lewat PM',  color: '#ef4444', icon: XCircle,       cls: 'text-red-600 bg-red-50'     },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<'sales' | 'pm'>('sales');

  // Sales analytics state
  const [kpi, setKpi]           = useState<Kpi | null>(null);
  const [rfqTrend, setRfqTrend] = useState<{ period: string; count: number; total_value: number }[]>([]);
  const [topParts, setTopParts] = useState<{ query: string; count: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ company_name: string; rfq_count: number; total_value: number }[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // PM Monitor state
  const [pmUnits, setPmUnits]     = useState<AdminUnit[]>([]);
  const [pmSummary, setPmSummary] = useState<PmSummary | null>(null);
  const [isExportingAdmin, setIsExportingAdmin] = useState<'pdf'|'excel'|null>(null);
  const [pmFilter, setPmFilter]   = useState<'all' | 'ok' | 'due_soon' | 'overdue'>('all');
  const [pmSearch, setPmSearch]   = useState('');
  const [loadingPm, setLoadingPm] = useState(false);
  const [pmLoaded, setPmLoaded]   = useState(false);

  // Load sales data
  useEffect(() => {
    Promise.allSettled([
      adminApi.kpis(),
      adminApi.rfqTrends('daily'),
      adminApi.searchTrends(30),
      adminApi.topCustomers(),
    ]).then(([kpiR, rfqR, searchR, custR]) => {
      if (kpiR.status === 'fulfilled') setKpi(kpiR.value.data.data);
      if (rfqR.status === 'fulfilled') setRfqTrend(rfqR.value.data.data?.trends || []);
      if (searchR.status === 'fulfilled') setTopParts((searchR.value.data.data?.trends || []).slice(0, 8));
      if (custR.status === 'fulfilled') setTopCustomers(custR.value.data.data?.customers || []);
    }).finally(() => setLoadingSales(false));
  }, []);

  // Load PM data on tab switch
  const fetchPm = useCallback(async () => {
    setLoadingPm(true);
    try {
      const res = await api.get('/admin/units');
      setPmUnits(res.data.data.units || []);
      setPmSummary(res.data.data.summary);
      setPmLoaded(true);
    } catch {
      // silently fail
    } finally {
      setLoadingPm(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'pm' && !pmLoaded) fetchPm();
  }, [tab, pmLoaded, fetchPm]);

  const handleAdminExport = async (format: 'pdf' | 'excel') => {
    setIsExportingAdmin(format);
    try {
      const endpoint = format === 'pdf' ? '/admin/units/export/pdf' : '/admin/units/export/excel';
      const res = await adminApi.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'laporan-pm-semua-unit.pdf' : 'laporan-pm-semua-unit.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // toast not available here, silent fail with console
      console.error('Export failed');
    } finally {
      setIsExportingAdmin(null);
    }
  };

  const filteredPm = pmUnits.filter(u => {
    const matchStatus = pmFilter === 'all' || u.pm_status === pmFilter;
    const q = pmSearch.toLowerCase();
    const matchSearch = !q || u.unit_name.toLowerCase().includes(q) ||
      u.model.toLowerCase().includes(q) ||
      (u.company_name || '').toLowerCase().includes(q) ||
      u.full_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <AdminShell title="Analitik">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('sales')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${tab === 'sales' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <TrendingUp size={16} /> Sales & RFQ
        </button>
        <button
          onClick={() => setTab('pm')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${tab === 'pm' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          <Gauge size={16} /> Monitor PM Unit
          {pmSummary && pmSummary.overdue > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pmSummary.overdue}</span>
          )}
        </button>
      </div>

      {/* ── TAB SALES ── */}
      {tab === 'sales' && (
        <div className="space-y-6">
          {loadingSales ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Memuat data...</div>
          ) : (
            <>
              {/* KPI Cards */}
              {kpi && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Users size={18} className="text-brand-500" />, label: 'Pending Approval', value: kpi.pending_approvals },
                    { icon: <FileText size={18} className="text-green-500" />, label: 'RFQ Minggu Ini', value: kpi.rfqs_this_week },
                    { icon: <TrendingUp size={18} className="text-blue-500" />, label: 'Nilai RFQ Minggu Ini', value: formatIDR(kpi.rfq_value_this_week) },
                    { icon: <Search size={18} className="text-purple-500" />, label: 'Pencarian Hari Ini', value: kpi.searches_today },
                  ].map((k, i) => (
                    <div key={i} className="card flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">{k.icon}</div>
                      <div>
                        <div className="text-lg font-black text-gray-800">{k.value}</div>
                        <div className="text-xs text-gray-400">{k.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RFQ Trend Chart */}
              {rfqTrend.length > 0 && (
                <div className="card">
                  <h2 className="font-bold text-gray-700 text-sm mb-4">Tren RFQ (30 Hari)</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={rfqTrend.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Jumlah RFQ" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Parts */}
                {topParts.length > 0 && (
                  <div className="card">
                    <h2 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><Package size={16} /> Part Paling Dicari</h2>
                    <div className="space-y-2">
                      {topParts.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 text-xs font-bold text-gray-300 text-right">{i + 1}</span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-700 truncate">{p.query}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.min(100, (p.count / (topParts[0]?.count || 1)) * 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">{p.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Customers */}
                {topCustomers.length > 0 && (
                  <div className="card">
                    <h2 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><Users size={16} /> Top Customer</h2>
                    <div className="space-y-2">
                      {topCustomers.slice(0, 8).map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-5 text-xs font-bold text-gray-400 text-right flex-shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{c.company_name || '—'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.min(100, (c.rfq_count / (topCustomers[0]?.rfq_count || 1)) * 100)}%` }} />
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
            </>
          )}
        </div>
      )}

      {/* ── TAB MONITOR PM ── */}
      {tab === 'pm' && (
        <div className="space-y-5">
          {loadingPm ? (
            <div className="card text-center py-12 text-gray-400 text-sm">Memuat data unit...</div>
          ) : (
            <>
              {/* Summary KPI cards */}
              {pmSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'all',      label: 'Total Unit',  value: pmSummary.total,    color: 'text-brand-600', bg: 'bg-brand-50',  border: 'border-brand-200' },
                    { key: 'ok',       label: 'Normal',      value: pmSummary.ok,       color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
                    { key: 'due_soon', label: 'Segera PM',   value: pmSummary.due_soon, color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200' },
                    { key: 'overdue',  label: 'Lewat PM',    value: pmSummary.overdue,  color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200'   },
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => setPmFilter(s.key as typeof pmFilter)}
                      className={`rounded-2xl border-2 p-3 text-left transition-all ${s.bg} ${s.border} ${pmFilter === s.key ? 'ring-2 ring-brand-400 ring-offset-1' : 'hover:shadow-sm'}`}
                    >
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search + Export */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={pmSearch}
                  onChange={e => setPmSearch(e.target.value)}
                  placeholder="Cari unit, model, customer, perusahaan..."
                  className="input flex-1 min-w-[200px] max-w-md text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdminExport('pdf')}
                    disabled={isExportingAdmin !== null || pmUnits.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExportingAdmin === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleAdminExport('excel')}
                    disabled={isExportingAdmin !== null || pmUnits.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExportingAdmin === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Export Excel
                  </button>
                </div>
              </div>

              {/* Unit table */}
              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                      <th className="text-left px-4 py-3">Unit / Model</th>
                      <th className="text-left px-4 py-3">Customer</th>
                      <th className="text-right px-4 py-3">HM Saat Ini</th>
                      <th className="text-right px-4 py-3">PM Terakhir</th>
                      <th className="text-right px-4 py-3">Sisa ke PM</th>
                      <th className="text-center px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPm.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">
                          <Gauge size={28} className="mx-auto mb-2 opacity-20" />
                          <p>Tidak ada unit ditemukan.</p>
                        </td>
                      </tr>
                    ) : filteredPm.map(u => {
                      const cfg = PM_STATUS[u.pm_status];
                      const Icon = cfg.icon;
                      const pct = Math.min(100, Math.round((u.hm_since_pm / u.interval_hm) * 100));
                      return (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-800">{u.unit_name}</div>
                            <div className="text-xs text-gray-400">{u.model}{u.site_location ? ` · ${u.site_location}` : ''}</div>
                            {/* Progress bar */}
                            <div className="mt-1.5 w-32">
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: cfg.color }}>
                                {u.pm_status === 'overdue' ? `Lewat ${Math.abs(u.hm_to_next_pm).toLocaleString()} HM` : `${pct}% terpakai`}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700 font-medium">{u.full_name}</div>
                            <div className="text-xs text-gray-400">{u.company_name || '—'}</div>
                            {u.phone && <div className="text-xs text-gray-400">{u.phone}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            {(u.current_hm || 0).toLocaleString('id-ID')}
                            {u.hm_updated_at && <div className="text-xs text-gray-300">{formatDate(u.hm_updated_at)}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            {u.last_pm_hm ? u.last_pm_hm.toLocaleString('id-ID') : <span className="text-gray-300">—</span>}
                            {u.last_pm_date && <div className="text-xs text-gray-300">{formatDate(u.last_pm_date)}</div>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className={u.pm_status === 'overdue' ? 'text-red-600 font-bold' : 'text-gray-700'}>
                              {u.hm_to_next_pm > 0 ? `+${u.hm_to_next_pm.toLocaleString('id-ID')}` : u.hm_to_next_pm.toLocaleString('id-ID')} HM
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.cls}`}>
                              <Icon size={11} /> {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredPm.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                    Menampilkan {filteredPm.length} dari {pmUnits.length} unit
                    <button onClick={fetchPm} className="ml-3 text-brand-500 hover:underline">Refresh</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </AdminShell>
  );
}

