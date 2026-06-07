'use client';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[OSCARPART GlobalError]', error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '24px', textAlign: 'center'
        }}>
          <div style={{ maxWidth: 400 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: '#fef2f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', margin: '0 0 8px' }}>
              Aplikasi Error
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px' }}>
              Terjadi kesalahan kritis. Silakan muat ulang halaman.
            </p>
            {error?.digest && (
              <p style={{ fontSize: 11, color: '#cbd5e1', fontFamily: 'monospace', marginBottom: 24 }}>
                ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                background: '#0ea5e9', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px', fontSize: 14,
                fontWeight: 700, cursor: 'pointer'
              }}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
