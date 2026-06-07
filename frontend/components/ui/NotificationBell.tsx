'use client';
/**
 * NotificationBell.tsx
 * Bell icon untuk AdminShell dengan real-time SSE notifications.
 * Tampil hanya untuk role admin/superadmin.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, FileText } from 'lucide-react';
import { getSseClient, destroySseClient } from '@/lib/sse-client';
import { getStoredToken } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'new_rfq' | 'pm_overdue' | 'rfq_status';

interface Notification {
  id:        string;
  type:      NotifType;
  title:     string;
  message:   string;
  timestamp: string;
  read:      boolean;
  link?:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return new Date(iso).toLocaleDateString('id-ID');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [notifs, setNotifs]     = useState<Notification[]>([]);
  const [open, setOpen]         = useState(false);
  const [connected, setConnected] = useState(false);
  const dropdownRef             = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  const addNotif = useCallback((n: Omit<Notification, 'id' | 'read'>) => {
    setNotifs((prev) => [
      { ...n, id: makeId(), read: false },
      ...prev.slice(0, 49), // max 50 notifs
    ]);
  }, []);

  // ─── SSE connection ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const client = getSseClient();

    client.on('new_rfq', (data) => {
      addNotif({
        type:      'new_rfq',
        title:     '📋 RFQ Baru Masuk',
        message:   `${data.company_name} — ${data.total_items} item`,
        timestamp: data.timestamp,
        link:      `/admin/rfq`,
      });
      // Browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('RFQ Baru — OSCARPART', {
          body: `${data.company_name}: ${data.total_items} item (${data.rfq_number})`,
          icon: '/favicon.ico',
        });
      }
    });

    client.on('pm_overdue', (data) => {
      addNotif({
        type:      'pm_overdue',
        title:     '🚨 PM Overdue',
        message:   `${data.unit_name} — ${data.bundle_name} (+${data.hm_overdue} HM)`,
        timestamp: data.timestamp,
        link:      `/admin/pm-reminders`,
      });
    });

    client.on('connected', () => setConnected(true));
    client.on('ping',      () => setConnected(true));

    client.connect(token);

    return () => {
      destroySseClient();
      setConnected(false);
    };
  }, [addNotif]);

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Request browser notification permission ──────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function getIcon(type: NotifType) {
    if (type === 'new_rfq')    return <FileText size={14} className="text-blue-500" />;
    if (type === 'pm_overdue') return <AlertTriangle size={14} className="text-red-500" />;
    return <Bell size={14} className="text-gray-400" />;
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifikasi"
      >
        <Bell size={20} className={connected ? 'text-gray-600' : 'text-gray-300'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {/* Connection dot */}
        <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-500" />
              <span className="font-semibold text-sm text-gray-700">Notifikasi</span>
              {unread > 0 && (
                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unread} baru
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <CheckCheck size={12} /> Tandai semua
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                Belum ada notifikasi
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                      if (n.link) window.location.href = n.link;
                      setOpen(false);
                    }}
                  >
                    <p className={`text-sm font-medium truncate ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="shrink-0 text-gray-300 hover:text-gray-500 mt-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50 text-center">
            <span className={`text-[10px] ${connected ? 'text-green-500' : 'text-gray-400'}`}>
              {connected ? '● Live' : '○ Reconnecting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
