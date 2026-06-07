'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, ChevronLeft, Printer, ChevronDown, ChevronUp, CheckSquare, Square, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PmBundle {
  id: number;
  unit_model: string;
  interval_hm: number;
  bundle_name: string;
  description: string;
  total_items: number;
}

interface BundleItem {
  id: number;
  item_no: number;
  component_category: string;
  component_name: string;
  action: string;
  part_number: string | null;
  qty: number | null;
  unit: string | null;
  spec: string | null;
}

// ─── API ─────────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

async function fetchModels(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/pm-bundles/models`);
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

async function fetchBundles(model: string): Promise<PmBundle[]> {
  try {
    const res = await fetch(`${API_BASE}/pm-bundles?unit_model=${model}`);
    const json = await res.json();
    return json.data ?? [];
  } catch { return []; }
}

async function fetchBundleDetail(id: number): Promise<BundleItem[]> {
  try {
    const res = await fetch(`${API_BASE}/pm-bundles/${id}`);
    const json = await res.json();
    return json.data?.items ?? [];
  } catch { return []; }
}

// ─── Category Color ──────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  OIL:    'bg-amber-100 text-amber-800',
  FILTER: 'bg-blue-100 text-blue-800',
  GREASE: 'bg-green-100 text-green-800',
  BELT:   'bg-purple-100 text-purple-800',
  FLUID:  'bg-cyan-100 text-cyan-800',
  INSPECT:'bg-gray-100 text-gray-700',
  CHECK:  'bg-gray-100 text-gray-700',
};
function catColor(cat: string) {
  return CAT_COLORS[cat?.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
}

// ─── Checklist State ─────────────────────────────────────────────────────────
type CheckMap = Record<number, boolean>; // item.id → checked

// ─── Component ───────────────────────────────────────────────────────────────
export default function OmmPocketGuidePage() {
  const { logout } = useAuth();

  const [models, setModels]         = useState<string[]>([]);
  const [selectedModel, setModel]   = useState<string>('');
  const [bundles, setBundles]       = useState<PmBundle[]>([]);
  const [selectedBundle, setBundle] = useState<PmBundle | null>(null);
  const [items, setItems]           = useState<BundleItem[]>([]);
  const [checked, setChecked]       = useState<CheckMap>({});
  const [loadingB, setLoadingB]     = useState(false);
  const [loadingI, setLoadingI]     = useState(false);
  const [expandedBundleId, setExpandedBundleId] = useState<number | null>(null);
  const [rfqLoading, setRfqLoading]   = useState(false);
  const [rfqSuccess, setRfqSuccess]   = useState<{rfq_number: string; item_count: number} | null>(null);

  // Load models on mount
  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      if (m.length > 0) setModel(m[0]);
    });
  }, []);

  // Load bundles when model changes
  useEffect(() => {
    if (!selectedModel) return;
    setLoadingB(true);
    setBundle(null);
    setItems([]);
    setChecked({});
    fetchBundles(selectedModel)
      .then(setBundles)
      .finally(() => setLoadingB(false));
  }, [selectedModel]);

  // Load items when bundle selected
  const openBundle = async (bundle: PmBundle) => {
    if (selectedBundle?.id === bundle.id) {
      setBundle(null);
      setItems([]);
      setExpandedBundleId(null);
      return;
    }
    setBundle(bundle);
    setExpandedBundleId(bundle.id);
    setChecked({});
    setLoadingI(true);
    const data = await fetchBundleDetail(bundle.id);
    setItems(data);
    setLoadingI(false);
  };

  const createRfq = async (bundle: PmBundle) => {
    setRfqLoading(true);
    setRfqSuccess(null);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/rfq/from-pm-bundle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bundle_id: bundle.id }),
      });
      const json = await res.json();
      if (json.success) setRfqSuccess(json.data);
      else alert('Gagal membuat RFQ: ' + (json.error ?? 'unknown error'));
    } catch {
      alert('Gagal terhubung ke server.');
    } finally {
      setRfqLoading(false);
    }
  };

  const toggleCheck = (id: number) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const checkedCount = items.filter((i) => checked[i.id]).length;
  const progress     = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  // Group items by category
  const grouped = items.reduce<Record<string, BundleItem[]>>((acc, item) => {
    const cat = item.component_category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/units" className="text-sm text-white/80 hover:text-white hidden sm:block">Unit Saya</Link>
            <Link href="/monthly-report" className="text-sm text-white/80 hover:text-white hidden sm:block">Laporan PM</Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6 print:hidden">
          <Link href="/my-dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-600 mb-3">
            <ChevronLeft size={14} /> Kembali ke Dashboard
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OMM Pocket Guide</h1>
              <p className="text-gray-500 mt-1">Panduan PM interaktif — bisa digunakan di lapangan sebagai checklist</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedBundle && items.length > 0 && (
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <Printer size={15} /> Cetak / PDF
                </button>
              )}
              {selectedBundle && items.length > 0 && (
                rfqSuccess ? (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-300">
                      <CheckCircle2 size={15} /> RFQ {rfqSuccess.rfq_number} dibuat ({rfqSuccess.item_count} items)
                    </div>
                    <Link href="/history" className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:border-brand-400 hover:text-brand-600 transition-colors">
                      Lihat RFQ Saya →
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => createRfq(selectedBundle)}
                    disabled={rfqLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    <ShoppingCart size={15} /> {rfqLoading ? 'Membuat RFQ...' : 'Buat RFQ dari Bundle ini'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Print header — only visible when printing */}
        {selectedBundle && (
          <div className="hidden print:block mb-6">
            <h1 className="text-xl font-bold">OSCARPART — OMM Pocket Guide</h1>
            <p className="text-sm text-gray-600">
              Model: <strong>{selectedBundle.unit_model}</strong> | 
              Interval: <strong>{selectedBundle.interval_hm.toLocaleString()} HM</strong> | 
              Total items: <strong>{items.length}</strong>
            </p>
            <hr className="mt-2 border-gray-300" />
          </div>
        )}

        {/* Model Selector */}
        <div className="print:hidden mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Pilih Model Unit:</p>
          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedModel === m
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Bundle List */}
        {loadingB ? (
          <div className="text-center py-8 text-gray-400 print:hidden">Memuat data PM...</div>
        ) : (
          <div className="space-y-3">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                  expandedBundleId === bundle.id ? 'border-brand-400' : 'border-gray-200'
                }`}
              >
                {/* Bundle Header */}
                <button
                  className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors print:hidden ${
                    expandedBundleId === bundle.id ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => openBundle(bundle)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{bundle.bundle_name}</span>
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                        {bundle.interval_hm.toLocaleString()} HM
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{bundle.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">{bundle.total_items} items</span>
                    {expandedBundleId === bundle.id
                      ? <ChevronUp size={16} className="text-gray-400" />
                      : <ChevronDown size={16} className="text-gray-400" />
                    }
                  </div>
                </button>

                {/* Items — expanded */}
                {expandedBundleId === bundle.id && (
                  <div className="bg-white border-t border-gray-100">
                    {loadingI ? (
                      <div className="text-center py-8 text-gray-400 print:hidden">Memuat checklist...</div>
                    ) : (
                      <>
                        {/* Progress Bar */}
                        {items.length > 0 && (
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 print:hidden">
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-gray-600 font-medium">Progress Checklist</span>
                              <span className={`font-bold ${progress === 100 ? 'text-green-600' : 'text-brand-600'}`}>
                                {checkedCount}/{items.length} ({progress}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {progress === 100 && (
                              <p className="text-xs text-green-600 font-semibold mt-2 text-center">
                                ✅ PM selesai! Semua item sudah dicek.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Items by Category */}
                        {Object.entries(grouped).map(([cat, catItems]) => (
                          <div key={cat} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${catColor(cat)}`}>
                                {cat}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {catItems.map((item) => (
                                <div
                                  key={item.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer print:cursor-default ${
                                    checked[item.id]
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-gray-100 hover:border-gray-200 print:border-gray-200'
                                  }`}
                                  onClick={() => toggleCheck(item.id)}
                                >
                                  {/* Checkbox */}
                                  <div className="mt-0.5 flex-shrink-0 print:hidden">
                                    {checked[item.id]
                                      ? <CheckSquare size={18} className="text-green-500" />
                                      : <Square size={18} className="text-gray-300" />
                                    }
                                  </div>
                                  {/* Print checkbox */}
                                  <div className="hidden print:flex items-center justify-center w-4 h-4 border border-gray-400 rounded flex-shrink-0 mt-0.5" />

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                                      <span className="text-xs text-gray-400 font-mono w-5 flex-shrink-0">
                                        {String(item.item_no).padStart(2, '0')}
                                      </span>
                                      <span className={`font-medium text-sm flex-1 ${checked[item.id] ? 'line-through text-gray-400' : 'text-gray-800'} print:no-underline print:text-gray-900`}>
                                        {item.component_name}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 ml-8">
                                      <span className="text-xs text-gray-500">
                                        🔧 {item.action}
                                      </span>
                                      {item.qty && (
                                        <span className="text-xs text-gray-500">
                                          📦 {item.qty} {item.unit}
                                        </span>
                                      )}
                                      {item.part_number && (
                                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                          PN: {item.part_number}
                                        </span>
                                      )}
                                      {item.spec && (
                                        <span className="text-xs text-blue-600 italic">
                                          {item.spec}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Print signature section */}
                        <div className="hidden print:block px-4 pb-6 mt-4">
                          <div className="grid grid-cols-3 gap-8 border-t border-gray-200 pt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-8">Dikerjakan oleh:</p>
                              <div className="border-b border-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">Nama & Tanda Tangan</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-8">Diperiksa oleh:</p>
                              <div className="border-b border-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">Nama & Tanda Tangan</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-8">Tanggal selesai:</p>
                              <div className="border-b border-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">DD / MM / YYYY</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loadingB && bundles.length === 0 && selectedModel && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">Data PM belum tersedia untuk model <strong>{selectedModel}</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}
