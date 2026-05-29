# OSCARPART — Deployment & Operations Guide

## Prasyarat Server (VPS Ubuntu 22.04)

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash
usermod -aG docker $USER

# Install Docker Compose plugin
apt-get install docker-compose-plugin

# Verify
docker --version          # Docker 24+
docker compose version    # v2.20+
```

---

## Setup Pertama Kali

### 1. Clone dan konfigurasi

```bash
git clone https://github.com/oscarpart/platform.git
cd oscarpart

cp backend/.env.example .env
```

Edit `.env` — wajib diisi:

```bash
# Generate secrets aman:
openssl rand -hex 64   # untuk JWT_ACCESS_SECRET
openssl rand -hex 64   # untuk JWT_REFRESH_SECRET
openssl rand -hex 32   # untuk DB_PASSWORD

# Isi di .env:
DB_PASSWORD=<db_password_kuat>
REDIS_PASSWORD=<redis_password_kuat>
JWT_ACCESS_SECRET=<64_char_hex>
JWT_REFRESH_SECRET=<64_char_hex_berbeda>
WHATSAPP_NUMBER=6281234567890
EMAIL_ADMIN=admin@oscarpart.id
FRONTEND_URL=https://oscarpart.id
CORS_ORIGIN=https://oscarpart.id
```

### 2. Build dan jalankan

```bash
# Development (dengan port expose)
docker compose -f docker-compose.dev.yml up -d

# Production
docker compose up -d --build
```

### 3. Setup superadmin (sekali saja)

```bash
docker exec -it oscarpart_backend \
  node dist/scripts/setup-admin.js
```

### 4. SSL Certificate (production)

```bash
# Stop nginx sementara
docker compose stop nginx

# Install certbot di host
apt install certbot

# Dapatkan certificate
certbot certonly --standalone -d oscarpart.id -d www.oscarpart.id \
  --email admin@oscarpart.id --agree-tos

# Start nginx
docker compose start nginx
```

### 5. Verifikasi

```bash
curl https://oscarpart.id/health
# {"status":"healthy","timestamp":"..."}

curl https://oscarpart.id/api/v1/auth/me
# {"success":false,"error":"UNAUTHORIZED"}  ← expected
```

---

## Import Data Part

### Via Admin UI
1. Login sebagai admin → Parts Database
2. Klik "Import XLSX"
3. Upload file Excel dengan kolom: `part_number, description, brand, unit_type, stock_quantity, unit_price, warehouse_location`

### Via API
```bash
curl -X POST https://oscarpart.id/api/v1/parts/admin/bulk-import \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"rows": [{"part_number":"CAT-1R0750","description":"Oil Filter","brand_name":"Caterpillar","unit_type":"PCS","stock_quantity":50,"unit_price":185000}]}'
```

### Via SQL langsung (100k+ rows — fastest)
```bash
# Copy CSV ke container
docker cp parts_data.csv oscarpart_postgres:/tmp/

# Import via psql
docker exec -it oscarpart_postgres psql -U oscarpart_user -d oscarpart -c "
  COPY parts(part_number, description, brand_name, unit_type, stock_quantity, unit_price, warehouse_location)
  FROM '/tmp/parts_data.csv'
  CSV HEADER;
"
```

---

## Operasi Rutin

### Backup Database
```bash
# Backup harian (tambahkan ke cron)
docker exec oscarpart_postgres pg_dump -U oscarpart_user oscarpart \
  | gzip > backup/oscarpart_$(date +%Y%m%d).sql.gz

# Crontab: backup setiap hari jam 03:00
0 3 * * * /home/deploy/oscarpart/scripts/backup.sh
```

### Update Aplikasi
```bash
git pull origin main
docker compose up -d --build backend frontend
docker compose ps   # verify all healthy
```

### Melihat Log
```bash
docker compose logs -f backend     # Backend logs realtime
docker compose logs -f nginx       # Nginx access/error logs
docker compose logs --tail 100 backend   # 100 baris terakhir
```

### Monitoring Resource
```bash
docker stats                       # CPU, memory semua container
docker exec oscarpart_postgres psql -U oscarpart_user -d oscarpart \
  -c "SELECT COUNT(*) FROM parts;"  # Jumlah part
```

### Redis CLI
```bash
docker exec -it oscarpart_redis redis-cli -a $REDIS_PASSWORD
> INFO keyspace    # lihat cache keys
> FLUSHDB          # clear cache (development only!)
```

---

## Troubleshooting

| Problem | Solusi |
|---------|--------|
| Backend tidak start | Cek `docker compose logs backend` — pastikan DB terhubung |
| PDF gagal generate | Install chromium: `apt install chromium-browser` di backend container |
| Email tidak terkirim | Cek SMTP settings di admin Settings page |
| Search lambat | Pastikan pg_trgm extension aktif: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` |
| Redis connection refused | Cek REDIS_PASSWORD di .env sudah benar |

---

## Arsitektur Produksi

```
Internet
    │
    ▼
[Nginx :443] ── SSL termination, rate limiting, security headers
    ├── /api/* ──────→ [Backend :4000] ──→ [PostgreSQL :5432]
    │                                   └──→ [Redis :6379]
    └── /* ──────────→ [Frontend :3000]
```

---

## URL Penting

| URL | Keterangan |
|-----|------------|
| `https://oscarpart.id` | Landing page publik |
| `https://oscarpart.id/search` | Pencarian part |
| `https://oscarpart.id/rfq` | Buat RFQ |
| `https://oscarpart.id/register` | Pendaftaran customer |
| `https://oscarpart.id/login` | Login |
| `https://oscarpart.id/admin/dashboard` | Admin dashboard |
| `https://oscarpart.id/health` | Health check |
| `https://oscarpart.id/api/v1/...` | REST API |
