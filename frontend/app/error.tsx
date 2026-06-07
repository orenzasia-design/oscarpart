'use client';
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[OSCARPART Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-black text-gray-800 mb-2">Terjadi Kesalahan</h1>
        <p className="text-sm text-gray-500 mb-1">
          Halaman ini mengalami error yang tidak terduga.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-300 font-mono mb-6">ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={reset}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
          <a href="/" className="btn-secondary text-sm flex items-center gap-2">
            <Home size={14} /> Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
