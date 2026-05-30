'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatIDR, formatDateTime } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
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
  id:            string;
  action_type:   string;
  description:   string;
  created_at:    string;
  actor_name:    string | null;
  actor_company: string | null;
}

export default function AdminUserDetail() {
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
          { label: 'Lead Hari Ini',    value: kpi?.new_leads_today,                 icon: <TrendingUp size={20} />, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'RFQ Minggu Ini',   value: kpi?.rfqs_this_week,                  icon: <FileText size={20} />,   color: 'text-blue-600',