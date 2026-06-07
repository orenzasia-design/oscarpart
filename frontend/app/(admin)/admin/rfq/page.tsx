'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatIDR, formatDateTime, STATUS_BADGE, STATUS_LABELS } from '../../../../lib/formatters';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Search, Download, ChevronLeft, ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { adminApi, api } from '@/lib/api-client';

interface Rfq {
  id:            string;
  rfq_number:    string;
  status:        string;
  company_name:  string | null;
  contact_person:string | null;
  full_name:     string | null;
  email:         string | null;
  whatsapp:      string | null;
  project_name:  string | null;
  grand_total:   number | null;
  item_count:    number | null;
  notes:         string | null;
  created_at:    string;
  submitted_at:  string | null;
}

export default function AdminRfqPage() {
  const [rfqs, setRfqs]         = useState<Rfq[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const limit = 20;

  const loadRfqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.rfqs({ page, limit, search: search || undefined, status: statusFilter || undefined });
const rawData = res.data.data;
const rfqList = Array.isArray(rawData) ? rawData : (rawData.rfqs || []);
const totalCount = Array.isArray(rawData) ? rawData.length : (rawData.pagination?.total || 0);
setRfqs(rfqList);
setTotal(totalCount);
    } catch {
      toast.error('Gagal memuat data RFQ.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadRfqs(); }, [loadRfqs]);

  const downloadPdf = async (rfq: Rfq) => {
    setPdfLoading(rfq.id);
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
      setPdfLoading(null);
    }
  };

  const updateStatus = async (rfqId: string, newStatus: string) => {
    setStatusLoading(rfqId);
    try {
      await adminApi.updateRfqStatus(rfqId, newStatus);
      toast.success('Status RFQ diperbarui.');
      load();
    } catch {
      toast.error('Gagal update status.');
    } finally {
      setStatusLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell title="Manajemen RFQ">
      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-0 max-w-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Nomor RFQ, perusahaan, kontak..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto text-sm py-2"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Terkirim</option>
            <option value="processing">Diproses</option>
            <option value="quoted">Dikutip</option>
            <option value="closed">Selesai</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{total} RFQ</span>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="table-header px-4 py-3 text-left">Nomor RFQ</th>
                <th className="table-header px-4 py-3 text-left">Perusahaan</th>
                <th className="table-header px-4 py-3 text-left">Project</th>
                <th className="table-header px-4 py-3 text-center">Item</th>
                <th className="table-header px-4 py-3 text-right">Total</th>
                <th className="table-header px-4 py-3 text-left">Status</th>
                <th className="table-header px-4 py-3 text-left">Tanggal</th>
                <th className="table-header px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Memuat...</td></tr>
              ) : rfqs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Tidak ada data.</td></tr>
              ) : rfqs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-surface transition-colors">
                  <td className="table-cell">
                    <span className="font-mono font-bold text-brand-600 text-xs">{rfq.rfq_number}</span>
                  </td>
                  <td className="table-cell">
                    <p className="font-medium text-gray-800">{rfq.company_name || '-'}</p>
                    <p className="text-xs text-gray-400">{rfq.contact_person || rfq.full_name || '-'}</p>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs text-gray-600 max-w-32 truncate">{rfq.project_name || '-'}</p>
                  </td>
                  <td className="table-cell text-center">
                    <span className="badge badge-blue">{rfq.item_count ?? '-'}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="font-semibold text-gray-800 text-sm">{formatIDR(rfq.grand_total)}</span>
                  </td>
                  <td className="table-cell">
                    <div className="relative">
                      <select
                        value={rfq.status}
                        onChange={(e) => updateStatus(rfq.id, e.target.value)}
                        disabled={statusLoading === rfq.id}
                        className={`text-xs font-semibold px-2 py-1 pr-6 rounded-full border cursor-pointer appearance-none transition-colors disabled:opacity-50
                          ${rfq.status === 'quoted' ? 'bg-green-50 text-green-700 border-green-200' :
                            rfq.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            rfq.status === 'submitted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            rfq.status === 'closed' ? 'bg-brand-50 text-brand-700 border-brand-200' :
                            rfq.status === 'cancelled' ? 'bg-red-50 text-red-400 border-red-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'}`}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="processing">Processing</option>
                        <option value="quoted">Quoted</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs">{formatDateTime(rfq.submitted_at || rfq.created_at)}</p>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/rfq/${rfq.id}`} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                        <FileText size={12} /> Detail
                      </Link>
                      <button
                        onClick={() => downloadPdf(rfq)}
                        disabled={pdfLoading === rfq.id}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        <Download size={12} />
                        {pdfLoading === rfq.id ? '...' : 'PDF'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-xs text-gray-500">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-surface-border disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-surface-border disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
