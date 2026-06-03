'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Part = {
  part_number: string;
  brand_name: string;
  unit_type: string;
  description: string;
  stock_quantity: string;
  unit_price: string | null;
};

type FormData = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  quantity: string;
  notes: string;
};

export default function PartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const partId = params?.id as string;

  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    quantity: '1',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const [submitError, setSubmitError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oscarpart-production.up.railway.app/api/v1';

  // Ambil detail part berdasarkan part_number
  useEffect(() => {
    if (!partId) return;

    async function fetchPart() {
      try {
        const res = await fetch(`${API_URL}/parts/sany-ready-stock`);
        const json = await res.json();

        if (json.success && json.data) {
          const found = json.data.find(
            (p: Part) => p.part_number === decodeURIComponent(partId)
          );
          if (found) {
            setPart(found);
          } else {
            setError('Part tidak ditemukan');
          }
        } else {
          setError('Gagal memuat data part');
        }
      } catch {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    }

    fetchPart();
  }, [partId]);

  const formatPrice = (price: string | null) => {
    if (!price) return 'Hubungi CS';
    const num = parseFloat(price);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        notes: form.notes,
        items: [
          {
            part_number: part?.part_number,
            qty_requested: parseInt(form.quantity),
          },
        ],
      };

      const res = await fetch(`${API_URL}/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        setSubmitSuccess(true);
        setRfqNumber(json.data?.rfq_number || json.data?.id || 'RFQ-OK');
      } else {
        setSubmitError(json.message || 'Gagal mengirim RFQ, coba lagi.');
      }
    } catch {
      setSubmitError('Terjadi kesalahan jaringan, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Memuat data part...</p>
        </div>
      </div>
    );
  }

  if (error || !part) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Part tidak ditemukan'}</p>
          <Link href="/" className="text-blue-600 underline">← Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Tombol kembali */}
        <Link href="/" className="text-blue-600 text-sm hover:underline mb-6 inline-block">
          ← Kembali ke Beranda
        </Link>

        {/* Card Detail Part */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">Ready Stock</span>
            <span className="text-xs text-gray-500">{part.unit_type}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{part.part_number}</h1>
          <p className="text-gray-500 text-sm mb-4">{part.brand_name}</p>
          <p className="text-gray-700 mb-4">{part.description || '-'}</p>
          <div className="flex justify-between items-center border-t pt-4">
            <div>
              <p className="text-xs text-gray-500">Stok Tersedia</p>
              <p className="font-semibold text-gray-800">{parseFloat(part.stock_quantity).toFixed(0)} pcs</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Harga</p>
              <p className="font-bold text-blue-600 text-xl">{formatPrice(part.unit_price)}</p>
            </div>
          </div>
        </div>

        {/* Form RFQ atau Pesan Sukses */}
        {submitSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-2">RFQ Berhasil Dikirim!</h2>
            <p className="text-green-700 mb-2">Nomor RFQ Anda:</p>
            <p className="text-2xl font-bold text-green-900 mb-4">{rfqNumber}</p>
            <p className="text-sm text-gray-600 mb-6">
              Tim kami akan menghubungi Anda segera. Konfirmasi juga dikirim ke email Anda.
            </p>
            <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
              Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Form Request for Quotation</h2>
            <p className="text-sm text-gray-500 mb-6">Isi form di bawah untuk meminta penawaran harga resmi</p>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="customer_email"
                  value={form.customer_email}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: budi@perusahaan.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp *</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 08123456789"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (pcs) *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Contoh: Butuh untuk unit SANY SY215C, segera"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Info part yang di-request (read-only) */}
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600 border border-gray-200">
                <p><span className="font-medium">Part:</span> {part.part_number}</p>
                <p><span className="font-medium">Deskripsi:</span> {part.description || '-'}</p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Mengirim...' : '📩 Kirim Request Penawaran'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
