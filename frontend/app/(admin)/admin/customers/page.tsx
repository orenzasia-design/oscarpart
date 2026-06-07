'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatDateTime, STATUS_BADGE, STATUS_LABELS } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Search, Building2, CheckCircle, XCircle, UserX, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';

interface Customer {
  id:               string;
  email:            string;
  full_name:        string;
  role:             string;
  status:           string;
  company_name:     string | null;
  contact_person:   string | null;
  position:         string | null;
  industry:         string | null;
  mobile_number:    string | null;
  whatsapp_number:  string | null;
  project_location: string | null;
  created_at:       string;
  approved_at:      string | null;
  rfq_count?:       number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('approved');
  const [page, setPage]           = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users({ page, limit, status: statusFilter || undefined, search: search || undefined });
      setCustomers(res.data.data.users);
      setTotal(res.data.data.pagination.total);
      if (res.data.data.summary) setSummary(res.data.data.summary);
    } catch {
      toast.error('Gagal memuat data customer.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (c: Customer) => {
    setActionLoading(c.id);
    try {
      await adminApi.approveUser(c.id);
      toast.success(`${c.company_name || c.full_name} disetujui.`);
      load();
    } catch { toast.error('Gagal.'); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (c: Customer) => {
    if (!confirm(`Suspend akun ${c.full_name}?`)) return;
    setActionLoading(c.id);
    try {
      await adminApi.suspendUser(c.id);
      toast.success('Akun disuspend.');
      load();
    } catch { toast.error('Gagal.'); }
    finally { setActionLoading(null); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell title="Customer">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',      value: (summary.approved||0)+(summary.pending||0)+(summary.rejected||0)+(summary.suspended||0), color: 'text-brand-600',  bg: 'bg-brand-50',  border: 'border-brand-200',  filter: '' },
          { label: 'Disetujui', value: summary.approved  || 0, color: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200',  filter: 'approved'  },
          { label: 'Pending',   value: summary.pending   || 0, color: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200',  filter: 'pending'   },
          { label: 'Suspended', value: summary.suspended || 0, color: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',    filter: 'suspended' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setStatus(s.filter); setPage(1); }}
            className={`card py-3 text-left transition-all cursor-pointer ${s.bg} ${s.border} border-2 ${statusFilter === s.filter ? 'ring-2 ring-brand-400 ring-offset-1' : 'hover:shadow-sm'}`}
          >
            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString('id-ID')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-0 max-w-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, email, perusahaan..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-auto text-sm py-2">
            <option value="">Semua</option>
            <option value="approved">Disetujui</option>
            <option value="pending">Pending</option>
            <option value="rejected">Ditolak</option>
            <option value="suspended">Disuspend</option>
          </select>
          <span className="text-sm text-gray-500 ml-auto">{total} customer</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="table-header px-4 py-3 text-left">Perusahaan</th>
                <th className="table-header px-4 py-3 text-left">Industri</th>
                <th className="table-header px-4 py-3 text-left">Kontak</th>
                <th className="table-header px-4 py-3 text-center">Status</th>
                <th className="table-header px-4 py-3 text-center">RFQ</th>
                <th className="table-header px-4 py-3 text-left">Terdaftar</th>
                <th className="table-header px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Memuat...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                  <Building2 size={36} className="mx-auto mb-2 opacity-20" />
                  Tidak ada data customer.
                </td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-surface transition-colors">
                  <td className="table-cell">
                    <Link href={`/admin/users/${c.id}`} className="hover:text-brand-600">
                      <p className="font-semibold text-gray-800">{c.company_name || '-'}</p>
                      <p className="text-xs text-gray-500">{c.full_name} · {c.position || '-'}</p>
                    </Link>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs">{c.industry || '-'}</p>
                    <p className="text-xs text-gray-400">{c.project_location || '-'}</p>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-0.5">
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600">
                        <Mail size={11} /> {c.email}
                      </a>
                      {c.mobile_number && (
                        <a href={`https://wa.me/${c.mobile_number}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                          <Phone size={11} /> {c.mobile_number}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className={STATUS_BADGE[c.status] || 'badge-gray'}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`text-sm font-bold ${(c.rfq_count||0) > 0 ? 'text-brand-600' : 'text-gray-300'}`}>
                      {c.rfq_count || 0}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs">{formatDateTime(c.created_at)}</p>
                    {c.approved_at && <p className="text-xs text-green-600">✓ {formatDateTime(c.approved_at)}</p>}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      {c.status === 'pending' && (
                        <button onClick={() => handleApprove(c)} disabled={actionLoading === c.id}
                          className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2 py-1.5 rounded-lg disabled:opacity-50">
                          <CheckCircle size={12} /> Setujui
                        </button>
                      )}
                      {c.status === 'approved' && (
                        <button onClick={() => handleSuspend(c)} disabled={actionLoading === c.id}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2 py-1.5 rounded-lg disabled:opacity-50">
                          <UserX size={12} /> Suspend
                        </button>
                      )}
                      <Link href={`/admin/users/${c.id}`} className="text-xs text-brand-600 hover:underline">Detail</Link>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-surface-border disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-surface-border disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
