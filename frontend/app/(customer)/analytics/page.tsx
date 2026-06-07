'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { LogOut, Gauge, AlertTriangle, CheckCircle, XCircle, ChevronRight, BarChart2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Cell,
} from 'recharts';

interface UnitAnalytic {
  id: string;
  unit_name: string;
  model: string;
  current_hm: number;
  last_pm_hm: number;
  last_pm_date: string | null;
  hm_updated_at: string | null;
  site_location: string | null;
  year_of_manufacture: number | null;
  interval_hm: number;
  hm_since_pm: number;
  hm_to_next_pm: number;
  pct_used: number;
  status: 'ok' | 'due_soon' | 'overdue';
}

interface Summary {
  total: number;
  ok: number;
  due_soon: number;
  overdue: number;
}

const STATUS_CONFIG = {
  ok:       { label: 'Normal',    color: '#22c55e', icon: CheckCircle,    bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  due_soon: { label: 'Segera PM', color: '#f59e0b', icon: AlertTriangle,  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  overdue:  { label: 'Lewat PM',  color: '#ef4444', icon: XCircle,        bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
};

function formatHM(hm: number) {
  return hm.toLocaleString('id-ID') + ' HM';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AnalyticsPage() {
  const { user, isApproved, logout } = useAuth();
  const router = useRouter();
  const [units, setUnits]     = useState<UnitAnalytic[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'ok' | 'due_soon' | 'overdue'>('all');

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/units/analytics');
      setUnits(res.data.data.units);
      setSummary(res.data.data.summary);
    } catch {
      toast.error('Gagal memuat data analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/login?expired=true'); return; }
    if (!isApproved) return;
    fetchAnalytics();
  }, [user, isApproved, router, fetchAnalytics]);

  const filtered = filter === 'all' ? units : units.filter(u => u.status === filter);

  // Chart data — top 8 units by HM since last PM
  const chartData = [...units]
    .sort((a, b) => b.hm_since_pm - a.hm_since_pm)
    .slice(0, 8)
    .map(u => ({
      name: u.unit_name.length > 12 ? u.unit_name.slice(0, 12) + '…' : u.unit_name,
      'HM Sejak PM': u.hm_since_pm,
      'Interval PM': u.interval_hm,
      color: STATUS_CONFIG[u.status].color,
    }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/units"    className="text-sm text-white/80 hover:text-white hidden sm:block">Unit</Link>
            <Link href="/pm-bundles" className="text-sm text-white/80 hover:text-white hidden sm:block">PM Bundle</Link>
            <Link href="/my-dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Dashboard</Link>
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/units" className="hover:text-brand-600">Unit</Link>
            <ChevronRight size={12} />
            <span className="text-gray-600">Analitik PM</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={22} className="text-brand-600" /> Analitik PM Unit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Status Preventive Maintenance semua unit Anda</p>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'all',      label: 'Total Unit',   value: summary.total,    color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-200' },
              { key: 'ok',       label: 'Normal',       value: summary.ok,       color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { key: 'due_soon', label: 'Segera PM',    value: summary.due_soon, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
              { key: 'overdue',  label: 'Lewat PM',     value: summary.overdue,  color: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200'   },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key as typeof filter)}
                className={`rounded-2xl border-2 p-4 text-left transition-all ${s.bg} ${s.border} ${filter === s.key ? 'ring-2 ring-brand-400 ring-offset-1' : 'hover:shadow-sm'}`}
              >
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
              </button>
            ))}
          </div>
        )}

        {/* Bar Chart */}
        {chartData.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-gray-700 mb-4 text-sm">HM Sejak PM Terakhir (Top 8 Unit)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number, name: string) => [val.toLocaleString('id-ID') + ' HM', name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="HM Sejak PM" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              {(['ok', 'due_soon', 'overdue'] as const).map(s => (
                <span key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: STATUS_CONFIG[s].color }} />
                  {STATUS_CONFIG[s].label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unit list */}
        {filtered.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <Gauge size={32} className="mx-auto mb-2 opacity-30" />
            <p>Tidak ada unit dengan status ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {filter === 'all' ? 'Semua Unit' : STATUS_CONFIG[filter].label} — {filtered.length} unit
            </p>
            {filtered.map(u => {
              const cfg = STATUS_CONFIG[u.status];
              const Icon = cfg.icon;
              return (
                <div key={u.id} className={`card border-l-4 ${u.status === 'overdue' ? 'border-l-red-400' : u.status === 'due_soon' ? 'border-l-amber-400' : 'border-l-green-400'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                      <Icon size={18} className={cfg.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800">{u.unit_name}</span>
                        <span className="badge badge-blue text-xs">{u.model}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2.5 mb-1">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>{u.hm_since_pm.toLocaleString('id-ID')} HM sejak PM</span>
                          <span>interval {u.interval_hm.toLocaleString('id-ID')} HM</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${u.pct_used}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                        <div className="text-xs mt-1 font-medium" style={{ color: cfg.color }}>
                          {u.status === 'overdue'
                            ? `⚠️ Lewat ${Math.abs(u.hm_to_next_pm).toLocaleString('id-ID')} HM`
                            : `${u.hm_to_next_pm.toLocaleString('id-ID')} HM lagi ke PM berikutnya`}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-400 mt-1.5">
                        <span><strong className="text-gray-600">HM Saat Ini:</strong> {formatHM(u.current_hm)}</span>
                        <span><strong className="text-gray-600">PM Terakhir:</strong> {u.last_pm_hm ? formatHM(u.last_pm_hm) : '—'}</span>
                        {u.last_pm_date && <span><strong className="text-gray-600">Tanggal:</strong> {formatDate(u.last_pm_date)}</span>}
                        {u.site_location && <span>📍 {u.site_location}</span>}
                      </div>
                    </div>
                    <Link
                      href="/units"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-50 text-gray-300 hover:text-brand-600 transition-colors flex-shrink-0"
                      title="Kelola unit ini"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
