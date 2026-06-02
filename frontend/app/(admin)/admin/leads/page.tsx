'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api-client';
import { formatDateTime } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Search, Target, Phone, Mail, ChevronLeft, ChevronRight, Edit2, X, Check } from 'lucide-react';

interface Lead {
  id:           string;
  full_name:    string;
  company_name: string | null;
  email:        string | null;
  phone:        string | null;
  source:       string | null;
  status:       string;
  notes:        string | null;
  created_at:   string;
}

const STATUS_COLORS: Record<string, string> = {
  new:        'badge badge-blue',
  contacted:  'badge badge-yellow',
  qualified:  'badge bg-purple-100 text-purple-800',
  converted:  'badge badge-green',
  lost:       'badge badge-gray',
};
const STATUS_LABELS: Record<string, string> = {
  new:        'Baru',
  contacted:  'Dihubungi',
  qualified:  'Qualified',
  converted:  'Converted',
  lost:       'Lost',
};

export default function LeadsPage() {
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage]     = useState(1);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.leads({ page, limit, search: search || undefined, status: statusF || undefined });
      setLeads(res.data.data.leads || []);
      setTotal(res.data.data.pagination?.total || 0);
    } catch {
      toast.error('Gagal memuat data leads.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusF]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.updateLead(editing.id, { status: editStatus, notes: editNotes });
      toast.success('Lead diperbarui.');
      setEditing(null);
      load();
    } catch {
      toast.error('Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell title="Lead CRM">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button key={key}
            onClick={() => { setStatusF(statusF === key ? '' : key); setPage(1); }}
            className={`card py-3 text-center transition-all cursor-pointer hover:shadow-md ${statusF === key ? 'ring-2 ring-brand-400' : ''}`}>
            <p className="font-black text-lg text-brand-600">—</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-0 max-w-sm">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, perusahaan, email..."
              className="bg-transparent text-sm outline-none flex-1 min-w-0" />
          </div>
          <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }} className="input w-auto text-sm py-2">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="text-sm text-gray-500 ml-auto">{total} lead</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="table-header px-4 py-3 text-left">Nama / Perusahaan</th>
                <th className="table-header px-4 py-3 text-left">Kontak</th>
                <th className="table-header px-4 py-3 text-left">Sumber</th>
                <th className="table-header px-4 py-3 text-center">Status</th>
                <th className="table-header px-4 py-3 text-left">Catatan</th>
                <th className="table-header px-4 py-3 text-left">Waktu</th>
                <th className="table-header px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Memuat...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <Target size={36} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Belum ada lead.</p>
                  <p className="text-xs mt-1">Lead masuk otomatis saat customer mendaftar.</p>
                </td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface transition-colors">
                  <td className="table-cell">
                    <p className="font-semibold text-gray-800">{lead.full_name}</p>
                    <p className="text-xs text-gray-500">{lead.company_name || '-'}</p>
                  </td>
                  <td className="table-cell">
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 mb-0.5">
                        <Mail size={11} /> {lead.email}
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <Phone size={11} /> {lead.phone}
                      </a>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className="text-xs badge badge-gray">{lead.source || 'website'}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={STATUS_COLORS[lead.status] || 'badge badge-gray'}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs text-gray-500 max-w-40 truncate">{lead.notes || '-'}</p>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs">{formatDateTime(lead.created_at)}</p>
                  </td>
                  <td className="table-cell text-center">
                    <button onClick={() => openEdit(lead)}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition-colors mx-auto">
                      <Edit2 size={12} /> Edit
                    </button>
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Update Lead</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{editing.full_name} · {editing.company_name}</p>
            <div className="space-y-3">
              <div>
                <label className="label">Status Lead</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Catatan</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  rows={3} placeholder="Catatan follow-up, kebutuhan, dll..." className="input resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveEdit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Batal</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
