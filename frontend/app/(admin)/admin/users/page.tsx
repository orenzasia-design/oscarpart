'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatDateTime, STATUS_BADGE, STATUS_LABELS } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Search, Filter, CheckCircle, XCircle, UserX, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id:              string;
  email:           string;
  full_name:       string;
  role:            string;
  status:          string;
  company_name:    string | null;
  contact_person:  string | null;
  position:        string | null;
  industry:        string | null;
  mobile_number:   string | null;
  whatsapp_number: string | null;
  project_location:string | null;
  created_at:      string;
  approved_at:     string | null;
  approved_by_name:string | null;
  rfq_count?:      number;
}

// Konten utama yang menggunakan useSearchParams()
function AdminUsersContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [users, setUsers]       = useState<User[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage]         = useState(1);
  const limit = 20;

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.users({ page, limit, status: statusFilter || undefined, search: search || undefined });
      setUsers(res.data.data.users);
      setTotal(res.data.data.pagination.total);
    } catch {
      toast.error('Gagal memuat data users.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleApprove = async (user: User) => {
    setActionLoading(user.id);
    try {
      await adminApi.approveUser(user.id);
      toast.success(`${user.company_name || user.full_name} berhasil disetujui.`);
      loadUsers();
    } catch {
      toast.error('Gagal menyetujui user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || rejectReason.trim().length < 10) {
      toast.error('Alasan penolakan minimal 10 karakter.');
      return;
    }
    setActionLoading(rejectTarget.id);
    try {
      await adminApi.rejectUser(rejectTarget.id, rejectReason);
      toast.success('Pendaftaran ditolak.');
      setRejectTarget(null);
      setRejectReason('');
      loadUsers();
    } catch {
      toast.error('Gagal menolak user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (user: User) => {
    if (!confirm(`Yakin suspend akun ${user.full_name}?`)) return;
    setActionLoading(user.id);
    try {
      await adminApi.suspendUser(user.id);
      toast.success('Akun berhasil disuspend.');
      loadUsers();
    } catch {
      toast.error('Gagal suspend akun.');
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell title="Manajemen User & Approval">

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-0 max-w-xs">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, email, perusahaan..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input w-auto text-sm py-2"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="suspended">Disuspend</option>
            </select>
          </div>

          <span className="text-sm text-gray-500 ml-auto">{total} user ditemukan</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="table-header px-4 py-3 text-left">Perusahaan / Kontak</th>
                <th className="table-header px-4 py-3 text-left">Industri</th>
                <th className="table-header px-4 py-3 text-left">Status</th>
                <th className="table-header px-4 py-3 text-left">Terdaftar</th>
                <th className="table-header px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Memuat...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Tidak ada data.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-surface transition-colors">
                  <td className="table-cell">
                    <Link href={`/admin/users/${user.id}`} className="hover:text-brand-600">
                      <p className="font-semibold text-gray-800">{user.company_name || '-'}</p>
                      <p className="text-xs text-gray-500">{user.full_name}   {user.position || '-'}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </Link>
                   </td>
                  <td className="table-cell">
                    <p className="text-xs">{user.industry || '-'}</p>
                    <p className="text-xs text-gray-400">{user.project_location || '-'}</p>
                   </td>
                  <td className="table-cell">
                    <span className={STATUS_BADGE[user.status] || 'badge-gray'}>
                      {STATUS_LABELS[user.status] || user.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{user.role}</p>
                   </td>
                  <td className="table-cell">
                    <p className="text-xs">{formatDateTime(user.created_at)}</p>
                    {user.approved_at && (
                      <p className="text-xs text-green-600">✓ {formatDateTime(user.approved_at)}</p>
                    )}
                   </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user)}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={13} /> Setujui
                          </button>
                          <button
                            onClick={() => { setRejectTarget(user); setRejectReason(''); }}
                            className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <XCircle size={13} /> Tolak
                          </button>
                        </>
                      )}
                      {user.status === 'approved' && (
                        <button
                          onClick={() => handleSuspend(user)}
                          disabled={actionLoading === user.id}
                          className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserX size={13} /> Suspend
                        </button>
                      )}
                      <Link href={`/admin/users/${user.id}`} className="text-xs text-brand-600 hover:underline">Detail</Link>
                    </div>
                   </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-xs text-gray-500">
              Halaman {page} dari {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-surface-border disabled:opacity-40 hover:bg-surface"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-surface-border disabled:opacity-40 hover:bg-surface"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="font-bold text-gray-800 mb-1">Tolak Pendaftaran</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pendaftaran dari <strong>{rejectTarget.company_name || rejectTarget.full_name}</strong>.
            </p>
            <label className="label">Alasan Penolakan *</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan penolakan (min 10 karakter)..."
              className="input resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{rejectReason.length} karakter</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={actionLoading !== null || rejectReason.trim().length < 10}
                className="btn-danger flex-1"
              >
                {actionLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
              </button>
              <button onClick={() => setRejectTarget(null)} className="btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

// Ekspor default dengan Suspense boundary
export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat halaman...</div>}>
      <AdminUsersContent />
    </Suspense>
  );
}