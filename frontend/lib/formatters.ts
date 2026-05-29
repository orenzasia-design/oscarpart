export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp -';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

export const STATUS_LABELS: Record<string, string> = {
  pending:    'Menunggu Review',
  approved:   'Disetujui',
  rejected:   'Ditolak',
  suspended:  'Disuspend',
  draft:      'Draft',
  submitted:  'Terkirim',
  processing: 'Diproses',
  quoted:     'Dikutip',
  closed:     'Selesai',
  cancelled:  'Dibatalkan',
  new:        'Baru',
  contacted:  'Dihubungi',
  qualified:  'Qualified',
  won:        'Menang',
  lost:       'Kalah',
};

export const STATUS_BADGE: Record<string, string> = {
  pending:    'badge-yellow',
  approved:   'badge-green',
  rejected:   'badge-red',
  suspended:  'badge-red',
  draft:      'badge-gray',
  submitted:  'badge-blue',
  processing: 'badge-yellow',
  quoted:     'badge-green',
  closed:     'badge-gray',
  new:        'badge-blue',
  contacted:  'badge-yellow',
  qualified:  'badge-green',
  won:        'badge-green',
  lost:       'badge-gray',
};
