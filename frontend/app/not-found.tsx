import Link from 'next/link';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
          <SearchX size={32} className="text-brand-400" />
        </div>
        <p className="text-5xl font-black text-brand-600 mb-3">404</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-gray-500 mb-8">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="javascript:history.back()" className="btn-secondary text-sm flex items-center gap-2">
            <ArrowLeft size={14} /> Kembali
          </Link>
          <Link href="/" className="btn-primary text-sm flex items-center gap-2">
            <Home size={14} /> Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
