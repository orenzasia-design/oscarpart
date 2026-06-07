'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { rfqApi, partsApi } from '@/lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { formatIDR, formatDate, STATUS_BADGE, STATUS_LABELS } from '../../../lib/formatters';
import { Search, FileText, History, LogOut, ChevronRight, AlertCircle, Package, Gauge, BarChart2, ClipboardList, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface RecentRfq {
  id:           string;
  rfq_number:   string;
  status:       string;
  project_name: string | null;
  grand_total:  number | null;
  item_count:   number;
  created_at:   string;
  submitted_at: string | null;
}

export default function CustomerDashboard() {
  const { user, isApproved, isPending, logout } = useAuth();
  const router = useRouter();
  const [recentRfqs, setRecentRfqs] = useState<RecentRfq[]>([]);
  const [searchQ, setSearchQ]       = useState('');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.replace('/login?expired=true'); return; }
    if (!user || (!isApproved && !isPending)) return;

    rfqApi.myRfqs(1)
      .then((res) => setRecentRfqs((res.data.data.rfqs || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isApproved, isPending, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim().length >= 2) router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Memuat...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/search"  className="text-sm text-white/80 hover:text-white hidden sm:block">Cari Part</Link>
            <Link href="/rfq"     className="text-sm text-white/80 hover:text-white hidden sm:block">Buat RFQ</Link>
            <Link href="/history" className="text-sm text-white/80 hover:text-white hidden sm:block">History</Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Pending approval banner */}
        {isPending && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">Akun dalam proses review</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Tim OSCARPART sedang memverifikasi akun Anda. Anda akan menerima email konfirmasi.
                Anda sudah bisa membuat RFQ, namun harga baru tersedia setelah akun disetujui.
              </p>
            </div>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">
            Halo, {user.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.company_name}</p>
        </div>

        {/* Quick search */}
        <div className="card mb-6 bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
          <h2 className="font-bold mb-3">Cari Part Number</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
              <Search size={16} className="opacity-70 flex-shrink-0" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Ketik part number..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-white/50"
              />
            </div>
            <button
              type="submit"
              disabled={searchQ.trim().length < 2}
              className="bg-white text-brand-600 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-50 text-sm"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: <Search size={22} className="text-brand-600" />,
              title: 'Cari Part',
              desc: 'Cek stok dan harga',
              href: '/search',
              bg: 'bg-brand-50',
            },
            {
              icon: <FileText size={22} className="text-green-600" />,
              title: 'Buat RFQ',
              desc: 'Upload Excel atau manual',
              href: '/rfq',
              bg: 'bg-green-50',
            },
            {
              icon: <History size={22} className="text-purple-600" />,
              title: 'History RFQ',
              desc: 'Lihat semua pengajuan',
              href: '/history',
              bg: 'bg-purple-50',
            },
            {
              icon: <Gauge size={22} className="text-orange-600" />,
              title: 'Unit Saya',
              desc: 'Pantau HM & jadwal PM',
              href: '/units',
              bg: 'bg-orange-50',
            },
            {
              icon: <BarChart2 size={22} className="text-indigo-600" />,
              title: 'Analitik PM',
              desc: 'Chart & status PM unit',
              href: '/analytics',
              bg: 'bg-indigo-50',
            },
            {
              icon: <TrendingUp size={22} className="text-blue-600" />,
              title: 'Laporan Bulanan',
              desc: 'Status PM semua unit',
              href: '/monthly-report',
              bg: 'bg-blue-50',
            },
            {
              icon: <ClipboardList size={22} className="text-teal-600" />,
              title: 'OMM Pocket Guide',
              desc: 'Checklist PM di lapangan',
              href: '/omm-guide',
              bg: 'bg-teal-50',
            },
          ].map((a) => (
            <Link key={a.title} href={a.href} className="card hover:shadow-lg transition-all group flex items-center gap-4">
              <div className={`w-12 h-12 ${a.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {a.icon}
              </div>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-brand-600 transition-colors">{a.title}</p>
                <p className="text-xs text-gray-400">{a.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-400 ml-auto transition-colors" />
            </Link>
          ))}
        </div>

        {/* Recent RFQs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">RFQ Terbaru</h3>
            <Link href="/history" className="text-xs text-brand-600 font-medium hover:underline">
              Lihat semua →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Memuat...</div>
          ) : recentRfqs.length === 0 ? (
            <div className="py-10 text-center">
              <Package size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada RFQ. Buat yang pertama sekarang!</p>
              <Link href="/rfq" className="btn-primary mt-4 inline-block text-sm">Buat RFQ</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRfqs.map((rfq) => (
                <div key={rfq.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-brand-600 text-xs">{rfq.rfq_number}</span>
                      <span className={STATUS_BADGE[rfq.status] || 'badge-gray'}>
                        {STATUS_LABELS[rfq.status] || rfq.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{rfq.project_name || '—'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800 price-field">{formatIDR(rfq.grand_total)}</p>
                    <p className="text-xs text-gray-400">{rfq.item_count} part • {formatDate(rfq.submitted_at || rfq.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

