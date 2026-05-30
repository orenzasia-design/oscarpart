'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminApi } from '@/lib/api-client';
import { formatDateTime, formatIDR, STATUS_BADGE, STATUS_LABELS } from '@/lib/formatters';
import { AdminShell } from '../../AdminShell';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, UserX, Mail, Phone, MapPin, Building2, Briefcase } from 'lucide-react';

interface UserDetail {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  company_name: string | null;
  contact_person: string | null;
  position: string | null;
  industry: string | null;
  mobile_number: string | null;
  whatsapp_number: string | null;
  project_location: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by_name: string | null;
  rfq_count?: number;
}

export default function AdminUserDetailPage\(props: \{ params: Promise<\{ id: string \}> \}\) {
  const router = useRouter();
  const params = use(props.params);
  const id = id;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    adminApi.getUser(id)
      .then(res => setUser(res.data.data))
      .catch(() => toast.error('Gagal memuat data user.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminApi.approveUser(user.id);
      toast.success('User berhasil disetujui.');
      router.push('/admin/users');
    } catch {
      toast.error('Gagal menyetujui user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!user || rejectReason.trim().length < 10) {
      toast.error('Alasan penolakan minimal 10 karakter.');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.rejectUser(user.id, rejectReason);
      toast.success('Pendaftaran ditolak.');
      router.push('/admin/users');
    } catch {
      toast.error('Gagal menolak user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!user || !confirm('Yakin suspend akun ini?')) return;
    setActionLoading(true);
    try {
      await adminApi.suspendUser(user.id);
      toast.success('Akun berhasil disuspend.');
      router.push('/admin/users');
    } catch {
      toast.error('Gagal suspend akun.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <AdminShell title="Detail User"><div className="text-gray-400 text-sm">Memuat...</div></AdminShell>;
  if (!user) return <AdminShell title="Detail User"><div className="text-gray-400 text-sm">User tidak ditemukan.</div></AdminShell>;

  return (
    <AdminShell title="Detail User">
      <div className="mb-6">
        <Link href="/admin/users" className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
          <ArrowLeft size={16} /> Kembali ke daftar user
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-gray-800">{user.company_name || user.full_name}</h2>
                <p className="text-sm text-gray-500">{user.full_name} - {user.position || '-'}</p>
              </div>
              <span className={STATUS_BADGE[user.status] || 'badge-gray'}>
                {STATUS_LABELS[user.status] || user.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Mobile</p>
                  <p className="text-sm font-medium">{user.mobile_number || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Industri</p>
                  <p className="text-sm font-medium">{user.industry || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Lokasi Proyek</p>
                  <p className="text-sm font-medium">{user.project_location || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">WhatsApp</p>
                  <p className="text-sm font-medium">{user.whatsapp_number || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400">Terdaftar</p>
                  <p className="text-sm font-medium">{formatDateTime(user.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {user.status === 'pending' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Tindakan</h3>
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Setujui Pendaftaran
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} /> Tolak Pendaftaran
                </button>
              </div>
            </div>
          )}

          {user.status === 'approved' && (
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Tindakan</h3>
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserX size={16} /> Suspend Akun
              </button>
            </div>
          )}

          <div className="card">
            <h3 className="font-bold text-gray-800 mb-2">Info</h3>
            <p className="text-xs text-gray-500">Role: {user.role}</p>
            {user.approved_at && (
              <p className="text-xs text-green-600 mt-1">Disetujui: {formatDateTime(user.approved_at)}</p>
            )}
            {user.approved_by_name && (
              <p className="text-xs text-gray-500 mt-1">Oleh: {user.approved_by_name}</p>
            )}
          </div>
        </div>
      </div>

      {showReject && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="font-bold text-gray-800 mb-1">Tolak Pendaftaran</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pendaftaran dari <strong>{user.company_name || user.full_name}</strong>.
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
                disabled={actionLoading || rejectReason.trim().length < 10}
                className="btn-danger flex-1"
              >
                {actionLoading ? 'Memproses...' : 'Tolak Pendaftaran'}
              </button>
              <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}