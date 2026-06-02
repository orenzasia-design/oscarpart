'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name:        '',
    email:            '',
    password:         '',
    confirm_password: '',
    company_name:     '',
    contact_person:   '',
    position:         '',
    mobile_number:    '',
    industry:         '',
    project_location: '',
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (form.password !== form.confirm_password) {
      setErrorMsg('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (form.password.length < 8) {
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);
    try {
      await authApi.register({
        full_name:        form.full_name,
        email:            form.email,
        password:         form.password,
        company_name:     form.company_name,
        contact_person:   form.contact_person,
        position:         form.position,
        mobile_number:    form.mobile_number,
        industry:         form.industry,
        project_location: form.project_location,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      const msgs: Record<string, string> = {
        EMAIL_EXISTS:     'Email sudah terdaftar. Silakan login atau gunakan email lain.',
        VALIDATION_ERROR: 'Data tidak valid. Periksa kembali isian Anda.',
      };
      setErrorMsg(msgs[code?.error || ''] || code?.message || 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pendaftaran Berhasil!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Akun Anda sedang dalam proses review oleh tim OSCARPART.
            Anda akan dihubungi setelah akun diverifikasi.
          </p>
          <a
            href="https://wa.me/6288802032033"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center mb-3"
          >
            Konfirmasi via WhatsApp
          </a>
          <Link href="/login" className="block text-sm text-brand-600 font-medium hover:underline mt-2">
            Sudah punya akun? Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-brand-600 tracking-widest">OSCARPART</Link>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Daftar Akun Customer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Isi data perusahaan Anda untuk mendapatkan akses harga dan fitur RFQ.
          </p>
        </div>

        <div className="card">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="section-title">Data Akun</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="label">Nama Lengkap *</label>
                  <input type="text" value={form.full_name} onChange={set('full_name')}
                    className="input" placeholder="Nama lengkap Anda" required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={set('email')}
                    className="input" placeholder="email@perusahaan.com" required />
                </div>
                <div>
                  <label className="label">Nomor HP / WhatsApp *</label>
                  <input type="tel" value={form.mobile_number} onChange={set('mobile_number')}
                    className="input" placeholder="628123456789" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" value={form.password} onChange={set('password')}
                    className="input" placeholder="Minimal 8 karakter" required minLength={8} />
                </div>
                <div>
                  <label className="label">Konfirmasi Password *</label>
                  <input type="password" value={form.confirm_password} onChange={set('confirm_password')}
                    className="input" placeholder="Ulangi password" required minLength={8} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="section-title">Data Perusahaan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="sm:col-span-2">
                  <label className="label">Nama Perusahaan *</label>
                  <input type="text" value={form.company_name} onChange={set('company_name')}
                    className="input" placeholder="PT / CV Nama Perusahaan" required />
                </div>
                <div>
                  <label className="label">Nama PIC / Kontak *</label>
                  <input type="text" value={form.contact_person} onChange={set('contact_person')}
                    className="input" placeholder="Nama yang bisa dihubungi" required />
                </div>
                <div>
                  <label className="label">Jabatan *</label>
                  <input type="text" value={form.position} onChange={set('position')}
                    className="input" placeholder="Procurement Manager, dll" required />
                </div>
                <div>
                  <label className="label">Industri</label>
                  <select value={form.industry} onChange={set('industry')} className="input">
                    <option value="">-- Pilih Industri --</option>
                    <option value="Pertambangan Batubara">Pertambangan Batubara</option>
                    <option value="Pertambangan Mineral">Pertambangan Mineral</option>
                    <option value="Minyak & Gas">Minyak &amp; Gas</option>
                    <option value="Konstruksi">Konstruksi</option>
                    <option value="Perkebunan">Perkebunan</option>
                    <option value="Kontraktor Tambang">Kontraktor Tambang</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="label">Lokasi Project</label>
                  <input type="text" value={form.project_location} onChange={set('project_location')}
                    className="input" placeholder="Kutai Kartanegara, Kalimantan Timur" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}