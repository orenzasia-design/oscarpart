# OSCARPART Enterprise Platform

Platform pengadaan spare part dan equipment pertambangan berbasis web — dibangun untuk efisiensi procurement B2B di industri mining Indonesia.

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔍 **Part Search** | Pencarian instant 100k+ part number dengan fuzzy search (pg_trgm). Role-tiered: publik (nama part), registered (+ stok), approved (+ harga) |
| 📋 **RFQ Builder** | Wizard 3 langkah: manual/upload Excel → info perusahaan → kirim via WhatsApp |
| 📤 **Upload XLSX/CSV** | Parser cerdas dengan column alias detection. Cocokkan ratusan part sekaligus |
| 💬 **WhatsApp Integration** | Otomatis generate pesan RFQ lengkap ke WhatsApp Business |
| 🎯 **Lead CRM** | Setiap RFQ otomatis masuk pipeline CRM dengan status tracking |
| 📄 **PDF Generator** | Puppeteer — Surat penawaran harga profesional dengan watermark dinamis |
| 👥 **User Approval** | Sistem registrasi + approval admin. Email notifikasi otomatis |
| 📊 **Analytics** | Dashboard KPI, search trends, revenue pipeline, top customers |
| 🔒 **Security** | JWT + refresh token, RBAC 5 level, rate limiting, DLP watermark |

---

## Stack Teknologi

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Database | PostgreSQL 16 + pg_trgm |
| Cache | Redis 7 |
| PDF | Puppeteer |
| Excel | SheetJS (xlsx) |
| Auth | JWT + bcrypt + HTTP-only cookies |
| Email | Nodemailer (SMTP / SendGrid) |
| Deploy | Docker + Docker Compose + Nginx |

---

## Struktur Direktori

```
oscarpart/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── config/             # Database, Redis, Logger
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, rate limit, audit, validation
│   │   ├── routes/             # Route definitions
│   │   ├── services/           # Business logic
│   │   ├── database/           # Migration & seed runners
│   │   └── scripts/            # Setup utilities
│   ├── .env.example
│   └── Dockerfile
├── frontend/                   # Next.js 14 app
│   ├── app/
│   │   ├── (public)/           # Landing, search, RFQ, register, login
│   │   ├── (customer)/         # Dashboard, history
│   │   ├── (admin)/            # Admin panel
│   │   └── admin/              # Route re-exports + auth layout
│   ├── components/             # UI kit, RFQ cart, DLP guard
│   └── lib/                    # API client, auth context, formatters
├── database/
│   ├── schema.sql              # 15 tabel + enums + triggers
│   ├── indexes.sql             # pg_trgm + composite indexes
│   └── seeds/                  # Initial data + 100 sample parts
├── nginx/
│   └── nginx.conf              # SSL, rate limiting, security headers
├── docs/
│   ├── API.md                  # REST API reference
│   ├── DEPLOYMENT.md           # Production deployment guide
│   └── PHASE1-SETUP.md        # Development setup guide
├── docker-compose.yml          # Production
└── docker-compose.dev.yml      # Development (hot reload)
```

---

## Quick Start (Development)

### Prasyarat
- Node.js 18+
- Docker + Docker Compose

### 1. Clone & Setup

```bash
git clone <repo-url> oscarpart
cd oscarpart
cp backend/.env.example backend/.env
```

Edit `backend/.env` — minimal yang harus diisi:
```bash
DB_PASSWORD=password_kuat_anda
REDIS_PASSWORD=redis_password_anda
JWT_ACCESS_SECRET=<64_hex_chars>   # openssl rand -hex 64
JWT_REFRESH_SECRET=<64_hex_chars>  # openssl rand -hex 64
```

### 2. Jalankan semua service

```bash
# Opsi A: Full Docker (semua service)
docker compose -f docker-compose.dev.yml up

# Opsi B: Database saja via Docker, backend lokal
docker compose -f docker-compose.dev.yml up postgres redis -d
cd backend && npm install && npm run dev
# terminal baru:
cd frontend && npm install && npm run dev
```

### 3. Setup superadmin

```bash
# Interaktif
cd backend && npm run setup-admin

# Atau non-interaktif (Docker/CI)
ADMIN_EMAIL=admin@oscarpart.id \
ADMIN_PASSWORD=Admin@2026! \
ADMIN_NAME="OSCARPART Admin" \
npx ts-node src/scripts/setup-admin.ts
```

### 4. Verifikasi

```
Backend:  http://localhost:4000/health
Frontend: http://localhost:3000
Admin:    http://localhost:3000/admin/dashboard
```

---

## Import Data Part

### Via Admin UI
Login → Parts Database → Import XLSX

Format kolom yang diperlukan:
```
part_number | description | brand | unit_type | stock_quantity | unit_price | warehouse_location
```

### Via SQL (bulk — untuk 100k+ rows)
```bash
docker cp parts.csv oscarpart_postgres:/tmp/
docker exec -it oscarpart_postgres psql -U oscarpart_user -d oscarpart -c \
  "COPY parts(part_number,description,brand_name,unit_type,stock_quantity,unit_price,warehouse_location) FROM '/tmp/parts.csv' CSV HEADER;"
```

---

## URL Aplikasi

| URL | Keterangan |
|-----|------------|
| `/` | Landing page |
| `/search?q=1R-0750` | Pencarian part |
| `/rfq` | Buat RFQ (wizard 3 langkah) |
| `/register` | Daftar akun customer |
| `/login` | Login |
| `/dashboard` | Customer dashboard |
| `/history` | History RFQ customer |
| `/admin/dashboard` | Admin dashboard |
| `/admin/users` | Approval queue |
| `/admin/leads` | CRM leads |
| `/admin/rfq` | Daftar RFQ |
| `/admin/parts` | Database part |
| `/admin/analytics` | Analitik & intelligence |
| `/admin/settings` | Pengaturan sistem |

---

## API

Base URL: `http://localhost:4000/api/v1`

Dokumentasi lengkap: [`docs/API.md`](docs/API.md)

Endpoint utama:
- `POST /auth/register` — Daftar akun
- `POST /auth/login` — Login → JWT
- `GET  /parts/search?q=` — Cari part
- `POST /rfq/upload` — Upload XLSX/CSV
- `POST /rfq/:id/submit` — Submit RFQ
- `GET  /admin/analytics/kpis` — Dashboard KPIs

---

## Role & Akses

```
public      → search tanpa harga/stok
registered  → search + stok (menunggu approval)
approved    → search + stok + harga + RFQ
admin       → semua + admin panel
superadmin  → semua + system settings
```

---

## Environment Variables

Lihat [`backend/.env.example`](backend/.env.example) untuk daftar lengkap semua variabel yang dibutuhkan.

---

## Deployment Production

Lihat [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) untuk panduan lengkap deployment ke VPS dengan SSL.

---

## Lisensi

Proprietary — © OSCARPART. All rights reserved.
