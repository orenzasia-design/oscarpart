'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatIDR, formatDateTime, STATUS_BADGE, STATUS_LABELS } from '@/lib/formatters';
import { Users, FileText, TrendingUp, Clock, AlertTriangle, Search, Activity } from 'lucide-react';

interface Kpi {
  new_leads_today:      number;
  rfqs_this_week:       number;
  rfq_value_this_week:  number;
  active_pipeline:      number;
  pending_approvals:    number;
  searches_today:       number;
  active_customers_30d: number;
}

interface ActivityItem {
  id:              string;
  action_type:     string;
  description:     string;
  created_at:      string;
  actor_name:      string | null;
  actor_company:   string | null;
}

const ACTION_ICONS: Record<string, string> = {
  rfq_submit:   'Ã°Å¸â€œâ€¹',
  user_register:'Ã°Å¸â€˜Â¤',
  user_approve: 'Ã¢Å“â€¦',
  user_reject:  'Ã¢ÂÅ’',
  lead_update:  'Ã°Å¸Å½Â¯',
};

export default function AdminDashboard() {
  const [kpi, setKpi]           = useState<Kpi | null>(null);
  const [feed, setFeed]         = useState<ActivityItem[]>([]);
  const [pending, setPending]   = useState<unknown[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.kpis(),
      adminApi.activityFeed(20),
      adminApi.users({ status: 'pending', limit: 5 }),
    ]).then(([kpiRes, feedRes, usersRes]) => {
      setKpi(kpiRes.data.data);
      setFeed(feedRes.data.data);
      setPending(usersRes.data.data.users);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminShell title="Dashboard"><div className="animate-pulse text-gray-400 text-sm">Memuat data...</div></AdminShell>;

  return (
    <AdminShell title="Dashboard">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lead Hari Ini',    value: kpi?.new_leads_today,       icon: <TrendingUp size={20} />, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'RFQ Minggu Ini',   value: kpi?.rfqs_this_week,        icon: <FileText size={20} />,   color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Pipeline Aktif',   value: formatIDR(kpi?.active_pipeline ?? 0), icon: <TrendingUp size={20} />, color: 'text-brand-600', bg: 'bg-brand-50', isString: true },
          { label: 'Pending Approval', value: kpi?.pending_approvals,     icon: <Clock size={20} />,      color: 'text-yellow-600', bg: 'bg-yellow-50',
            urgent: (kpi?.pending_approvals ?? 0) > 0 },
        ].map((card) => (
          <div key={card.label} className={`card ${card.urgent ? 'border-yellow-300 bg-yellow-50' : ''}`}>
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-lg flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className={`text-2xl font-black ${card.color}`}>
              {card.isString ? card.value : (card.value ?? 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" /> Pending Approval
            </h3>
            <Link href="/admin/users?status=pending" className="text-xs text-brand-600 font-medium hover:underline">
              Lihat semua Ã¢â€ â€™
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Tidak ada pendaftaran yang menunggu.</p>
          ) : (
            <div className="space-y-3">
              {(pending as Array<{ id: string; full_name: string; company_name: string; email: string; created_at: string; industry: string }>).map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{u.company_name}</p>
                    <p className="text-xs text-gray-500 truncate">{u.full_name} Ã¢â‚¬Â¢ {u.industry}</p>
                  </div>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="btn-primary text-xs py-1.5 px-3 ml-3 flex-shrink-0"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-brand-600" /> Aktivitas Terkini
            </h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{ACTION_ICONS[item.action_type] || 'Ã°Å¸â€œÅ’'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700 leading-snug truncate">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(item.created_at)}</p>
                </div>
              </div>
            ))}
            {feed.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Belum ada aktivitas.</p>}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Pencarian Hari Ini', value: kpi?.searches_today,       icon: <Search size={16} /> },
          { label: 'Customer Aktif 30hr',value: kpi?.active_customers_30d, icon: <Users size={16} /> },
          { label: 'Nilai RFQ Minggu Ini',value: formatIDR(kpi?.rfq_value_this_week ?? 0), icon: <FileText size={16} />, isString: true },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <p className="font-bold text-gray-800">{s.isString ? s.value : (s.value ?? 0).toLocaleString('id-ID')}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Shared Admin Shell Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬


function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      onClick={logout}
      className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors"
    >
      🚪 Logout
    </button>
  );
}


  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-900 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="font-black text-base tracking-widest">OSCARPART</div>
          <div className="text-xs opacity-50 mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <Link href="/" className="text-xs text-white/50 hover:text-white/80">Ã¢â€ Â Kembali ke site</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-black text-gray-800 mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
