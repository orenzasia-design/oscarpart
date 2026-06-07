'use client';
import { useEffect, useState, useCallback } from 'react';
import { AdminShell } from '../AdminShell';
import { pmRemindersApi } from '@/lib/api-client';
import { formatDateTime } from '../../../../../lib/formatters';
import { Bell, Play, RefreshCw, CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReminderLog {
  id: string;
  unit_id: string;
  bundle_id: number;
  sent_at: string;
  channel: string;
  status: string;
  hm_at_send: number;
  next_pm_hm: number;
  hm_remaining: number;
  unit_name: string;
  model: string;
  bundle_name: string;
  interval_hm: number;
}

interface RunResult {
  sent: number;
  skipped: number;
}

const STATUS_STYLE: Record<string, string> = {
  sent:   'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-500 border-red-200',
  skipped:'bg-gray-50 text-gray-400 border-gray-200',
};

const CHANNEL_STYLE: Record<string, string> = {
  email:     'bg-blue-50 text-blue-600 border-blue-200',
  whatsapp:  'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export default function PmRemindersPage() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [threshold, setThreshold] = useState(50);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pmRemindersApi.getLogs();
      setLogs(res.data.data || []);
    } catch {
      toast.error('Gagal memuat log reminder.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await pmRemindersApi.run(threshold);
      const result: RunResult = res.data.data;
      setRunResult(result);
      toast.success(`Selesai: ${result.sent} reminder terkirim, ${result.skipped} dilewati.`);
      loadLogs();
    } catch {
      toast.error('Gagal menjalankan PM reminder.');
    } finally {
      setRunning(false);
    }
  };

  // Stats dari logs
  const totalSent    = logs.filter(l => l.status === 'sent').length;
  const totalFailed  = logs.filter(l => l.status === 'failed').length;
  const overdueCount = logs.filter(l => l.hm_remaining <= 0).length;

  return (
    <AdminShell title="PM Reminder">
      <div className="space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Log',      value: logs.length,  icon: <Bell size={18} className="text-brand-500" />,     bg: 'bg-brand-50' },
            { label: 'Terkirim',       value: totalSent,    icon: <CheckCircle size={18} className="text-green-500" />, bg: 'bg-green-50' },
            { label: 'Gagal',          value: totalFailed,  icon: <AlertTriangle size={18} className="text-red-400" />, bg: 'bg-red-50' },
            { label: 'Overdue (HM≤0)', value: overdueCount, icon: <Clock size={18} className="text-amber-500" />,    bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800">{loading ? '—' : s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Manual trigger panel */}
        <div className="card">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Play size={16} className="text-brand-600" /> Trigger Manual
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Jalankan PM reminder check sekarang (biasanya otomatis tiap jam 07:00 WIB)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 whitespace-nowrap">Threshold HM</label>
                <input
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(Number(e.target.value))}
                  min={1}
                  max={500}
                  className="input w-20 text-sm text-center"
                />
              </div>
              <button
                onClick={handleRun}
                disabled={running}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? 'Running...' : 'Jalankan'}
              </button>
            </div>
          </div>

          {/* Run result */}
          {runResult && (
            <div className="mt-4 pt-4 border-t border-surface-border flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-bold text-green-700">{runResult.sent} terkirim</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-sm text-gray-500">{runResult.skipped} dilewati (sudah pernah dikirim)</span>
              </div>
            </div>
          )}
        </div>

        {/* Log table */}
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <h2 className="font-bold text-gray-700 text-sm">Log Reminder (50 terbaru)</h2>
            <button
              onClick={loadLogs}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-brand-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Belum ada log reminder.</p>
              <p className="text-xs text-gray-300 mt-1">Jalankan trigger manual di atas untuk memulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface border-b border-surface-border">
                  <tr>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Waktu Kirim</th>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Unit</th>
                    <th className="table-header px-4 py-2.5 text-left text-xs">Bundle PM</th>
                    <th className="table-header px-4 py-2.5 text-center text-xs">HM Saat Kirim</th>
                    <th className="table-header px-4 py-2.5 text-center text-xs">HM Tersisa</th>
                    <th className="table-header px-4 py-2.5 text-center text-xs">Channel</th>
                    <th className="table-header px-4 py-2.5 text-center text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-surface">
                      <td className="table-cell text-xs text-gray-500">{formatDateTime(log.sent_at)}</td>
                      <td className="table-cell">
                        <p className="text-sm font-semibold text-gray-800">{log.unit_name}</p>
                        <p className="text-xs text-gray-400">{log.model}</p>
                      </td>
                      <td className="table-cell">
                        <p className="text-xs text-gray-700">{log.bundle_name}</p>
                        <p className="text-xs text-gray-400">Interval: {log.interval_hm} HM</p>
                      </td>
                      <td className="table-cell text-center">
                        <span className="text-sm font-mono font-bold text-gray-700">{log.hm_at_send?.toLocaleString()}</span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-sm font-bold font-mono ${log.hm_remaining <= 0 ? 'text-red-500' : log.hm_remaining <= 20 ? 'text-amber-500' : 'text-green-600'}`}>
                          {log.hm_remaining <= 0 ? `OVERDUE (${log.hm_remaining})` : `+${log.hm_remaining}`}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CHANNEL_STYLE[log.channel] || 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          {log.channel}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[log.status] || 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
