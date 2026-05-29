# OSCARPART — Panduan Embed Widget

Widget Parts List & Quotation Builder yang dapat di-embed di website atau landing page manapun.

---

## Metode 1: iframe (Paling Mudah ⚡)

Cukup copy-paste kode berikut ke halaman HTML Anda:

```html
<!-- Letakkan di mana Anda ingin widget muncul -->
<iframe
  src="https://app.oscarpart.id/embed/oscarpart-widget.html"
  style="width:100%; min-height:700px; border:none; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.10);"
  title="OSCARPART Parts & Quotation"
  loading="lazy"
></iframe>
```

**Cocok untuk:** WordPress, Wix, Webflow, landing page statis, atau website apapun.

---

## Metode 2: Script Embed (Lebih Fleksibel)

```html
<!-- 1. Letakkan container di posisi yang diinginkan -->
<div id="oscarpart-rfq"></div>

<!-- 2. Konfigurasi (opsional) — letakkan SEBELUM script -->
<script>
  window.OSCARPART_CONFIG = {
    apiUrl:      'https://api.oscarpart.id/api/v1',  // URL API backend Anda
    waNumber:    '6281234567890',                    // Nomor WA bisnis (tanpa +)
    containerId: 'oscarpart-rfq',                   // ID container target
    widgetUrl:   'https://app.oscarpart.id/embed/oscarpart-widget.html',
  };
</script>

<!-- 3. Load script -->
<script src="https://app.oscarpart.id/embed/oscarpart-embed.js" defer></script>
```

---

## Metode 3: Next.js / React App Embedding

Jika Anda menggunakan Next.js, gunakan halaman `/widget` yang sudah tersedia:

```
https://app.oscarpart.id/widget
```

Atau embed langsung di komponen React:

```tsx
export default function LandingPage() {
  return (
    <section id="rfq">
      <h2>Buat Permintaan Penawaran</h2>
      <iframe
        src="/widget"
        style={{ width: '100%', minHeight: '700px', border: 'none' }}
        title="OSCARPART RFQ"
      />
    </section>
  );
}
```

---

## Konfigurasi Widget

### Ubah API URL

Edit di widget HTML atau kirim via URL params:

```
/embed/oscarpart-widget.html?apiUrl=https://api.oscarpart.id/api/v1&waNumber=6281234567890
```

Atau set global variable sebelum load widget:

```html
<script>
  window.OSCARPART_API_URL = 'https://api.oscarpart.id/api/v1';
  window.OSCARPART_WA     = '6281234567890';
</script>
```

### File yang Tersedia

| File | Lokasi | Keterangan |
|------|--------|------------|
| Widget HTML | `/embed/oscarpart-widget.html` | Standalone widget (full HTML/CSS/JS) |
| Embed Script | `/embed/oscarpart-embed.js`   | Script untuk embed via div container |
| Widget Route | `/widget`                     | Next.js route untuk embed via iframe |

---

## Fitur Widget

| Fitur | Keterangan |
|-------|------------|
| ✏️ **Input Manual** | Ketik part number satu per satu, cek ketersediaan real-time |
| 📊 **Upload Excel/CSV** | Upload file, sistem cocokkan otomatis |
| 🛒 **Keranjang Part** | Edit qty, hapus item, lihat status ketersediaan |
| 📋 **Form Perusahaan** | Validasi real-time, 7 field utama |
| 💬 **WhatsApp Integration** | Generate pesan RFQ otomatis, siap kirim |
| 🔌 **Offline Fallback** | Tetap berfungsi meski API tidak tersedia |
| 📱 **Responsive** | Optimal di desktop dan mobile |

---

## Alur Pengguna

```
Langkah 1: Daftar Part
  ├── Tab Manual: ketik part number → cek database → tambah ke cart
  └── Tab Upload: drag & drop Excel/CSV → parse otomatis → tampilkan hasil

Langkah 2: Info Perusahaan
  └── Isi form: nama, PIC, jabatan, email, WA, project, lokasi, catatan

Langkah 3: Kirim RFQ
  └── Redirect ke WhatsApp dengan pesan lengkap yang sudah terisi
```

---

## Customisasi Tampilan

Widget menggunakan CSS variables. Override di parent page:

```html
<style>
  /* Ubah warna utama */
  :root {
    --brand:       #1a3a5c;  /* Biru OSCARPART */
    --accent:      #c0392b;  /* Merah aksen */
    --gold:        #f39c12;  /* Kuning aksen */
  }
</style>
```

> **Note:** CSS variables hanya bekerja di Metode 2 (Script Embed). Untuk iframe, tampilan tidak bisa diubah dari parent.

---

## Troubleshooting

**Widget tidak muncul:**
- Pastikan `id="oscarpart-rfq"` ada di HTML Anda (Metode 2)
- Cek console browser untuk error

**Upload file tidak berfungsi:**
- Pastikan CORS sudah dikonfigurasi di backend untuk domain Anda
- Cek `nginx.conf` — tambahkan domain Anda ke `Access-Control-Allow-Origin`

**WhatsApp URL terlalu panjang:**
- Terjadi jika ada 50+ part items. Pesan akan terpotong otomatis oleh WhatsApp.
- Solusi: bagi RFQ menjadi beberapa batch, masing-masing max 30 item.

**API offline / CORS error:**
- Widget memiliki fallback mode: tetap bisa generate RFQ number lokal dan WhatsApp URL
- Semua data terisi dari input user, tidak perlu koneksi ke server

---

## Contoh Implementasi

### WordPress (via HTML Block)

```html
<!-- Di Gutenberg: tambahkan blok "HTML Kustom" -->
<div style="max-width:960px;margin:0 auto;padding:20px 0;">
  <iframe
    src="https://app.oscarpart.id/embed/oscarpart-widget.html"
    style="width:100%;min-height:720px;border:none;border-radius:12px;"
    title="OSCARPART Parts & Quotation"
    loading="lazy"
  ></iframe>
</div>
```

### Webflow

1. Tambahkan **Embed component**
2. Paste kode iframe di atas
3. Publish

### Landing Page HTML Statis

```html
<!-- Section RFQ di landing page -->
<section id="rfq" style="background:#f5f7fa;padding:60px 20px;">
  <div style="max-width:960px;margin:0 auto;">
    <h2 style="text-align:center;margin-bottom:32px;">Buat Permintaan Penawaran</h2>
    <iframe
      src="https://app.oscarpart.id/embed/oscarpart-widget.html"
      style="width:100%;min-height:700px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.10);"
      title="OSCARPART RFQ"
      loading="lazy"
    ></iframe>
  </div>
</section>
```

---

© OSCARPART. All rights reserved.
