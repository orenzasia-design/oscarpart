'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { rfqApi } from '../../../lib/api-client';
import { formatIDR, formatDateTime, STATUS_BADGE, STATUS_LABELS } from '../../../lib/formatters';
import { useAuth } from '../../../lib/auth-context';
import { Pagination } from '../../../components/ui/index';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface RfqItem {
  id:                 string;
  part_number:        string;
  description:        string | null;
  brand:              string | null;
  unit_type:          string | null;
  qty_requested:      number;
  unit_price_at_time: number | null;
  line_total:         number | null;
  match_status:       string;
}

interface Rfq {
  id:               string;
  rfq_number:       string;
  status:           string;
  company_name:     string | null;
  project_name:     string | null;
  delivery_location:string | null;
  notes:            string | null;
  subtotal:         number | null;
  tax_rate:         number;
  tax_amount:       number | null;
  grand_total:      number | null;
  item_count:       number;
  created_at:       string;
  submitted_at:     string | null;
  items?:           RfqItem[];
}

export default function HistoryPage() {
  const { user, isApproved } = useAuth();
  const [rfqs, setRfqs]         = useState<Rfq[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const limit = 10;

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rfqApi.myRfqs(page);
      setRfqs(res.data.data.rfqs || []);
      setTotal(res.data.data.pagination?.total || 0);
    } catch {
      toast.error('Gagal memuat history RFQ.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const toggleExpand = async (rfqId: string) => {
    if (expanded === rfqId) { setExpanded(null); return; }
    setLoadingDetail(rfqId);
    try {
      const res  = await rfqApi.get(rfqId);
      const data = res.data.data;
      setRfqs((prev) => prev.map((r) => r.id === rfqId ? { ...r, items: data.items } : r));
      setExpanded(rfqId);
    } catch {
      toast.error('Gagal memuat detail RFQ.');
    } finally {
      setLoadingDetail(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <span className="text-white/40">|</span>
          <span className="text-sm text-white/80">History RFQ</span>
          <div className="ml-auto flex gap-4">
            <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">Dashboard</Link>
            <Link href="/rfq"       className="text-sm text-white/70 hover:text-white">Buat RFQ</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-gray-800">History RFQ</h1>
          <Link href="/rfq" className="btn-primary text-sm flex items-center gap-2">
            + Buat RFQ Baru
          </Link>
        </div>

        {loading ? (
          <div className="card py-16 text-center text-gray-400 text-sm">Memuat data...</div>
        ) : rfqs.length === 0 ? (
          <div className="card py-16 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada RFQ</p>
            <Link href="/rfq" className="btn-primary mt-4 inline-block text-sm">Buat RFQ Pertama</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="card p-0 overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => toggleExpand(rfq.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-brand-600">{rfq.rfq_number}</span>
                      <span className={STATUS_BADGE[rfq.status] || 'badge-gray'}>
                        {STATUS_LABELS[rfq.status] || rfq.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{rfq.project_name || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rfq.item_count} part · {formatDateTime(rfq.submitted_at || rfq.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {rfq.grand_total && isApproved ? (
                      <p className="font-bold text-gray-800 price-field">{formatIDR(rfq.grand_total)}</p>
                    ) : null}
                    {loadingDetail === rfq.id ? (
                      <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin ml-auto mt-1" />
                    ) : expanded === rfq.id ? (
                      <ChevronUp size={16} className="text-gray-400 ml-auto mt-1" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400 ml-auto mt-1" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === rfq.id && rfq.items && (
                  <div className="border-t border-surface-border bg-surface/50">
                    {/* Info */}
                    <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-b border-surface-border">
                      <div><span className="text-gray-400 text-xs">Lokasi Kirim</span><p className="font-medium">{rfq.delivery_location || '—'}</p></div>
                      <div><span className="text-gray-400 text-xs">Catatan</span><p className="font-medium">{rfq.notes || '—'}</p></div>
                      {isApproved && rfq.subtotal && (
                        <div>
                          <span className="text-gray-400 text-xs">Subtotal</span>
                          <p className="font-medium price-field">{formatIDR(rfq.subtotal)}</p>
                        </div>
                      )}
                    </div>

                    {/* Items table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface border-b border-surface-border">
                            <th className="table-header px-4 py-2.5 text-left">Part Number</th>
                            <th className="table-header px-4 py-2.5 text-left hidden sm:table-cell">Deskripsi</th>
                            <th className="table-header px-4 py-2.5 text-center">Qty</th>
                            <th className="table-header px-4 py-2.5 text-center">Status</th>
                            {isApproved && <th className="table-header px-4 py-2.5 text-right">Harga</th>}
                            {isApproved && <th className="table-header px-4 py-2.5 text-right">Total</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {rfq.items.map((item) => (
                            <tr key={item.id} className="hover:bg-surface">
                              <td className="px-4 py-3">
                                <span className="font-mono font-bold text-xs text-brand-600">{item.part_number}</span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-xs text-gray-500 truncate max-w-40 block">{item.description || '—'}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-sm">{item.qty_requested} {item.unit_type || ''}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`badge ${item.match_status === 'matched' ? 'badge-green' : 'badge-yellow'}`}>
                                  {item.match_status === 'matched' ? 'Ada' : 'Konfirmasi'}
                                </span>
                              </td>
                              {isApproved && (
                                <td className="px-4 py-3 text-right text-sm price-field">
                                  {formatIDR(item.unit_price_at_time)}
                                </td>
                              )}
                              {isApproved && (
                                <td className="px-4 py-3 text-right text-sm font-semibold price-field">
                                  {formatIDR(item.line_total)}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial footer */}
                    {isApproved && rfq.grand_total && (
                      <div className="flex justify-end gap-8 px-5 py-3 border-t border-surface-border text-sm">
                        <span className="text-gray-500">PPN {rfq.tax_rate}%: <strong className="price-field">{formatIDR(rfq.tax_amount)}</strong></span>
                        <span className="font-bold text-brand-700 text-base price-field">Grand Total: {formatIDR(rfq.grand_total)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={Math.ceil(total / limit)}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
