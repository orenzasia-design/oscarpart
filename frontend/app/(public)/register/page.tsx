'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { authApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

const schema = z.object({
  email:            z.string().email('Format email tidak valid'),
  password:         z.string().min(8, 'Minimal 8 karakter')
                     .regex(/[A-Z]/, 'Harus ada huruf kapital')
                     .regex(/[0-9]/, 'Harus ada angka')
                     .regex(/[^A-Za-z0-9]/, 'Harus ada karakter khusus'),
  full_name:        z.string().min(2, 'Minimal 2 karakter'),
  company_name:     z.string().min(2, 'Wajib diisi'),
  business_type:    z.string().min(2, 'Wajib diisi'),
  contact_person:   z.string().min(2, 'Wajib diisi'),
  position:         z.string().min(2, 'Wajib diisi'),
  mobile_number:    z.string().min(8, 'Nomor tidak valid'),
  whatsapp_number:  z.string().min(8, 'Nomor tidak valid'),
  project_location: z.string().min(2, 'Wajib diisi'),
  industry:         z.string().min(2, 'Wajib diisi'),
  website:          z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

const INDUSTRIES = ['Pertambangan Batubara','Pertambangan Nikel','Pertambangan Emas','Pertambangan Bauksit','Minyak & Gas','Konstruksi','Kehutanan','Perkebunan','Lainnya'];
const BUSINESS_TYPES = ['Pemilik Tambang','Kontraktor Tambang','Kontraktor Umum','Distributor','Perusahaan Jasa','Lainnya'];

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authApi.register(data);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (msg === 'EMAIL_EXISTS') {
        toast.error('Email sudah terdaftar. Silakan login.');
      } else {
        toast.error('Pendaftaran gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-10">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Akun Anda sedang dalam proses review oleh tim OSCARPART. Anda akan mendapat notifikasi email setelah disetujui.
          </p>
          <Link href="/" className="btn-primary mt-6 inline-block">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  const field = (name: keyof FormData, label: string, type = 'text', opts?: { placeholder?: string }) => (
    <div>
      <label className="label">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={opts?.placeholder}
        className={`input ${errors[name] ? 'border-red-400 focus:ring-red-300' : ''}`}
      />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-surface py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-brand-600 tracking-widest">OSCARPART</Link>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Daftar Akun Customer</h1>
          <p className="text-sm text-gray-500 mt-1">Isi data perusahaan Anda. Proses approval oleh admin.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="section-title">Informasi Login</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('email',    'Email *', 'email', { placeholder: 'email@perusahaan.com' })}
              {field('password', 'Password *', 'password', { placeholder: 'Min 8 karakter, huruf kapital, angka, simbol' })}
            </div>

            <div className="section-title mt-6">Data Perusahaan</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('company_name', 'Nama Perusahaan *', 'text', { placeholder: 'PT Contoh Mining' })}
              <div>
                <label className="label">Tipe Bisnis *</label>
                <select {...register('business_type')} className={`input ${errors.business_type ? 'border-red-400' : ''}`}>
                  <option value="">Pilih tipe bisnis</option>
                  {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {errors.business_type && <p className="text-xs text-red-500 mt-1">{errors.business_type.message}</p>}
              </div>
              <div>
                <label className="label">Industri *</label>
                <select {...register('industry')} className={`input ${errors.industry ? 'border-red-400' : ''}`}>
                  <option value="">Pilih industri</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <p className="text-xs text-red-500 mt-1">{errors.industry.message}</p>}
              </div>
              {field('project_location', 'Lokasi Proyek / Tambang *', 'text', { placeholder: 'Kutai Kartanegara, Kalimantan Timur' })}
              <div>
                <label className="label">Website Perusahaan <span className="text-gray-400 font-normal text-xs">(opsional)</span></label>
                <input
                  {...register('website')}
                  type="text"
                  placeholder="https://www.perusahaan.com"
                  className={`input ${errors.website ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <p className="text-xs text-gray-400 mt-1">💡 Contoh: https://www.namawebsite.com — kosongkan jika tidak ada</p>
                {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website?.message}</p>}
              </div>
            </div>

            <div className="section-title mt-6">Data Kontak PIC</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('full_name',      'Nama Lengkap PIC *', 'text', { placeholder: 'Nama sesuai KTP' })}
              {field('contact_person', 'Nama Kontak (untuk korespondensi) *', 'text', { placeholder: 'Bisa sama dengan nama lengkap' })}
              {field('position',       'Jabatan *', 'text', { placeholder: 'Procurement Manager' })}
              {field('mobile_number',  'Nomor HP *', 'tel', { placeholder: '08123456789' })}
              {field('whatsapp_number','Nomor WhatsApp *', 'tel', { placeholder: '6281234567890' })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6 py-3 text-base"
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
