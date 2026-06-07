'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, FileText, Target, Building2, Wrench, BarChart2,
  Settings, LogOut, ArrowRight, LayoutDashboard, Bell, Menu, X
} from 'lucide-react';

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button
      onClick={logout}
      className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
    >
      <LogOut size={14} /> Logout
    </button>
  );
}

const NAV_ITEMS = [
  { href: '/admin/dashboard',     label: 'Dashboard',       icon: <LayoutDashboard size={16} /> },
  { href: '/admin/users',         label: 'User & Approval', icon: <Users size={16} /> },
  { href: '/admin/leads',         label: 'Lead CRM',        icon: <Target size={16} /> },
  { href: '/admin/customers',     label: 'Customer',        icon: <Building2 size={16} /> },
  { href: '/admin/rfq',           label: 'RFQ',             icon: <FileText size={16} /> },
  { href: '/admin/parts',         label: 'Database Part',   icon: <Wrench size={16} /> },
  { href: '/admin/analytics',     label: 'Analitik',        icon: <BarChart2 size={16} /> },
  { href: '/admin/pm-reminders',  label: 'PM Reminder',     icon: <Bell size={16} /> },
  { href: '/admin/settings',      label: 'Pengaturan',      icon: <Settings size={16} /> },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="font-black text-base tracking-widest">OSCARPART</div>
          <div className="text-xs opacity-50 mt-0.5">Admin Panel</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <Link href="/" onClick={onClose} className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80">
          <ArrowRight size={12} /> Kembali ke site
        </Link>
        <LogoutButton />
      </div>
    </>
  );
}

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-brand-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-brand-900 text-white h-12 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="font-black text-sm tracking-widest">OSCARPART</span>
          <span className="text-white/40 text-xs ml-1">/ {title}</span>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-4 sm:mb-6 hidden lg:block">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
