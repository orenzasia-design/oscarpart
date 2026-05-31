'use client';

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Package, AlertCircle, Lock, CheckCircle, XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';
import { partsApi, rfqApi } from '@/lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { formatIDR } from '../../../lib/formatters';

interface PartResult {
  id:                 string;
  part_number:        string;
  description:        string | null;
  brand_name:         string | null;
  unit_type:          string | null;
  stock_quantity?:    number;
  warehouse_location?: string | null;
  unit_price?:        number | null;
  status:             string;
}

interface CartItem {
  part_number: string;
  description: string | null;
  brand:       string | null;
  unit_type:   string | null;
  qty:         number;
}

// Komponen dalam yang menggunakan useSearchParams()
function SearchContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { user, isApproved } = useAuth();

  const [q, setQ]           = useState(searchParams.get('q') || '');
  const [inputQ, setInputQ] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PartResult[] | null>(null);
  const [meta, setMeta]       = useState<{ login_required?: boolean; approval_required?: boolean; message?: string } | null>(null);
  const [exact, setExact]     = useState(false);
  const [cart, setCart]       = useState<CartItem[]>([]);

  const doSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await partsApi.search(query.trim());
      setResults(res.data.data.parts);
      setMeta(res.data.data.meta);
      setExact(res.data.data.exact);
    } catch {
      toast.error('Pencarian gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (q) doSearch(q);
  }, [q, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputQ.trim();
    if (trimmed.length < 2) return;
    setQ(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const addToCart = (part: PartResult) => {
    setCart((prev) => {
      if (prev.find((c) => c.part_number === part.part_number)) {
        toast.error('Part sudah ada di keranjang.');
        return prev;
      }
      toast.success(`${part.part_number} ditambahkan ke RFQ.`);
      return [...prev, { part_number: part.part_number, description: part.description, brand: part.brand_name, unit_type: part.unit_type, qty: 1 }];
    });
  };

  const goToRfq = async () => {
    if (cart.length === 0) return;
    try {
      const draftRes = await rfqApi.createDraft();
      const rfqId    = draftRes.data.data.id;
      await rfqApi.updateItems(rfqId, cart.map((c) => ({ part_number: c.part_number, description: c.description, brand: c.brand, unit_type: c.unit_type, qty_requested: c.qty })));
      router.push(`/rfq/${rfqId}`);
    } catch {
      toast.error('Gagal membuat RFQ. Coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest mr-4">OSCARPART</Link>
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 max-w-xl">
            <div className="flex-1 flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
              <Search size={15} className="opacity-60 flex-shrink-0" />
              <input
                type="text"
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                placeholder="Cari part number..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-white/50"
              />
            </div>
            <button type="submit" className="bg-accent px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors">Cari</button>
          </form>
          {cart.length > 0 && (
            <button onClick={goToRfq} className="flex items-center gap-2 bg-white text-brand-600 font-semibold text-sm px-4 py-2 rounded-lg">
              <ShoppingCart size={15} /> RFQ ({cart.length})
            </button>
          )}
          {!user && (
            <Link href="/login" className="text-sm bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-xs">Login</Link>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search info */}
        {q && (
          <div className="mb-5 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="flex items-center gap-1 hover:text-brand-600"><ArrowLeft size={14} /> Beranda</Link>
            <span>/</span>
            <span>Hasil pencarian: <strong className="text-gray-800">"{q}"</strong></span>
          </div>
        )}

        {/* Role-based info banner */}
        {meta?.login_required && (
          <div className="flex items-start gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6">
            <Lock size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-700">{meta.message}</p>
              <div className="flex gap-3 mt-2">
                <Link href="/login"    className="text-xs font-semibold text-brand-600 underline">Login</Link>
                <Link href="/register" className="text-xs font-semibold text-brand-600 underline">Daftar Gratis</Link>
              </div>
            </div>
          </div>
        )}

        {meta?.approval_required && (
          <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700">{meta.message}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Mencari "{q}"...</p>
          </div>
        )}

        {/* No results */}
        {!loading && results && results.length === 0 && (
          <div className="card text-center py-16">
            <XCircle size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">Part tidak ditemukan</h3>
            <p className="text-sm text-gray-400 mb-4">
              Part number <strong>"{q}"</strong> tidak ada dalam database kami.
            </p>
            <p className="text-sm text-gray-500">
              Anda tetap bisa{' '}
              <Link href="/rfq" className="text-brand-600 font-medium underline">submit RFQ</Link>
              {' '}— tim kami akan mencarikan ketersediaannya.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {exact ? (
                  <span className="flex items-center gap-1 text-green-700">
                    <CheckCircle size={14} /> Ditemukan: <strong>{q}</strong>
                  </span>
                ) : (
                  <span>Hasil mirip untuk "<strong>{q}</strong>" — {results.length} ditemukan</span>
                )}
              </p>
              {isApproved && cart.length > 0 && (
                <button onClick={goToRfq} className="btn-primary text-sm flex items-center gap-2">
                  <ShoppingCart size={14} /> Lihat RFQ ({cart.length} item)
                </button>
              )}
            </div>

            <div className="space-y-3">
              {results.map((part) => (
                <div key={part.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-brand-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-brand-600 font-mono">{part.part_number}</span>
                          {part.brand_name && (
                            <span className="badge badge-blue">{part.brand_name}</span>
                          )}
                          {part.unit_type && (
                            <span className="badge badge-gray">{part.unit_type}</span>
                          )}
                        </div>
                        {part.description && (
                          <p className="text-sm text-gray-600 mt-0.5 truncate">{part.description}</p>
                        )}

                        {/* Stock & Price — tiered by role */}
                        <div className="flex items-center gap-4 mt-2">
                          {part.stock_quantity !== undefined ? (
                            <span className={`text-xs font-medium ${part.stock_quantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {part.stock_quantity > 0
                                ? `✓ Stok: ${part.stock_quantity} ${part.unit_type || ''}`
                                : '✗ Stok habis'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Lock size={11} /> Login untuk lihat stok
                            </span>
                          )}

                          {part.unit_price !== undefined ? (
                            <span className="text-sm font-bold text-gray-800 price-field">
                              {part.unit_price !== null ? formatIDR(part.unit_price) : 'Harga: konfirmasi'}
                            </span>
                          ) : user ? (
                            <span className="text-xs text-yellow-600 flex items-center gap-1">
                              <Lock size={11} /> Akun perlu disetujui
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Lock size={11} /> Login untuk lihat harga
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add to RFQ button */}
                    <button
                      onClick={() => addToCart(part)}
                      disabled={cart.some((c) => c.part_number === part.part_number)}
                      className="flex-shrink-0 btn-primary text-xs py-2 px-3 disabled:opacity-40"
                    >
                      {cart.some((c) => c.part_number === part.part_number) ? 'Ditambahkan ✓' : '+ RFQ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* RFQ CTA if cart has items */}
            {cart.length > 0 && (
              <div className="mt-6 card bg-brand-50 border-brand-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-700">{cart.length} part siap di-RFQ-kan</p>
                    <p className="text-xs text-brand-500 mt-0.5">Lanjutkan untuk isi detail perusahaan dan kirim.</p>
                  </div>
                  <button onClick={goToRfq} className="btn-primary flex items-center gap-2">
                    Buat RFQ <ChevronRightIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state — no search yet */}
        {!loading && !results && !q && (
          <div className="text-center py-16">
            <Search size={48} className="mx-auto mb-4 text-brand-200" />
            <p className="text-xl font-bold text-gray-700 mb-2">Cari Part Number Anda</p>
            <p className="text-sm text-gray-400 mb-8">Contoh: 1R-0750, 6I-2501, HMK15V, 707-99-45210</p>
            {!user && (
              <div className="max-w-sm mx-auto bg-brand-50 border border-brand-100 rounded-2xl p-6">
                <Lock size={24} className="text-brand-400 mx-auto mb-3" />
                <p className="font-semibold text-brand-700 mb-1">Login untuk lihat harga & stok</p>
                <p className="text-xs text-brand-400 mb-4">Database 100.000+ part number tersedia untuk customer terdaftar</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/login" className="btn-primary text-sm px-5 py-2">Login</Link>
                  <Link href="/register" className="text-sm border border-brand-300 text-brand-600 font-semibold px-5 py-2 rounded-lg hover:bg-brand-50">Daftar Gratis</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>;
}

// Ekspor default dengan Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center">Memuat halaman pencarian...</div>}>
      <SearchContent />
    </Suspense>
  );
}