'use client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { Users, FileText, Target, Building2, Wrench, BarChart2, Settings, LogOut, ArrowRight, LayoutDashboard, Bell } from 'lucide-react';

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

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const NAV_ITEMS = [
    { href: '/admin/dashboard',  label: 'Dashboard',       icon: <LayoutDashboard size={16} /> },
    { href: '/admin/users',      label: 'User & Approval', icon: <Users size={16} /> },
    { href: '/admin/leads',      label: 'Lead CRM',        icon: <Target size={16} /> },
    { href: '/admin/customers',  label: 'Customer',        icon: <Building2 size={16} /> },
    { href: '/admin/rfq',        label: 'RFQ',             icon: <FileText size={16} /> },
    { href: '/admin/parts',      label: 'Database Part',   icon: <Wrench size={16} /> },
    { href: '/admin/analytics',  label: 'Analitik',        icon: <BarChart2 size={16} /> },
    { href: '/admin/pm-reminders', label: 'PM Reminder',    icon: <Bell size={16} /> },
    { href: '/admin/settings',   label: 'Pengaturan',      icon: <Settings size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <aside className="w-56 bg-brand-900 text-white flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="font-black text-base tracking-widest">OSCARPART</div>
          <div className="text-xs opacity-50 mt-0.5">Admin Panel</div>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80">
            <ArrowRight size={12} /> Kembali ke site
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-black text-gray-800 mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}