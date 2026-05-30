'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatIDR, formatDateTime } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import { Users, FileText, TrendingUp, Clock, AlertTriangle, Search, Activity, ArrowRight } from 'lucide-react';

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
  id:            string;
  action_type:   string;
  description:   string;
  created_at:    string;
  actor_name:    string | null;
  actor_company: string | null;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  rfq_submit:    <FileText size={16} />,
  user_register: <Users size={16} />,
  user_approve:  <Activity size={16} />,
  user_reject:   <AlertTriangle size={16} />,
  lead_update:   <TrendingUp size={16} />,
};

export default function AdminDashboard() {
  const [kpi, setKpi]         = useState<Kpi | null>(null);
  const [feed, setFeed]       = useState<ActivityItem[]>([]);
  const [pending, setPending] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lead Hari Ini',    value: kpi?.new_leads_today,                      icon: <TrendingUp size={20} />, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'RFQ Minggu Ini',   value: kpi?.rfqs_this_week,                       icon: <FileText size={20} />,   color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Pipeline Aktif',   value: formatIDR(kpi?.active_pipeline ?? 0),      icon: <TrendingUp size={20} />, color: 'text-brand-600',  bg: 'bg-brand-50', isString: true },
          { label: 'Pending Approval', value: kpi?.pending_approvals,                    icon: <Clock size={20} />,      color: 'text-yellow-600', bg: 'bg-yellow-50', urgent: (kpi?.pending_approvals ?? 0) > 0 },
        ].map((card) => (
          <div key={card.label} className={`card ${card.urgent ? 'border-yellow-300 bg-yellow-50' : ''}`}>
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-lg flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className={`text-2xl font-black ${card.color}`}>
              {card.isString ? card.value : (card.value ?? 0).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" /> Pending Approval
            </h3>
            <Link href="/admin/users" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {(pending as any[]).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{u.company_name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <Link href={`/admin/users/${u.id}`} className="text-xs bg-brand-600 text-white px-3 py-1 rounded-full hover:bg-brand-700">
                  Review
                </Link>
              </div>
            ))}
            {pending.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Tidak ada pendaftaran yang menunggu.</p>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity size={16} className="text-brand-600" /> Aktivitas Terkini
            </h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {feed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center">
                  {ACTION_ICONS[item.action_type] || <FileText size={14} />}
                </span>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Pencarian Hari Ini',   value: kpi?.searches_today,                      icon: <Search size={16} /> },
          { label: 'Customer Aktif 30hr',  value: kpi?.active_customers_30d,                icon: <Users size={16} /> },
          { label: 'Nilai RFQ Minggu Ini', value: formatIDR(kpi?.rfq_value_this_week ?? 0), icon: <FileText size={16} />, isString: true },
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