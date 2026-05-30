'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { adminApi } from '@/lib/api-client';
import { formatIDR, formatNumber } from '@/lib/formatters';
import { AdminShell } from '../AdminShell';
import toast from 'react-hot-toast';
import { Search, Upload, Plus, ChevronLeft, ChevronRight, Package } from 'lucide-react';

interface Part {
  id:                string;
  part_number:       string;
  description:       string | null;
  brand_name:        string | null;
  unit_type:         string | null;
  stock_quantity:    number;
  unit_price:        number | null;
  warehouse_location:string | null;
  status:            string;
  updated_at:        string;
}

export default function AdminPartsPage() {
  const [parts, setParts]       = useState<Part[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult]   = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const limit = 50;

  const loadParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.parts({ page, limit, search: search || undefined });
      setParts(res.data.data.parts);
      setTotal(res.data.data.pagination.total);
    } catch {
      toast.error('Gagal memuat data parts.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadParts(); }, [loadParts]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const buffer  = await file.arrayBuffer();
      const wb      = XLSX.read(buffer, { type: 'buffer' });
      const ws      = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

      const rows = rawRows.map((r) => ({
        part_number:        String(r['part_number'] || r['Part Number'] || r['PART_NUMBER'] || '').toUpperCase().trim(),
        description:        String(r['description'] || r['Description'] || '').trim() || undefined,
        brand_name:         String(r['brand'] || r['Brand'] || r['brand_name'] || '').trim() || undefined,
        unit_type:          String(r['unit_type'] || r['unit'] || r['Unit'] || '').trim() || undefined,
        stock_quantity:     parseFloat(String(r['stock_quantity'] || r['stock'] || r['Stock'] || '0')) || 0,
        unit_price:         parseFloat(String(r['unit_price'] || r['price'] || r['Price'] || '0')) || undefined,
        warehouse_location: String(r['warehouse_location'] || r['warehouse'] || '').trim() || undefined,
      })).filter((r) => r.part_number.length >= 2);

      if (rows.length === 0) {
        toast.error('Tidak ada data valid. Pastikan kolom "part_number" ada.');
        return;
      }

      const res = await adminApi.bulkImportParts(rows);
      setImportResult(res.data.data);
      toast.success(`${res.data.data.imported} part berhasil diimport.`);
      loadParts();
    } catch (err) {
      toast.error('Gagal import: ' + String(err));
    } finally {
      setImportLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminShell title="Database Part">
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex items-center gap-2 bg-white border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-0 max-w-sm shadow-card">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari part number, deskripsi, brand..."
            className="bg-transparent text-sm outline-none flex-1 min-w-0"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importLoading}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Upload size={15} />
          {importLoading ? 'Mengimport...' : 'Import XLSX'}
        </button>

        <span className="text-sm text-gray-500 ml-auto">{formatNumber(total)} part</span>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`card mb-4 ${importResult.errors.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{importResult.imported} part berhasil diimport.</p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 text-xs text-yellow-700 space-y-0.5 max-h-24 overflow-y-auto">
                  {importResult.errors.map((e, i) => <li key={i}>� {e}</li>)}
                </ul>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-4">�</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-surface-border">
              <tr>
                <th className="table-header px-4 py-3 text-left">Part Number</th>
                <th className="table-header px-4 py-3 text-left">Deskripsi</th>
                <th className="table-header px-4 py-3 text-left">Brand</th>
                <th className="table-header px-4 py-3 text-center">Unit</th>
                <th className="table-header px-4 py-3 text-right">Stok</th>
                <th className="table-header px-4 py-3 text-right">Harga</th>
                <th className="table-header px-4 py-3 text-left">Gudang</th>
                <th className="table-header px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Memuat...</td></tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Belum ada data part. Import file XLSX untuk mulai.</p>
                  </td>
                </tr>
              ) : parts.map((part) => (
                <tr key={part.id} className="hover:bg-surface transition-colors">
                  <td className="table-cell">
                    <span className="font-mono font-bold text-brand-600 text-xs">{part.part_number}</span>
                  </td>
                  <td className="table-cell">
                    <p className="text-xs text-gray-600 max-w-48 truncate">{part.description || '-'}</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs">{part.brand_name || '-'}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className="text-xs text-gray-500">{part.unit_type || '-'}</span>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`text-sm font-semibold ${part.stock_quantity > 0 ? 'text-green-700' : 'text-red-500'}`}>
                      {formatNumber(part.stock_quantity)}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <span className="text-sm price-field">{formatIDR(part.unit_price)}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-xs text-gray-500">{part.warehouse_location || '-'}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${part.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                      {part.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <p className="text-xs text-gray-500">Halaman {page} dari {totalPages} ({formatNumber(total)} total part)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-surface-border disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-surface-border disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
