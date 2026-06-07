'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { rfqApi } from '../../../lib/api-client';
import { formatIDR, formatDate, STATUS_BADGE, STATUS_LABELS } from '../../../lib/formatters';
import {
  LogOut, FileText, ChevronRight, Package, Clock,
  CheckCircle, AlertCircle, XCircle, Loader2, Plus,
} from 'lucide-react';

interface Rfq {
  id:           string;
  rfq_number:   string;
  status:       string;
  project_name: string | null;
  contact_person: string | null;
  grand_total:  number | null;
  subtotal:     number | null;
  item_count:   number;
  created_at:   string;
  submitted_at: string | null;
  notes:        string | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft:       <Clock      size={14} className="text-gray-400" />,
  submitted:   <AlertCircle size={14} className="text-amber-500" />,
  processing:  <Loader2   size={14} className="text-blue-500 animate-spin" />,
  quoted:      <CheckCircle size={14} className="text-green-500" />,
  closed:      <CheckCircle size={14} className="text-brand-500" />,
  cancelled:   <XCircle   size={14} className="text-red-400" />,
};

export default function HistoryPage() {
  const { user, isApproved, isPending, logout } = useAuth();
  const router = useRouter();
  const [rfqs, setRfqs]       = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await rfqApi.myRfqs(p);
      const data: Rfq[] = res.data.data.rfqs || [];
      setRfqs(p === 1 ? data : (prev) => [...prev, ...data]);
      setHasMore(data.length === 20);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/login?expired=true'); return; }
    if (!isApproved && !isPending) return;
    load(1);
  }, [user, isApproved, isPending, router, load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  if (!user) return null;

  const submitted  = rfqs.filter(r => r.status === 'submitted').length;
  const processing = rfqs.filter(r => r.status === 'processing').length;
  const quoted     = rfqs.filter(r => r.status === 'quoted').length;

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/search"       className="text-sm text-white/80 hover:text-white hidden sm:block">Cari Part</Link>
            <Link href="/rfq"          className="text-sm text-white/80 hover:text-white hidden sm:block">Buat RFQ</Link>
            <Link href="/my-dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Dashboard</Link>
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-brand-600" /> History RFQ
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Semua pengajuan Anda</p>
          </div>
          <Link href="/rfq" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Buat RFQ
          </Link>
        </div>

        {/* KPI mini */}
        {rfqs.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Menunggu Review', value: submitted,  color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200'  },
              { label: 'Diproses',        value: processing, color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200'   },
              { label: 'Harga Tersedia',  value: quoted,     color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200'  },
            ].map(s => (
              <div key={s.label} className={`card py-3 text-center ${s.bg} border-2 ${s.border}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading && rfqs.length === 0 ? (
          <div className="card text-center py-14 text-gray-400">
            <Loader2 size={28} className="animate-spin mx-auto mb-2" />
          </div>
        ) : rfqs.length === 0 ? (
          <div className="card text-center py-14">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Belum ada RFQ.</p>
            <p className="text-xs text-gray-400 mt-1">Buat RFQ pertama Anda sekarang.</p>
            <Link href="/rfq" className="btn-primary mt-5 inline-block text-sm">Buat RFQ Sekarang</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <Link
                key={rfq.id}
                href={`/rfq/${rfq.id}`}
                className="card hover:shadow-md transition-all flex items-center gap-4 group"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-brand-600" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-brand-600 text-sm">{rfq.rfq_number}</span>
                    <span className={STATUS_BADGE[rfq.status] || 'badge-gray text-xs'}>
                      {STATUS_LABELS[rfq.status] || rfq.status}
                    </span>
                    <span className="flex items-center gap-1">{STATUS_ICON[rfq.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {rfq.project_name || 'Tanpa nama proyek'} · {rfq.item_count} part
                  </p>
                </div>

                {/* Price + date */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 price-field">
                    {rfq.grand_total ? formatIDR(rfq.grand_total) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(rfq.submitted_at || rfq.created_at)}
                  </p>
                </div>

                <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </Link>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-3 text-sm text-brand-600 font-medium border-2 border-dashed border-brand-200 rounded-xl hover:bg-brand-50 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Memuat...' : 'Muat lebih banyak'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
