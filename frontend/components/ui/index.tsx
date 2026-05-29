'use client';

import React from 'react';
import { X, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

// ============================================================
// Modal
// ============================================================

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${widths[size]} animate-slide-up`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// Spinner
// ============================================================

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-3' };
  return (
    <div className={`${sizes[size]} border-brand-600 border-t-transparent rounded-full animate-spin ${className}`} />
  );
}

export function PageLoader({ message = 'Memuat...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="text-gray-200 mb-4">
        {icon || <Inbox size={48} />}
      </div>
      <h3 className="font-semibold text-gray-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ============================================================
// Pagination
// ============================================================

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
      <p className="text-xs text-gray-500">
        {from}–{to} dari {total.toLocaleString('id-ID')}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-surface-border hover:bg-surface disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {/* Page numbers (show up to 5) */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'border border-surface-border hover:bg-surface text-gray-600'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-surface-border hover:bg-surface disabled:opacity-40 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Step Indicator (for RFQ wizard)
// ============================================================

export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const step   = i + 1;
        const done   = step < current;
        const active = step === current;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done   ? 'bg-green-500 text-white'
                  : active ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                  : 'bg-surface border-2 border-surface-border text-gray-400'
                }`}
              >
                {done ? '✓' : step}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${active ? 'text-brand-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-1 mb-5 transition-all ${done ? 'bg-green-400' : 'bg-surface-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================
// Info Banner
// ============================================================

export function Banner({
  type = 'info',
  children,
  onClose,
}: {
  type?: 'info' | 'warning' | 'success' | 'error';
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const styles = {
    info:    'bg-brand-50 border-brand-200 text-brand-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    error:   'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${styles[type]}`}>
      <div className="flex-1 text-sm">{children}</div>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 flex-shrink-0 mt-0.5">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
