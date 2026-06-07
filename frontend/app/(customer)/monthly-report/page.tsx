'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronLeft, AlertTriangle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { api } from '../../../lib/api-client';

// ─── Types ──────────────────────────────────────────────────────────────────
interface PmStatus {
  bundle_id: number;
  bundle_name: string;
  interval_hm: number;
  last_pm_hm: number;
  next_pm_hm: number;
  hm_to_next: number;
  total_items: number;
  items_with_pn: number;
  status: 'overdue' | 'due_soon' | 'ok';
}

interface UnitReport {
  unit_id: string;
  unit_name: string;
  model: string;
  serial_number: string | null;
  current_hm: number;
  hm_updated_at: string | null;
  site_location: string | null;
  pm_status: PmStatus[];
  overdue_count: number;
  due_soon_count: number;
  has_pm_data: boolean;
}

interface ReportData {
  period: { year: number; month: number; label: string };
  generated_at: string;
  total_units: number;
  units_overdue: number;
  units_due_soon: number;
  report: UnitReport[];
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function fetchReport(month: string): Promise<ReportData | null> {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await api.get(`/monthly-report?month=${month}`);
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = res.data;
    return json.data ?? null;
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    opts.push({ value, label });
  }
  return opts;
}

function StatusBadge({ status }: { status: PmStatus['status'] }) {
  if (status === 'overdue')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        <AlertTriangle size={10} /> Overdue
      </span>
    );
  if (status === 'due_soon')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
        <Clock size={10} /> Segera
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircle size={10} /> OK
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MonthlyReportPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const MONTHS = monthOptions();

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    setLoading(true);
    fetchReport(selectedMonth)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [selectedMonth, user, router]);

  const toggleUnit = (id: string) =>
    setExpandedUnit((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/units" className="text-sm text-white/80 hover:text-white hidden sm:block">Unit Saya</Link>
            <Link href="/pm-bundles" className="text-sm text-white/80 hover:text-white hidden sm:block">Bundle PM</Link>
            <button onClick={logout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link href="/my-dashboard" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-brand-600 mb-3">
            <ChevronLeft size={14} /> Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan PM</h1>
          <p className="text-gray-500 mt-1">Status Preventive Maintenance semua unit Anda</p>
        </div>

        {/* Month Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {MONTHS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                selectedMonth === m.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <p>Memuat laporan...</p>
          </div>
        )}

        {!loading && report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-gray-800">{report.total_units}</div>
                <div className="text-xs text-gray-500 mt-1">Total Unit</div>
              </div>
              <div className={`rounded-xl border p-4 text-center shadow-sm ${report.units_overdue > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                <div className={`text-3xl font-bold ${report.units_overdue > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {report.units_overdue}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unit Overdue PM</div>
              </div>
              <div className={`rounded-xl border p-4 text-center shadow-sm ${report.units_due_soon > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
                <div className={`text-3xl font-bold ${report.units_due_soon > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>
                  {report.units_due_soon}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unit Segera PM</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600">
                  {report.total_units - report.units_overdue - report.units_due_soon}
                </div>
                <div className="text-xs text-gray-500 mt-1">Unit Status OK</div>
              </div>
            </div>

            {/* Unit List */}
            {report.report.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 font-medium">Belum ada unit terdaftar.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Daftarkan unit Anda di{' '}
                  <Link href="/units" className="text-brand-600 hover:underline font-semibold">Unit Saya</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.report
                  .sort((a, b) => b.overdue_count - a.overdue_count || b.due_soon_count - a.due_soon_count)
                  .map((unit) => (
                  <div
                    key={unit.unit_id}
                    className={`rounded-xl border overflow-hidden shadow-sm transition-all ${
                      unit.overdue_count > 0
                        ? 'border-red-300'
                        : unit.due_soon_count > 0
                        ? 'border-yellow-300'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Unit Header */}
                    <button
                      className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-colors ${
                        unit.overdue_count > 0
                          ? 'bg-red-50 hover:bg-red-100'
                          : unit.due_soon_count > 0
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => toggleUnit(unit.unit_id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900">{unit.unit_name}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{unit.model}</span>
                          {!unit.has_pm_data && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No PM Data</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                          <span>HM: <strong className="text-gray-800">{unit.current_hm.toLocaleString()}</strong></span>
                          {unit.site_location && <span>📍 {unit.site_location}</span>}
                          {unit.serial_number && <span className="hidden sm:inline">S/N: {unit.serial_number}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {unit.overdue_count > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                            {unit.overdue_count} Overdue
                          </span>
                        )}
                        {unit.due_soon_count > 0 && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                            {unit.due_soon_count} Segera
                          </span>
                        )}
                        {expandedUnit === unit.unit_id
                          ? <ChevronUp size={16} className="text-gray-400" />
                          : <ChevronDown size={16} className="text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* PM Detail */}
                    {expandedUnit === unit.unit_id && (
                      <div className="px-4 pb-4 bg-white border-t border-gray-100">
                        {!unit.has_pm_data ? (
                          <p className="text-sm text-gray-400 py-4 text-center">
                            Data PM belum tersedia untuk model <strong>{unit.model}</strong>.
                          </p>
                        ) : (
                          <div className="overflow-x-auto mt-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                                  <th className="pb-2 pr-4 font-medium">Interval</th>
                                  <th className="pb-2 pr-4 font-medium">PM Terakhir</th>
                                  <th className="pb-2 pr-4 font-medium">PM Berikutnya</th>
                                  <th className="pb-2 pr-4 font-medium">Sisa HM</th>
                                  <th className="pb-2 pr-4 font-medium hidden sm:table-cell">Items PN</th>
                                  <th className="pb-2 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {unit.pm_status.map((pm) => (
                                  <tr key={pm.bundle_id}>
                                    <td className="py-2 pr-4 font-medium text-gray-800 whitespace-nowrap">
                                      {pm.interval_hm.toLocaleString()} HM
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                                      {pm.last_pm_hm.toLocaleString()} HM
                                    </td>
                                    <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                                      {pm.next_pm_hm.toLocaleString()} HM
                                    </td>
                                    <td className={`py-2 pr-4 font-semibold whitespace-nowrap ${
                                      pm.hm_to_next <= 0
                                        ? 'text-red-600'
                                        : pm.hm_to_next <= 50
                                        ? 'text-yellow-600'
                                        : 'text-green-600'
                                    }`}>
                                      {pm.hm_to_next <= 0
                                        ? `Lewat ${Math.abs(pm.hm_to_next)} HM`
                                        : `${pm.hm_to_next} HM lagi`}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-400 hidden sm:table-cell whitespace-nowrap">
                                      {pm.items_with_pn}/{pm.total_items}
                                    </td>
                                    <td className="py-2">
                                      <StatusBadge status={pm.status} />
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
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6 text-right">
              Dibuat: {new Date(report.generated_at).toLocaleString('id-ID')}
            </p>
          </>
        )}

        {!loading && !report && (
          <div className="text-center py-16 text-gray-400">
            <p>Gagal memuat laporan. Coba lagi nanti.</p>
          </div>
        )}
      </div>
    </div>
  );
}

