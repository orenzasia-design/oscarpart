'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search, Upload, Download, Plus, ArrowRight, ArrowLeft,
  Send, MessageCircle, CheckCircle, FileSpreadsheet, X
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { rfqApi, partsApi } from '@/lib/api-client';
import { useAuth } from '../../../lib/auth-context';
import { formatIDR } from '../../../lib/formatters';
import { StepIndicator, Spinner, Banner } from '../../../components/ui/index';
import RfqCart, { CartItem } from '../../../components/rfq/RfqCart';
import toast from 'react-hot-toast';

// ============================================================
// Types
// ============================================================

interface Financials {
  subtotal: number; tax_rate: number; tax_amount: number; grand_total: number;
}

interface RfqDraft { id: string; rfq_number: string; }

const customerSchema = z.object({
  company_name:      z.string().min(2, 'Wajib diisi'),
  contact_person:    z.string().min(2, 'Wajib diisi'),
  position:          z.string().min(2, 'Wajib diisi'),
  email:             z.string().email('Format email tidak valid'),
  whatsapp:          z.string().min(8, 'Nomor tidak valid'),
  project_name:      z.string().min(2, 'Wajib diisi'),
  delivery_location: z.string().min(2, 'Wajib diisi'),
  notes:             z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

const STEPS = ['Buat Daftar Part', 'Info Pengiriman', 'Kirim RFQ'];

// ============================================================
// Main Component
// ============================================================

export default function RfqPage() {
  const { user, isApproved } = useAuth();
  const router = useRouter();

  const [step, setStep]             = useState(1);
  const [rfqDraft, setRfqDraft]     = useState<RfqDraft | null>(null);
  const [items, setItems]           = useState<CartItem[]>([]);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [submittedRfqNumber, setSubmittedRfqNumber] = useState('');

  // Manual add state
  const [manualPn, setManualPn]     = useState('');
  const [searching, setSearching]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name:   user?.company_name || '',
      contact_person: user?.full_name    || '',
    },
  });

  // Pre-fill from user profile if logged in
  // Already handled by defaultValues above

  // Load prefill dari search page jika ada
  useEffect(() => {
    const prefill = sessionStorage.getItem('rfq_prefill');
    if (prefill) {
      try {
        const parsed = JSON.parse(prefill);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed.map((p: any) => ({
            part_number: p.part_number,
            description: p.description || '',
            brand: p.brand || '',
            unit_type: p.unit_type || '',
            qty_requested: p.qty_requested || 1,
          })));
          toast.success(`${parsed.length} part dimuat dari halaman pencarian`);
        }
      } catch { /* ignore */ }
      sessionStorage.removeItem('rfq_prefill');
    }
  }, []);

  // ── Ensure draft exists ──────────────────────────────────

  const ensureDraft = useCallback(async (): Promise<RfqDraft> => {
    if (rfqDraft) return rfqDraft;
    const res  = await rfqApi.createDraft();
    const draft = res.data.data as RfqDraft;
    setRfqDraft(draft);
    return draft;
  }, [rfqDraft]);

  // ── Manual part add ──────────────────────────────────────

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const pn = manualPn.trim().toUpperCase();
    if (!pn || pn.length < 2) return;

    if (items.find((i) => i.part_number === pn)) {
      toast.error('Part sudah ada di daftar.');
      return;
    }

    setSearching(true);
    try {
      const res  = await partsApi.search(pn);
      const data = res.data.data;
      const part = data.parts?.[0];

      const newItem: CartItem = {
        part_number:        pn,
        description:        part?.description || null,
        brand:              part?.brand_name  || null,
        unit_type:          part?.unit_type   || null,
        qty_requested:      1,
        unit_price_at_time: (part as { unit_price?: number })?.unit_price ?? null,
        line_total:         null,
        stock_available:    (part as { stock_quantity?: number })?.stock_quantity ?? null,
        match_status:       data.found ? 'matched' : 'unmatched',
      };

      const newItems = [...items, newItem];
      setItems(newItems);
      setManualPn('');
      toast.success(data.found ? `${pn} ditemukan ✓` : `${pn} ditambahkan (perlu konfirmasi)`);

      // Sync to backend draft if exists
      if (rfqDraft) {
        syncItemsToBackend(rfqDraft.id, newItems);
      }
    } catch {
      toast.error('Pencarian gagal.');
    } finally {
      setSearching(false);
    }
  };

  // ── File upload ──────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res  = await rfqApi.uploadFile(formData);
      const data = res.data.data;

      setRfqDraft({ id: data.rfq_id, rfq_number: data.rfq_number });

      // Map resolved items to CartItem format
      const newItems: CartItem[] = data.items.map((i: Record<string, unknown>) => ({
        part_number:        i.part_number as string,
        description:        i.description as string | null,
        brand:              i.brand       as string | null,
        unit_type:          i.unit_type   as string | null,
        qty_requested:      i.qty_requested as number,
        unit_price_at_time: i.unit_price_at_time as number | null,
        line_total:         i.line_total as number | null,
        stock_available:    i.stock_available as number | null,
        match_status:       i.match_status as 'matched' | 'unmatched',
      }));

      setItems(newItems);
      recalcFinancials(newItems);

      toast.success(
        `${data.parse.matched} part ditemukan, ${data.parse.unmatched} perlu konfirmasi.`
      );

      if (data.parse.errors?.length > 0) {
        toast(`⚠ ${data.parse.errors.length} baris dilewati (lihat format file)`, { icon: '⚠️' });
      }
    } catch {
      toast.error('Upload gagal. Pastikan format file XLSX/CSV.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ── Qty / remove ─────────────────────────────────────────

  const handleQtyChange = useCallback((pn: string, qty: number) => {
    setItems((prev) => {
      const updated = prev.map((i) => {
        if (i.part_number !== pn) return i;
        const lineTotal = i.unit_price_at_time !== null ? i.unit_price_at_time * qty : null;
        return { ...i, qty_requested: qty, line_total: lineTotal };
      });
      recalcFinancials(updated);
      return updated;
    });
  }, []);

  const handleRemove = useCallback((pn: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.part_number !== pn);
      recalcFinancials(updated);
      return updated;
    });
  }, []);

  // ── Financial recalc (client-side preview) ───────────────

  const recalcFinancials = (currentItems: CartItem[]) => {
    if (!isApproved) return;
    const subtotal  = currentItems.reduce((s, i) => s + (i.line_total || 0), 0);
    const taxRate   = 11;
    const taxAmount = parseFloat((subtotal * 0.11).toFixed(0));
    setFinancials({ subtotal, tax_rate: taxRate, tax_amount: taxAmount, grand_total: subtotal + taxAmount });
  };

  // ── Sync items to backend ─────────────────────────────────

  const syncItemsToBackend = async (draftId: string, currentItems: CartItem[]) => {
    try {
      await rfqApi.updateItems(
        draftId,
        currentItems.map((i) => ({
          part_number:   i.part_number,
          description:   i.description,
          brand:         i.brand,
          unit_type:     i.unit_type,
          qty_requested: i.qty_requested,
        }))
      );
    } catch { /* silent — will retry on submit */ }
  };

  // ── Step 1 → 2 ───────────────────────────────────────────

  const goToStep2 = async () => {
    if (items.length === 0) {
      toast.error('Tambahkan minimal 1 part sebelum melanjutkan.');
      return;
    }
    setLoading(true);
    try {
      const draft = await ensureDraft();
      await rfqApi.updateItems(
        draft.id,
        items.map((i) => ({
          part_number: i.part_number, description: i.description,
          brand: i.brand, unit_type: i.unit_type, qty_requested: i.qty_requested,
        }))
      );
      setStep(2);
      window.scrollTo(0, 0);
    } catch {
      toast.error('Gagal menyimpan daftar part. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3 (Submit) ──────────────────────────────────

  const onSubmit = async (formData: CustomerForm) => {
    if (!rfqDraft) {
      toast.error('Sesi RFQ hilang. Mulai ulang.');
      return;
    }
    setLoading(true);
    try {
      const res = await rfqApi.submit(rfqDraft.id, formData);
      const data = res.data.data;
      setWhatsappUrl(data.whatsapp_url);
      setSubmittedRfqNumber(data.rfq.rfq_number);
      setStep(3);
      window.scrollTo(0, 0);
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      if (code === 'RFQ_ALREADY_SUBMITTED') toast.error('RFQ ini sudah dikirim sebelumnya.');
      else toast.error('Gagal mengirim RFQ. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await rfqApi.downloadTemplate();
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'OSCARPART-RFQ-Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { toast.error('Gagal download template.'); }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav */}
      <nav className="bg-brand-600 text-white h-14 flex items-center px-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto w-full flex items-center gap-4">
          <Link href="/" className="font-black text-lg tracking-widest">OSCARPART</Link>
          <span className="text-white/40 hidden sm:block">|</span>
          <span className="text-sm text-white/80 hidden sm:block">Request for Quotation</span>
          <div className="ml-auto flex items-center gap-3">
            {!user && <Link href="/login" className="text-xs bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg">Login</Link>}
            {user && <span className="text-xs text-white/70">{user.full_name}</span>}
            <ThemeToggle className="opacity-80 hover:opacity-100" />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <StepIndicator steps={STEPS} current={step} />

        {/* ── STEP 1: Build Items ─────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadTemplate}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Download size={15} /> Download Template Excel
              </button>

              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {uploading ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Upload size={15} />}
                {uploading ? 'Memproses file...' : 'Upload Excel / CSV'}
              </button>
            </div>

            {!isApproved && (
              <Banner type="info">
                <strong>Harga hanya untuk customer terverifikasi.</strong>{' '}
                {!user ? (
                  <><Link href="/register" className="underline font-semibold">Daftar sekarang</Link> atau <Link href="/login" className="underline font-semibold">login</Link> untuk lihat harga dan stok lengkap.</>
                ) : (
                  <>Akun Anda sedang dalam review. Anda tetap bisa mengirim RFQ.</>
                )}
              </Banner>
            )}

            {/* Manual add */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Tambah Part Manual</h3>
              <form onSubmit={handleManualAdd} className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 border border-surface-border rounded-lg px-3 py-2.5 bg-white focus-within:ring-2 focus-within:ring-brand-400">
                  <Search size={15} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={manualPn}
                    onChange={(e) => setManualPn(e.target.value)}
                    placeholder="Ketik part number, Enter untuk tambah..."
                    className="flex-1 text-sm outline-none bg-transparent"
                    autoComplete="off"
                  />
                  {manualPn && (
                    <button type="button" onClick={() => setManualPn('')} className="text-gray-300 hover:text-gray-500">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button type="submit" disabled={searching || manualPn.trim().length < 2} className="btn-primary flex items-center gap-2 text-sm px-4">
                  {searching ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Plus size={15} />}
                  Tambah
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-2">Bisa tambah banyak part satu per satu, atau upload semua sekaligus via Excel.</p>
            </div>

            {/* Cart */}
            <RfqCart
              items={items}
              financials={financials}
              showPrices={isApproved}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              isApproved={isApproved}
            />

            {/* Continue button */}
            <div className="flex justify-between items-center">
              <Link href="/search" className="btn-secondary flex items-center gap-2 text-sm">
                <ArrowLeft size={15} /> Cari Part
              </Link>
              <button
                onClick={goToStep2}
                disabled={loading || items.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : null}
                Lanjutkan ({items.length} part) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Customer Info ───────────────────────────── */}
        {step === 2 && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="card">
                  <h2 className="section-title mb-5">Informasi Perusahaan & Project</h2>
                  <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { name: 'company_name',      label: 'Nama Perusahaan *',     placeholder: 'PT Contoh Mining' },
                        { name: 'contact_person',    label: 'Nama PIC *',            placeholder: 'Nama kontak Anda' },
                        { name: 'position',          label: 'Jabatan *',             placeholder: 'Procurement Manager' },
                        { name: 'email',             label: 'Email *',               placeholder: 'email@perusahaan.com' },
                        { name: 'whatsapp',          label: 'Nomor WhatsApp *',      placeholder: '6281234567890' },
                        { name: 'project_name',      label: 'Nama Project *',        placeholder: 'Overburden Removal Q3 2026' },
                        { name: 'delivery_location', label: 'Lokasi Pengiriman *',   placeholder: 'Pit A, Kutai Kartanegara' },
                      ].map(({ name, label, placeholder }) => (
                        <div key={name} className={name === 'delivery_location' || name === 'project_name' ? 'sm:col-span-2' : ''}>
                          <label className="label">{label}</label>
                          <input
                            {...register(name as keyof CustomerForm)}
                            placeholder={placeholder}
                            className={`input ${errors[name as keyof CustomerForm] ? 'border-red-400' : ''}`}
                          />
                          {errors[name as keyof CustomerForm] && (
                            <p className="text-xs text-red-500 mt-1">{errors[name as keyof CustomerForm]?.message}</p>
                          )}
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <label className="label">Catatan Tambahan</label>
                        <textarea
                          {...register('notes')}
                          rows={3}
                          placeholder="Urgensi, tanggal butuh, kondisi khusus, dll..."
                          className="input resize-none"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Summary Sidebar */}
              <div className="space-y-4">
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">Ringkasan RFQ</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Part</span>
                      <span className="font-semibold">{items.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ditemukan</span>
                      <span className="font-semibold text-green-600">{items.filter(i => i.match_status === 'matched').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Perlu konfirmasi</span>
                      <span className="font-semibold text-yellow-600">{items.filter(i => i.match_status !== 'matched').length}</span>
                    </div>
                    {financials && financials.subtotal > 0 && (
                      <>
                        <div className="border-t border-surface-border pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="price-field font-medium">{formatIDR(financials.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">PPN 11%</span>
                            <span className="price-field font-medium">{formatIDR(financials.tax_amount)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-brand-700 text-base mt-1">
                            <span>Grand Total</span>
                            <span className="price-field">{formatIDR(financials.grand_total)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="card bg-brand-50 border-brand-100 text-sm text-brand-700">
                  <p className="font-semibold mb-1">Setelah Submit:</p>
                  <p className="text-xs opacity-80">Anda akan diarahkan ke WhatsApp untuk mengirim RFQ ini ke tim sales OSCARPART.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={15} /> Kembali
              </button>
              <button
                type="submit"
                form="customer-form"
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-8"
              >
                {loading ? <Spinner size="sm" className="border-white border-t-transparent" /> : <Send size={15} />}
                {loading ? 'Memproses...' : 'Kirim RFQ'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Success + WhatsApp ──────────────────────── */}
        {step === 3 && (
          <div className="max-w-lg mx-auto text-center">
            <div className="card py-10">
              <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">RFQ Berhasil Dikirim!</h2>
              <p className="text-gray-500 mb-1 text-sm">Nomor RFQ Anda:</p>
              <p className="font-mono text-xl font-black text-brand-600 mb-6">{submittedRfqNumber}</p>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
                <h4 className="font-semibold text-green-800 text-sm mb-1">Langkah Selanjutnya:</h4>
                <ol className="text-sm text-green-700 space-y-1">
                  <li>1. Klik tombol WhatsApp di bawah</li>
                  <li>2. Pesan sudah terisi otomatis — cukup tekan <strong>Kirim</strong></li>
                  <li>3. Tim sales kami akan memproses dan menghubungi Anda</li>
                </ol>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base w-full justify-center mb-3"
              >
                <MessageCircle size={22} />
                Kirim via WhatsApp Sekarang
              </a>

              <p className="text-xs text-gray-400 mb-6">
                WhatsApp akan terbuka dengan pesan yang sudah terisi. Tekan "Kirim" untuk menghubungi tim kami.
              </p>

              <div className="flex gap-3">
                <Link href="/search" className="btn-secondary flex-1 text-sm">Cari Part Lain</Link>
                {user && <Link href="/history" className="btn-secondary flex-1 text-sm">History RFQ</Link>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
