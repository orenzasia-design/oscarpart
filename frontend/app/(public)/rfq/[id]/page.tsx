'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth-context';
import { rfqApi } from '../../../../lib/api-client';
import { formatIDR, formatDateTime, STATUS_BADGE, STATUS_LABELS } from '../../../../lib/formatters';
import { LogOut, FileText, ChevronLeft, Package, CheckCircle, AlertCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import toast from 'react-hot-toast';

interface RfqSession {
  id: string;
  rfq_number: string;
  status: string;
  project_name: string | null;
  contact_person: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  grand_total: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  created_at: string;
  submitted_at: string | null;
  validity_until: string | null;
}

interface RfqItem {
  id: string;
  part_number: string;
  description: string | null;
  brand_name: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
  availability: string | null;
  notes: string | null;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  draft: <Clock size={16} className="text-gray-400" />,
  submitted: <AlertCircle size={16} className="text-amber-500" />,
  processing: <Loader2 size={16} className="text-blue-500 animate-spin" />,
  quoted: <CheckCircle size={16} className="text-green-500" />,
  closed: <CheckCircle size={16} className="text-brand-500" />,
  cancelled: <XCircle size={16} className="text-red-400" />,
};

export default function RfqDetailPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [session, setSession] = useState<RfqSession | null>(null);
  const [items, setItems] = useState<RfqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/login?expired=true');
      return;
    }
    if (!id) return;
    rfqApi.get(id)
      .then((res) => {
        setSession(res.data.data.session);
        setItems(res.data.data.items || []);
      })
      .catch(() => toast.error('RFQ tidak ditemukan.'))
      .finally(() => setLoading(false));
  }, [user, id, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
  );

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <Package size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">RFQ tidak ditemukan.</p>
        <Link href="/history" className="btn-primary mt-4 inline-block text-sm">Kembali ke History</Link>
      </div>
    </div>
  );

  const hasPrice = items.some(i => i.unit_price !== null);

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/history" className="text-sm text-white/80 hover:text-white hidden sm:block">History RFQ</Link>
            <Link href="/my-dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Dashboard</Link>
            <ThemeToggle className="opacity-70 hover:opacity-100" />
            <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Breadcrumb + header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/history" className="hover:text-brand-600 flex items-center gap-1">
              <ChevronLeft size={12} /> History RFQ
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText size={20} className="text-brand-600" />
                {session.rfq_number}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">{session.project_name || 'Tanpa nama proyek'}</p>
            </div>
            <div className="flex items-center gap-2">
              {STATUS_ICON[session.status]}
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_BADGE[session.status] || 'badge-gray'}`}>
                {STATUS_LABELS[session.status] || session.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Tanggal Submit', value: session.submitted_at ? formatDateTime(session.submitted_at) : '—' },
            { label: 'Berlaku Sampai', value: session.validity_until ? formatDateTime(session.validity_until) : '—' },
            { label: 'Jumlah Item', value: `${items.length} item` },
            { label: 'Total', value: session.grand_total ? formatIDR(session.grand_total) : hasPrice ? formatIDR(session.subtotal ?? 0) : 'Menunggu harga' },
          ].map(s => (
            <div key={s.label} className="card py-3">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="font-bold text-gray-800 text-sm mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Status info banner */}
        {session.status === 'quoted' && (
          <div className="card bg-green-50 border-green-200 border-2 flex items-start gap-3">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Harga sudah tersedia</p>
              <p className="text-xs text-green-700 mt-0.5">Tim kami sudah menyiapkan penawaran harga. Lihat kolom harga di tabel di bawah atau hubungi kami untuk konfirmasi order.</p>
            </div>
          </div>
        )}
        {session.status === 'submitted' && (
          <div className="card bg-amber-50 border-amber-200 border-2 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">RFQ sedang direview</p>
              <p className="text-xs text-amber-700 mt-0.5">Tim kami sedang memproses permintaan Anda. Kami akan menghubungi Anda segera.</p>
            </div>
          </div>
        )}
        {session.status === 'processing' && (
          <div className="card bg-blue-50 border-blue-200 border-2 flex items-start gap-3">
            <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800 text-sm">Sedang diproses</p>
              <p className="text-xs text-blue-700 mt-0.5">RFQ Anda sedang dalam proses pengerjaan oleh tim kami.</p>
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-surface-border">
            <h2 className="font-bold text-gray-700 text-sm">Daftar Part ({items.length} item)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-surface-border">
                <tr>
                  <th className="table-header px-4 py-2.5 text-left text-xs">No</th>
                  <th className="table-header px-4 py-2.5 text-left text-xs">Part Number</th>
                  <th className="table-header px-4 py-2.5 text-left text-xs">Deskripsi</th>
                  <th className="table-header px-4 py-2.5 text-left text-xs">Brand</th>
                  <th className="table-header px-4 py-2.5 text-center text-xs">Qty</th>
                  {hasPrice && <th className="table-header px-4 py-2.5 text-right text-xs">Harga Satuan</th>}
                  {hasPrice && <th className="table-header px-4 py-2.5 text-right text-xs">Subtotal</th>}
                  {hasPrice && <th className="table-header px-4 py-2.5 text-center text-xs">Ketersediaan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-surface">
                    <td className="table-cell text-xs text-gray-400">{i + 1}</td>
                    <td className="table-cell">
                      <span className="font-mono font-bold text-brand-600 text-xs">{item.part_number}</span>
                    </td>
                    <td className="table-cell">
                      <p className="text-xs text-gray-700 max-w-48">{item.description || '—'}</p>
                    </td>
                    <td className="table-cell">
                      <span className="text-xs text-gray-500">{item.brand_name || '—'}</span>
                    </td>
                    <td className="table-cell text-center">
                      <span className="text-sm font-semibold">{item.quantity} <span className="text-xs text-gray-400">{item.unit || 'pcs'}</span></span>
                    </td>
                    {hasPrice && (
                      <td className="table-cell text-right">
                        <span className="text-sm font-medium price-field">{item.unit_price ? formatIDR(item.unit_price) : '—'}</span>
                      </td>
                    )}
                    {hasPrice && (
                      <td className="table-cell text-right">
                        <span className="text-sm font-semibold price-field">{item.total_price ? formatIDR(item.total_price) : '—'}</span>
                      </td>
                    )}
                    {hasPrice && (
                      <td className="table-cell text-center">
                        <span className={`badge text-xs ${item.availability === 'ready' ? 'badge-green' : item.availability === 'indent' ? 'badge-yellow' : 'badge-gray'}`}>
                          {item.availability || '—'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {hasPrice && session.grand_total && (
                <tfoot className="bg-surface border-t-2 border-surface-border">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right text-xs text-gray-500 font-medium">
                      {session.tax_rate ? `Subtotal + PPN ${session.tax_rate}%` : 'Total'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-base font-black text-brand-700 price-field">{formatIDR(session.grand_total)}</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="card bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 mb-1">Catatan</p>
            <p className="text-sm text-gray-700">{session.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/history" className="btn-secondary text-sm">← Kembali ke History</Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WA_NUMBER || '6281234567890'}?text=Halo%2C%20saya%20ingin%20konfirmasi%20RFQ%20${session.rfq_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center gap-2"
          >
            💬 Konfirmasi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
