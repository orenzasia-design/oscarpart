'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Tipe data untuk part SANY
type SanyPart = {
  part_number: string;
  brand: string;
  unit_type: string;
  description: string;
  stock_quantity: string;
  price: string | null;
};

export default function HomePage() {
  const [sanyParts, setSanyParts] = useState<SanyPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ambil data dari backend saat halaman dimuat
  useEffect(() => {
    async function fetchSanyReadyStock() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oscarpart-production.up.railway.app/api/v1';
        const res = await fetch(`${apiUrl}/parts/sany-ready-stock`);
        const json = await res.json();
        
        if (json.success && json.data) {
          // Filter part yang punya price > 0 (hilangkan yang price null atau 0)
          const filtered = json.data.filter((part: SanyPart) => part.price && parseFloat(part.price) > 0);
          setSanyParts(filtered);
        } else {
          setError('Gagal memuat data');
        }
      } catch (err) {
        setError('Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSanyReadyStock();
  }, []);

  // Format harga ke Rupiah
  const formatPrice = (price: string | null) => {
    if (!price) return 'Hubungi CS';
    const num = parseFloat(price);
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-blue-600 text-lg">OscarPart</span>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md hover:bg-gray-100 transition">
              Login
            </Link>
            <Link href="/register" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section (opsional, biarkan seperti aslinya jika sudah ada) */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">OscarPart</h1>
          <p className="text-lg md:text-xl">Sparepart Heavy Equipment Berkualitas</p>
        </div>
      </section>

      {/* SANY Ready Stock Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">🇨🇳 SANY Ready Stock</h2>
          <p className="text-gray-600">Part original SANY dengan stok tersedia, harga kompetitif</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : sanyParts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Belum ada part SANY ready stock</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sanyParts.map((part) => (
              <div key={part.part_number} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-5 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded">Ready Stock</span>
                  <span className="text-xs text-gray-500">{part.unit_type}</span>
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{part.part_number}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{part.description || '-'}</p>
                <div className="flex justify-between items-center border-t pt-3 mt-2">
                  <div>
                    <p className="text-xs text-gray-500">Stok</p>
                    <p className="font-semibold">{parseFloat(part.stock_quantity).toFixed(0)} pcs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Harga</p>
                    <p className="font-bold text-blue-600">{formatPrice(part.price)}</p>
                  </div>
                </div>
                <Link 
                  href={`/parts/${part.part_number}`} 
                  className="mt-4 block text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Detail & RFQ
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer sederhana */}
      <footer className="bg-gray-800 text-white py-6 text-center text-sm">
        © {new Date().getFullYear()} OscarPart. All rights reserved.
      </footer>
    </main>
  );
}
