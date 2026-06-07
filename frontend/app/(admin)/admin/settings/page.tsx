'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api-client';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Save, Settings, Palette } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface Setting { key: string; value: string; description?: string; }

const SETTING_LABELS: Record<string, { label: string; desc: string; type?: string }> = {
  company_name:    { label: 'Nama Perusahaan',   desc: 'Nama yang tampil di portal dan dokumen.' },
  company_address: { label: 'Alamat',            desc: 'Alamat lengkap perusahaan.' },
  company_phone:   { label: 'Nomor Telepon',     desc: 'Nomor telepon utama.' },
  company_email:   { label: 'Email',             desc: 'Email perusahaan.', type: 'email' },
  whatsapp_number: { label: 'Nomor WhatsApp',    desc: 'Format: 628xxx (tanpa +).' },
  rfq_tax_rate:    { label: 'Tarif PPN (%)',     desc: 'Misal: 11 untuk PPN 11%.' },
  rfq_validity_days:{ label: 'Masa Berlaku Quotation (hari)', desc: 'Default: 14 hari.' },
};

export default function SettingsPage() {
  const [settings, setSettings]   = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [edited, setEdited]       = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.settings();
      const map: Record<string, string> = {};
      (res.data.data as Setting[]).forEach((s) => { map[s.key] = s.value; });
      setSettings(map);
      setEdited(map);
    } catch {
      toast.error('Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await adminApi.updateSetting(key, edited[key] ?? '');
      setSettings((prev) => ({ ...prev, [key]: edited[key] ?? '' }));
      toast.success('Pengaturan disimpan.');
    } catch {
      toast.error('Gagal menyimpan.');
    } finally {
      setSaving(null);
    }
  };

  const isDirty = (key: string) => edited[key] !== settings[key];

  if (loading) return <AdminShell title="Pengaturan"><div className="text-gray-400 text-sm">Memuat...</div></AdminShell>;

  return (
    <AdminShell title="Pengaturan">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Settings size={15} /> Perubahan disimpan per baris — klik Simpan di setiap field.
        </div>

        {Object.entries(SETTING_LABELS).map(([key, meta]) => (
          <div key={key} className="card">
            <label className="label">{meta.label}</label>
            <p className="text-xs text-gray-400 mb-2">{meta.desc}</p>
            <div className="flex gap-2">
              <input
                type={meta.type || 'text'}
                value={edited[key] ?? ''}
                onChange={(e) => setEdited((prev) => ({ ...prev, [key]: e.target.value }))}
                className="input flex-1"
                placeholder={`Masukkan ${meta.label.toLowerCase()}...`}
              />
              <button
                onClick={() => handleSave(key)}
                disabled={!isDirty(key) || saving === key}
                className="btn-primary flex items-center gap-2 px-4 disabled:opacity-40"
              >
                <Save size={14} />
                {saving === key ? '...' : 'Simpan'}
              </button>
            </div>
          </div>
        ))}

        {/* Dark Mode Toggle */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Palette size={16} className="text-brand-600" />
                <p className="font-semibold text-gray-800 dark:text-slate-100 text-sm">Tampilan</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Pilih mode tampilan: Light, Dark, atau ikuti sistem.</p>
            </div>
            <ThemeToggle variant="full" />
          </div>
        </div>

        <div className="card bg-brand-50 border-brand-200">
          <p className="text-sm font-semibold text-brand-700 mb-1">Catatan</p>
          <ul className="text-xs text-brand-600 space-y-1">
            <li>• Nomor WhatsApp digunakan untuk tombol WhatsApp dan pengiriman RFQ.</li>
            <li>• Tarif PPN digunakan untuk kalkulasi otomatis di RFQ.</li>
            <li>• Perubahan berlaku segera setelah disimpan.</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
