'use client';

import { useEffect, useState } from 'react';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { api } from '../../../lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PmBundle {
  id: number;
  unit_model: string;
  interval_hm: number;
  bundle_name: string;
  description: string;
  total_items: number;
}

interface PmBundleItem {
  id: number;
  item_no: number;
  component_category: string;
  component_name: string;
  action: string;
  part_number: string | null;
  qty: number;
  unit: string;
  spec: string | null;
  notes: string | null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchBundles(model?: string): Promise<PmBundle[]> {
  const url = model
    ? `/pm-bundles?unit_model=${model}`
    : `/pm-bundles`;
  const res = await api.get(url);
  const json = res.data;
  return json.data ?? [];
}

async function fetchBundleDetail(
  id: number
): Promise<{ bundle: PmBundle; items: PmBundleItem[] }> {
  const res = await api.get(`/pm-bundles/${id}`);
  const json = res.data;
  return json.data;
}

async function fetchModels(): Promise<string[]> {
  const res = await api.get('/pm-bundles/models');
  const json = res.data;
  return json.data ?? [];
}

// ─── Category badge colours ───────────────────────────────────────────────────
const categoryColor: Record<string, string> = {
  OIL:     'bg-yellow-100 text-yellow-800',
  FILTER:  'bg-blue-100 text-blue-800',
  GREASE:  'bg-green-100 text-green-800',
  CHECK:   'bg-gray-100 text-gray-700',
  REPLACE: 'bg-red-100 text-red-700',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function BundlePmPage() {
  const [models, setModels]               = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [bundles, setBundles]             = useState<PmBundle[]>([]);
  const [activeBundle, setActiveBundle]   = useState<PmBundle | null>(null);
  const [items, setItems]                 = useState<PmBundleItem[]>([]);
  const [loading, setLoading]             = useState(false);

  // Load daftar model
  useEffect(() => {
    fetchModels().then((m) => {
      setModels(m);
      if (m.length > 0) setSelectedModel(m[0]);
    });
  }, []);

  // Load bundles saat model berubah
  useEffect(() => {
    if (!selectedModel) return;
    setLoading(true);
    fetchBundles(selectedModel)
      .then(setBundles)
      .finally(() => setLoading(false));
    setActiveBundle(null);
    setItems([]);
  }, [selectedModel]);

  // Load items saat bundle dipilih
  const handleSelectBundle = async (bundle: PmBundle) => {
    setActiveBundle(bundle);
    setLoading(true);
    const detail = await fetchBundleDetail(bundle.id);
    setItems(detail.items);
    setLoading(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bundle PM</h1>
        <p className="text-gray-500 mt-1">
          Paket Preventive Maintenance berdasarkan interval HM unit SANY
        </p>
      </div>

      {/* Filter Model */}
      <div className="flex flex-wrap gap-2 mb-6">
        {models.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedModel(m)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              selectedModel === m
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daftar Bundle (kiri) */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Interval PM — {selectedModel}
          </h2>

          {loading && !activeBundle && (
            <div className="space-y-3">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          )}

          <div className="space-y-2">
            {bundles.map((bundle) => (
              <button
                key={bundle.id}
                onClick={() => handleSelectBundle(bundle)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  activeBundle?.id === bundle.id
                    ? 'bg-blue-50 border-blue-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">
                    {bundle.interval_hm.toLocaleString()} HM
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {bundle.total_items} items
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{bundle.bundle_name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Items (kanan) */}
        <div className="lg:col-span-2">
          {!activeBundle ? (
            <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
              <p className="text-gray-400">← Pilih interval PM untuk melihat detail</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {activeBundle.bundle_name}
                  </h2>
                  {activeBundle.description && (
                    <p className="text-sm text-gray-500">{activeBundle.description}</p>
                  )}
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {items.length} item
                </span>
              </div>

              {loading ? (
                <p className="text-gray-400 text-sm">Memuat item...</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left w-8">#</th>
                        <th className="px-4 py-3 text-left">Kategori</th>
                        <th className="px-4 py-3 text-left">Komponen</th>
                        <th className="px-4 py-3 text-left">Action</th>
                        <th className="px-4 py-3 text-left">Part Number</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-left">Spesifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-400">{item.item_no}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                categoryColor[item.component_category] ??
                                'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {item.component_category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {item.component_name}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.action}</td>
                          <td className="px-4 py-3">
                            {item.part_number ? (
                              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                {item.part_number}
                              </code>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {item.qty} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {item.spec ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
