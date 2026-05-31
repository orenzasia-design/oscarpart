'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileSpreadsheet, ShieldCheck, Zap, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── NAV ── */}
      <nav className="bg-brand-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <span className="text-xl font-black tracking-widest">OSCARPART</span>
              <span className="hidden sm:inline text-xs ml-2 opacity-70">Mining Parts &amp; Equipment</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="text-sm opacity-90 hover:opacity-100 hidden sm:block">
                Daftar
              </Link>
              <Link href="/login" className="bg-white text-brand-600 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Zap size={14} className="text-yellow-300" />
            <span>100.000+ Part Number Tersedia</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
            Spare Part &amp; Equipment<br />
            <span className="text-yellow-300">Tambang Terpercaya</span>
          </h1>
          <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto">
            Cari part number Anda secara instan. Caterpillar, Komatsu, Hitachi, Volvo dan 20+ brand tersedia.
            Kirim RFQ dalam hitungan menit.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-xl px-4 py-3">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan part number, contoh: 1R-0750, HMK15V..."
                  className="flex-1 text-gray-800 text-sm outline-none bg-transparent placeholder-gray-400"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={searchQuery.trim().length < 2}
                className="bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Cari Part
              </button>
            </div>
          </form>

          <p className="text-xs opacity-60 mt-3">
            Login untuk melihat harga dan stok lengkap.{' '}
            <Link href="/register" className="underline opacity-100 hover:text-yellow-300">
              Daftar gratis →
            </Link>
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">
            Kenapa memilih OSCARPART?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search size={28} className="text-brand-600" />,
                title: 'Pencarian Instan',
                desc: 'Database 100.000+ part number dengan fuzzy search. Temukan part meski ada typo.',
              },
              {
                icon: <FileSpreadsheet size={28} className="text-brand-600" />,
                title: 'Upload RFQ via Excel',
                desc: 'Upload file XLSX/CSV dengan ratusan item. Sistem otomatis mencocokkan dan menghitung.',
              },
              {
                icon: <ShieldCheck size={28} className="text-brand-600" />,
                title: 'Harga Terlindungi',
                desc: 'Harga hanya tersedia untuk customer terdaftar & terverifikasi. Data selalu aman.',
              },
            ].map((f) => (
              <div key={f.title} className="card hover:shadow-lg transition-shadow">
                <div className="mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Cara Kerja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Daftar Akun',         desc: 'Isi data perusahaan Anda. Proses approval cepat.' },
              { step: '02', title: 'Cari Part',           desc: 'Ketik part number atau upload file Excel.' },
              { step: '03', title: 'Buat RFQ',            desc: 'Tambahkan ke keranjang, isi detail project.' },
              { step: '04', title: 'Kirim via WhatsApp',  desc: 'Quotation dikirim ke tim sales kami secara langsung.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden sm:block absolute top-5 left-full w-full h-0.5 bg-brand-200 -z-0" />
                )}
                <div className="card text-center relative z-10">
                  <div className="text-3xl font-black text-brand-200 mb-2">{s.step}</div>
                  <h4 className="font-bold text-gray-800 mb-1 text-sm">{s.title}</h4>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2">
              Mulai Sekarang <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── RFQ CTA ── */}
      <section className="py-16 px-4 bg-brand-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Punya list part dalam Excel?</h2>
          <p className="opacity-80 mb-6">
            Upload file XLSX atau CSV Anda sekarang. Kami akan mencocokkan setiap part number dan mengirimkan penawaran harga.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/rfq" className="bg-white text-brand-600 font-semibold px-6 py-3 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-2">
              <FileSpreadsheet size={18} /> Upload RFQ Sekarang
            </Link>
            <Link href="/rfq/template" className="border border-white/40 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              Download Template Excel
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-brand-900 text-white py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-black text-xl tracking-widest mb-3">OSCARPART</div>
            <p className="text-sm opacity-60 leading-relaxed">Mining Parts &amp; Equipment Specialist. Melayani kebutuhan spare part alat berat pertambangan sejak bertahun-tahun.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Navigasi</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li><Link href="/search" className="hover:opacity-100">Cari Part</Link></li>
              <li><Link href="/rfq" className="hover:opacity-100">Buat RFQ</Link></li>
              <li><Link href="/register" className="hover:opacity-100">Daftar Akun</Link></li>
              <li><Link href="/login" className="hover:opacity-100">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Kontak</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li className="flex items-center gap-2"><Phone size={14} /> +62 888-020-32033</li>
              <li className="flex items-center gap-2"><Mail size={14} /> orenzasia@gmail.com</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Jakarta Selatan,DKI Jakarta</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/10 text-xs opacity-40 text-center">
          © {new Date().getFullYear()} OSCARPART. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
