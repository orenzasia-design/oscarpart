'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';
import { LogOut, Plus, Pencil, Trash2, ChevronRight, Gauge, MapPin, Calendar, AlertCircle, X, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomerUnit {
  id: string;
  unit_name: string;
  model: string;
  serial_number: string | null;
  current_hm: number | null;
  hm_updated_at: string | null;
  year_of_manufacture: number | null;
  site_location: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

const PRESET_MODELS = [
  'HD785-7','HD785-8','HD465-7','HD325-7','HD255-5',
  'PC2000-8','PC1250-8','PC800-8','PC400-8','PC300-8','PC200-8','PC130-8',
  'D375A-6','D275A-5','D155A-6','D85EX-15','D65EX-16','D61EX-23',
  'GD825A-2','GD705A-4','GD555-5',
  '797F','793F','789D','785D','777G',
  '395','390F','374F','336F','330F','320F',
  'D11T','D10T2','D9T','D8T','D7E',
  'EX5600-6','EX3600-6','EX1900-6','EX1200-6','ZX870-5','ZX490-5',
  'R 9800','R 9600','R 9400','R 9350','R 9250',
  'EC950F','EC750E','EC480E','EC380E',
];

const EMPTY_FORM = {
  unit_name: '', model: '', serial_number: '', current_hm: '',
  year_of_manufacture: '', site_location: '', notes: '', custom_model: '',
};

function formatHM(hm: number | null) {
  if (hm === null || hm === undefined) return '—';
  return `${hm.toLocaleString('id-ID')} HM`;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UnitsPage() {
  const { user, isApproved, logout } = useAuth();
  const router = useRouter();

  const [units, setUnits]       = useState<CustomerUnit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState<string | null>(null);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await api.get('/units/my');
      setUnits(res.data.data || []);
    } catch {
      toast.error('Gagal memuat data unit.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/login?expired=true'); return; }
    if (!isApproved) return;
    fetchUnits();
  }, [user, isApproved, router, fetchUnits]);

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setUseCustomModel(false);
    setShowForm(true);
  }

  function openEdit(unit: CustomerUnit) {
    const isPreset = PRESET_MODELS.includes(unit.model);
    setForm({
      unit_name:           unit.unit_name,
      model:               isPreset ? unit.model : '',
      serial_number:       unit.serial_number || '',
      current_hm:          unit.current_hm?.toString() || '',
      year_of_manufacture: unit.year_of_manufacture?.toString() || '',
      site_location:       unit.site_location || '',
      notes:               unit.notes || '',
      custom_model:        isPreset ? '' : unit.model,
    });
    setUseCustomModel(!isPreset);
    setEditId(unit.id);
    setShowForm(true);
  }

  async function handleSave() {
    const modelValue = useCustomModel ? form.custom_model.trim() : form.model;
    if (!form.unit_name.trim() || !modelValue) {
      toast.error('Nama unit dan model wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        unit_name:           form.unit_name.trim(),
        model:               modelValue,
        serial_number:       form.serial_number.trim() || undefined,
        current_hm:          form.current_hm ? parseFloat(form.current_hm) : undefined,
        year_of_manufacture: form.year_of_manufacture ? parseInt(form.year_of_manufacture) : undefined,
        site_location:       form.site_location.trim() || undefined,
        notes:               form.notes.trim() || undefined,
      };

      if (editId) {
        await api.patch(`/units/${editId}`, payload);
        toast.success('Unit berhasil diperbarui!');
      } else {
        await api.post('/units', payload);
        toast.success('Unit berhasil didaftarkan!');
      }
      setShowForm(false);
      fetchUnits();
    } catch {
      toast.error('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/units/${id}`);
      toast.success('Unit dihapus.');
      setDeleteConfirm(null);
      fetchUnits();
    } catch {
      toast.error('Gagal menghapus unit.');
    }
  }

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
            <Link href="/my-dashboard" className="text-sm text-white/80 hover:text-white hidden sm:block">Dashboard</Link>
            <Link href="/search"       className="text-sm text-white/80 hover:text-white hidden sm:block">Cari Part</Link>
            <Link href="/rfq"          className="text-sm text-white/80 hover:text-white hidden sm:block">Buat RFQ</Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">Unit Saya</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola data unit alat berat Anda</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Tambah Unit
          </button>
        </div>

        {/* Not approved warning */}
        {!isApproved && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">Akun Anda belum disetujui. Fitur ini tersedia setelah akun diverifikasi.</p>
          </div>
        )}

        {/* Unit list */}
        {units.length === 0 ? (
          <div className="card py-16 text-center">
            <Gauge size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Belum ada unit terdaftar</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Daftarkan unit alat berat Anda untuk mulai memantau HM dan jadwal PM.</p>
            <button onClick={openAdd} className="btn-primary text-sm">
              <Plus size={15} className="inline mr-1" /> Daftarkan Unit Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="card hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Gauge size={22} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">{unit.unit_name}</span>
                      <span className="badge badge-blue text-xs">{unit.model}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Gauge size={11} />
                        <strong className="text-gray-700">{formatHM(unit.current_hm)}</strong>
                        {unit.hm_updated_at && <span className="text-gray-400">· diupdate {formatDate(unit.hm_updated_at)}</span>}
                      </span>
                      {unit.site_location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {unit.site_location}
                        </span>
                      )}
                      {unit.year_of_manufacture && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {unit.year_of_manufacture}
                        </span>
                      )}
                      {unit.serial_number && (
                        <span className="text-gray-400">S/N: {unit.serial_number}</span>
                      )}
                    </div>
                    {unit.notes && (
                      <p className="text-xs text-gray-400 mt-1.5 italic">{unit.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEdit(unit)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                      title="Edit unit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(unit.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Hapus unit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation inline */}
                {deleteConfirm === unit.id && (
                  <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-700 font-medium">Hapus unit <strong>{unit.unit_name}</strong>?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">Batal</button>
                      <button onClick={() => handleDelete(unit.id)} className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg">Ya, Hapus</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form Tambah/Edit Unit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-gray-800">{editId ? 'Edit Unit' : 'Tambah Unit Baru'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Nama Unit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.unit_name}
                  onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
                  placeholder="Contoh: DT-01, Excavator Pit A"
                  className="input w-full"
                />
                <p className="text-xs text-gray-400 mt-1">Nama yang mudah dikenali, misal: DT-12, PC300 Pit North</p>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Model Unit <span className="text-red-500">*</span>
                </label>
                {!useCustomModel ? (
                  <div className="space-y-2">
                    <select
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">-- Pilih model --</option>
                      {PRESET_MODELS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustomModel(true)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      + Model tidak ada di daftar? Ketik sendiri
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={form.custom_model}
                      onChange={(e) => setForm({ ...form, custom_model: e.target.value })}
                      placeholder="Contoh: PC500-8, EX2600-7"
                      className="input w-full"
                    />
                    <button
                      type="button"
                      onClick={() => { setUseCustomModel(false); setForm({ ...form, custom_model: '' }); }}
                      className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                    >
                      ← Kembali ke daftar preset
                    </button>
                  </div>
                )}
              </div>

              {/* HM Saat Ini */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  HM Saat Ini (Hour Meter)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.current_hm}
                    onChange={(e) => setForm({ ...form, current_hm: e.target.value })}
                    placeholder="Contoh: 12450"
                    min="0"
                    step="0.1"
                    className="input w-full pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">jam</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Angka di hour meter unit Anda sekarang</p>
              </div>

              {/* Serial Number & Tahun */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Serial Number</label>
                  <input
                    type="text"
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                    placeholder="Contoh: HD785-1234"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tahun Pembuatan</label>
                  <input
                    type="number"
                    value={form.year_of_manufacture}
                    onChange={(e) => setForm({ ...form, year_of_manufacture: e.target.value })}
                    placeholder="2018"
                    min="1990"
                    max={new Date().getFullYear()}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Lokasi Site */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lokasi Site</label>
                <input
                  type="text"
                  value={form.site_location}
                  onChange={(e) => setForm({ ...form, site_location: e.target.value })}
                  placeholder="Contoh: Pit A Kalimantan Timur"
                  className="input w-full"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catatan</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Kondisi unit, history singkat, dll..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 btn-secondary text-sm">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Daftarkan Unit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
