'use client';

import React from 'react';
import { Trash2, Plus, Minus, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { formatIDR } from '../../lib/formatters';

export interface CartItem {
  part_number:        string;
  description:        string | null;
  brand:              string | null;
  unit_type:          string | null;
  qty_requested:      number;
  unit_price_at_time: number | null;
  line_total:         number | null;
  stock_available:    number | null;
  match_status:       'matched' | 'unmatched' | 'partial';
}

interface FinancialSummary {
  subtotal:   number;
  tax_rate:   number;
  tax_amount: number;
  grand_total:number;
}

interface RfqCartProps {
  items:       CartItem[];
  financials:  FinancialSummary | null;
  showPrices:  boolean;
  onQtyChange: (partNumber: string, qty: number) => void;
  onRemove:    (partNumber: string) => void;
  isApproved:  boolean;
}

export default function RfqCart({
  items, financials, showPrices, onQtyChange, onRemove, isApproved,
}: RfqCartProps) {
  const matched   = items.filter((i) => i.match_status === 'matched');
  const unmatched = items.filter((i) => i.match_status !== 'matched');

  if (items.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📦</div>
        <p className="font-medium">Keranjang kosong</p>
        <p className="text-xs mt-1">Tambahkan part dari pencarian atau upload Excel</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matched items */}
      {matched.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <CheckCircle size={15} className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">{matched.length} part ditemukan dalam database</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-surface-border">
                <tr>
                  <th className="table-header px-4 py-2.5 text-left">Part Number</th>
                  <th className="table-header px-4 py-2.5 text-left hidden sm:table-cell">Deskripsi</th>
                  <th className="table-header px-4 py-2.5 text-left hidden md:table-cell">Brand</th>
                  <th className="table-header px-4 py-2.5 text-center hidden md:table-cell">Stok</th>
                  <th className="table-header px-4 py-2.5 text-center">Qty</th>
                  {showPrices && <th className="table-header px-4 py-2.5 text-right">Harga</th>}
                  {showPrices && <th className="table-header px-4 py-2.5 text-right">Total</th>}
                  <th className="table-header px-4 py-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {matched.map((item) => (
                  <tr key={item.part_number} className="hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-brand-600 text-xs">{item.part_number}</span>
                      <p className="text-xs text-gray-400 sm:hidden truncate max-w-28">{item.description || ''}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-gray-600 max-w-40 truncate">{item.description || '-'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs">{item.brand || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {item.stock_available !== null ? (
                        <span className={`text-xs font-semibold ${item.stock_available > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {item.stock_available > 0 ? item.stock_available : 'Habis'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onQtyChange(item.part_number, Math.max(1, item.qty_requested - 1))}
                          className="w-6 h-6 rounded border border-surface-border hover:bg-surface flex items-center justify-center transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.qty_requested}
                          onChange={(e) => onQtyChange(item.part_number, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 text-center text-sm font-semibold border border-surface-border rounded-lg py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                        />
                        <button
                          onClick={() => onQtyChange(item.part_number, item.qty_requested + 1)}
                          className="w-6 h-6 rounded border border-surface-border hover:bg-surface flex items-center justify-center transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </td>
                    {showPrices && (
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm price-field">
                          {item.unit_price_at_time !== null ? formatIDR(item.unit_price_at_time) : <span className="text-gray-400 text-xs">Konfirmasi</span>}
                        </span>
                      </td>
                    )}
                    {showPrices && (
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold price-field">
                          {item.line_total !== null ? formatIDR(item.line_total) : '—'}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onRemove(item.part_number)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors mx-auto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched items */}
      {unmatched.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
            <AlertCircle size={15} className="text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">
              {unmatched.length} part perlu konfirmasi stok
            </span>
            <span className="text-xs text-yellow-600">— tim kami akan menghubungi Anda</span>
          </div>
          <div className="divide-y divide-surface-border">
            {unmatched.map((item) => (
              <div key={item.part_number} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono font-semibold text-xs text-gray-600 flex-1">{item.part_number}</span>
                {item.description && <span className="text-xs text-gray-400 hidden sm:block flex-1 truncate">{item.description}</span>}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => onQtyChange(item.part_number, Math.max(1, item.qty_requested - 1))} className="w-6 h-6 rounded border border-surface-border hover:bg-surface flex items-center justify-center">
                    <Minus size={11} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{item.qty_requested}</span>
                  <button onClick={() => onQtyChange(item.part_number, item.qty_requested + 1)} className="w-6 h-6 rounded border border-surface-border hover:bg-surface flex items-center justify-center">
                    <Plus size={11} />
                  </button>
                </div>
                <button onClick={() => onRemove(item.part_number)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial summary */}
      {showPrices && financials && financials.subtotal > 0 ? (
        <div className="flex justify-end">
          <div className="w-72 card border-brand-100 bg-brand-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({matched.length} part)</span>
              <span className="font-medium price-field">{formatIDR(financials.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PPN {financials.tax_rate}%</span>
              <span className="font-medium price-field">{formatIDR(financials.tax_amount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-brand-200 pt-2">
              <span className="text-brand-700">Grand Total</span>
              <span className="text-brand-700 price-field">{formatIDR(financials.grand_total)}</span>
            </div>
            <p className="text-xs text-gray-400">*Harga belum termasuk ongkos kirim. {unmatched.length > 0 && `${unmatched.length} part dikonfirmasi terpisah.`}</p>
          </div>
        </div>
      ) : !isApproved && items.length > 0 ? (
        <div className="flex items-center gap-2 justify-end text-sm text-gray-400">
          <Lock size={13} /> Total harga hanya tersedia untuk customer terverifikasi
        </div>
      ) : null}
    </div>
  );
}
