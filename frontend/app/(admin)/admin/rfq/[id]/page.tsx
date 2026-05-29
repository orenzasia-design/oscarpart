'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi, api } from '../../../../../lib/api-client';
import { formatIDR, formatDateTime, STATUS_BADGE, STATUS_LABELS } from '../../../../../lib/formatters';
import { AdminShell } from '../../dashboard/page';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, MessageCircle, CheckCircle, AlertCircle, Package } from 'lucide-react';

interface RfqItem {
  id:                 string;
  part_number:        string;
  description:        string | null;
  brand:              string | null;
  unit_type:          string | null;
  qty_requested:      number;
  unit_price_at_time: number | null;
  line_total:         number | null;
  stock_available:    number | null;
  match_status:       string;
}

interface RfqDetail {
  id:               string;
  rfq_number:       string;
  status:           string;
  company_name:     string | null;
  contact_person:   string | null;
  position:         string | null;
  email:            string | null;
  whatsapp:         string | null;
  project_name:     string | null;
  delivery_location:string | null;
  notes:            string | null;
  subtotal:         number | null;
  tax_rate:         number;
  tax_amount:       number | null;
  grand_total:      number | null;
  created_at:       string;
  submitted_at:     string | null;
  pdf_generated_at: string | null;
  items:            RfqItem[];
}

export default function AdminRfqDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const [rfq, setRfq]         = useState<RfqDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api.get(`/rfq/${id}`)
      .then((res) => { if (res.data.success) setRfq(res.data.data); })
      .catch(() => toast.error('Gagal memuat data RFQ.'))
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    if (!rfq) return;
    setPdfLoading(true);
    try {
      const res  = await adminApi.downloadPdf(rfq.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${rfq.rfq_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF berhasil didownload.');
    } catch {
      toast.error('Gagal generate PDF. Pastikan Puppeteer terinstall di server.');
    } finally {
      setPdfLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!rfq) return;
    try {
      await api.patch(`/rfq/${rfq.id}/status`, { status: newStatus });
      setRfq((r) => r ? { ...r, status: newStatus } : r);
      toast.success('Status diperbarui.');
    } catch {
      toast.error('Gagal update status.');
    }
  };

  const openWhatsApp = () => {
    if (!rfq?.whatsapp) return;
    const wa = rfq.whatsapp.replace(/[^0-9]/g, '');
    const msg = `Halo ${rfq.contact_person}, kami dari OSCARPART ingin menindaklanjuti RFQ ${rfq.rfq_number} Anda. Apakah Anda masih membutuhkan part yang dipesan?`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <AdminShell title="Detail RFQ"><div className="text-gray-400 text-sm">Memuat...</div></AdminShell>;
  if (!rfq)   return <AdminShell title="Detail RFQ"><div className="text-gray-400 text-sm">RFQ tidak ditemukan.</div></AdminShell>;

  const matched   = rfq.items.filter((i) => i.match_status === 'matched');
  const unmatched = rfq.items.filter((i) => i.match_status !== 'matched');

  return (
    <AdminShell title={`RFQ: ${rfq.rfq_number}`}>
      <div className="mb-5">
        <Link href="/admin/rfq" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 w-fit">
          <ArrowLeft size={14} /> Kembali ke daftar RFQ
        </Link>
      </div>

      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className={STATUS_BADGE[rfq.status] || 'badge-gray'}>
          {STATUS_LABELS[rfq.status] || rfq.status}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={openWhatsApp}
            disabled={!rfq.whatsapp}
            className="flex items-center gap-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-colors"
          >
            <MessageCircle size={14} /> Follow-up WA
          </button>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 text-sm btn-primary"
          >
            <Download size={14} />
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer info */}
        <div className="lg:col-span-2 card">
          <h3 className="section-title">Informasi Customer</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Perusahaan',         value: rfq.company_name },
              { label: 'Kontak',             value: rfq.contact_person },
              { label: 'Jabatan',            value: rfq.position },
              { label: 'Email',              value: rfq.email },
              { label: 'WhatsApp',           value: rfq.whatsapp },
              { label: 'Project',            value: rfq.project_name },
              { label: 'Lokasi Pengiriman',  value: rfq.delivery_location },
              { label: 'Catatan',            value: rfq.notes },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-800">{value || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financials + meta */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="section-title">Ringkasan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nomor RFQ</span>
                <span className="font-mono font-bold text-brand-600">{rfq.rfq_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Part</span>
                <span className="font-bold">{rfq.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ditemukan</span>
                <span className="text-green-600 font-semibold">{matched.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Konfirmasi</span>
                <span className="text-yellow-600 font-semibold">{unmatched.length}</span>
              </div>
              <div className="border-t border-surface-border pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="price-field">{formatIDR(rfq.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PPN {rfq.tax_rate}%</span>
                  <span className="price-field">{formatIDR(rfq.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-brand-700 text-base">
                  <span>Grand Total</span>
                  <span className="price-field">{formatIDR(rfq.grand_total)}</span>
                </div>
              </div>
              <div className="border-t border-surface-border pt-2 text-xs text-gray-400 space-y-0.5">
                <p>Dibuat: {formatDateTime(rfq.created_at)}</p>
                <p>Dikirim: {formatDateTime(rfq.submitted_at)}</p>
                {rfq.pdf_generated_at && <p>PDF: {formatDateTime(rfq.pdf_generated_at)}</p>}
              </div>
            </div>
          </div>

          {/* Status update */}
          <div className="card">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">Update Status</h3>
            <div className="space-y-1.5">
              {['submitted','processing','quoted','closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                    rfq.status === s
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'bg-surface hover:bg-brand-50 text-gray-700'
                  }`}
                >
                  {STATUS_LABELS[s] || s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      {matched.length > 0 && (
        <div className="card overflow-hidden p-0 mb-4">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle size={15} className="text-green-600" />
            <span className="font-semibold text-green-700 text-sm">{matched.length} Part Ditemukan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface border-b border-surface-border">
                <tr>
                  <th className="table-header px-4 py-2.5 text-left">Part Number</th>
                  <th className="table-header px-4 py-2.5 text-left">Deskripsi</th>
                  <th className="table-header px-4 py-2.5 text-left">Brand</th>
                  <th className="table-header px-4 py-2.5 text-center">Stok</th>
                  <th className="table-header px-4 py-2.5 text-center">Qty</th>
                  <th className="table-header px-4 py-2.5 text-right">Harga</th>
                  <th className="table-header px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {matched.map((item) => (
                  <tr key={item.id} className="hover:bg-surface">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-xs text-brand-600">{item.part_number}</span>
                    </td>
                    <td className="px-4 py-3 max-w-48">
                      <span className="text-xs text-gray-600 truncate block">{item.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{item.brand || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold ${(item.stock_available ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {item.stock_available ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{item.qty_requested} {item.unit_type || ''}</td>
                    <td className="px-4 py-3 text-right price-field">{formatIDR(item.unit_price_at_time)}</td>
                    <td className="px-4 py-3 text-right font-bold price-field">{formatIDR(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unmatched.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
            <AlertCircle size={15} className="text-yellow-600" />
            <span className="font-semibold text-yellow-700 text-sm">{unmatched.length} Part Perlu Konfirmasi</span>
          </div>
          <div className="divide-y divide-surface-border">
            {unmatched.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className="font-mono font-bold text-xs text-gray-700 w-32 flex-shrink-0">{item.part_number}</span>
                <span className="text-xs text-gray-500 flex-1 truncate">{item.description || '-'}</span>
                <span className="text-xs text-gray-500">{item.brand || '-'}</span>
                <span className="font-semibold w-12 text-center">{item.qty_requested}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
