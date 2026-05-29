'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user }       = useAuth();
  const router                = useRouter();
  const params                = useSearchParams();

  if (user) {
    if (user.role === 'admin' || user.role === 'superadmin') router.replace('/admin/dashboard');
    else router.replace('/my-dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const next = params.get('next') || '/my-dashboard';
      router.push(next);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      const msgs: Record<string, string> = {
        INVALID_CREDENTIALS: 'Email atau password salah.',
        ACCOUNT_SUSPENDED:   'Akun Anda telah disuspend. Hubungi admin.',
        ACCOUNT_REJECTED:    'Pendaftaran Anda ditolak. Hubungi admin.',
      };
      toast.error(msgs[code || ''] || 'Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-brand-600 tracking-widest">OSCARPART</Link>
          <h1 className="text-xl font-bold text-gray-800 mt-3">Login ke Akun Anda</h1>
        </div>

        <div className="card">
          {params.get('expired') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700 mb-4">
              Sesi Anda telah berakhir. Silakan login kembali.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="email@perusahaan.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                className="input"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Belum punya akun?{' '}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">Daftar gratis</Link>
        </p>
      </div>
    </div>
  );
}
