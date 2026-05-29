# OSCARPART Phase 1 — Setup & Run Guide

## Yang Dibangun di Phase 1

### Database
- **15 tabel** PostgreSQL lengkap dengan relasi, constraints, dan triggers
- **Performance indexes** — pg_trgm untuk fuzzy search 100k+ part numbers
- **Seed data** — brands (20), warehouses (3), system settings (25+ keys)

### Backend API (Express + TypeScript)
- **Authentication system** — register, login, logout, refresh token
- **JWT** access token (15 menit) + refresh token (30 hari, HTTP-only cookie)
- **RBAC** — 5 role levels: public → registered → approved → admin → superadmin
- **Admin user management** — approve/reject pendaftaran, ubah role, suspend
- **Rate limiting** — Redis-backed, berbeda per endpoint dan per role
- **Audit log** — setiap action tercatat otomatis
- **Security** — bcrypt, helmet, CORS, parameterised queries

---

## Prerequisites

```bash
# Wajib terinstall:
node  >= 18
npm   >= 9
docker + docker-compose
```

---

## Cara Menjalankan

### 1. Clone dan setup environment

```bash
cd oscarpart/backend
cp .env.example .env
```

Edit `.env` — **wajib** ubah:
```
DB_PASSWORD=password_kuat_anda
REDIS_PASSWORD=password_redis_anda
JWT_ACCESS_SECRET=string_random_64_karakter
JWT_REFRESH_SECRET=string_random_64_karakter_berbeda
```

Generate secret yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Jalankan database + Redis

```bash
# Dari root project
docker-compose up postgres redis -d

# Tunggu healthy (cek dengan):
docker-compose ps
```

### 3. Install dependencies dan setup superadmin

```bash
cd backend
npm install

# Jalankan setup wizard — buat password superadmin
npm run setup-admin
```

### 4. Jalankan backend (development)

```bash
npm run dev
# Server berjalan di http://localhost:4000
```

### 5. Test health check

```bash
curl http://localhost:4000/health
# Response: {"status":"healthy","timestamp":"..."}
```

---

## Atau: Full Docker (semua sekaligus)

```bash
# Build dan jalankan semua service
docker-compose up --build

# Setup superadmin (setelah container running)
docker exec -it oscarpart_backend npx ts-node src/scripts/setup-admin.ts
```

---

## API Endpoints Phase 1

### Auth

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/api/v1/auth/register` | Public | Pendaftaran akun baru |
| POST | `/api/v1/auth/login` | Public | Login, return JWT |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| POST | `/api/v1/auth/logout` | Auth | Logout, revoke token |
| GET  | `/api/v1/auth/me` | Auth | Data user yang login |

### Admin — User Management

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| GET    | `/api/v1/admin/users` | Admin+ | List semua user (filter: status, role, search) |
| GET    | `/api/v1/admin/users/pending-count` | Admin+ | Jumlah pending approval |
| GET    | `/api/v1/admin/users/:id` | Admin+ | Detail satu user |
| PATCH  | `/api/v1/admin/users/:id/approve` | Admin+ | Approve pendaftaran |
| PATCH  | `/api/v1/admin/users/:id/reject` | Admin+ | Tolak pendaftaran |
| PATCH  | `/api/v1/admin/users/:id/role` | Admin+ | Ubah role user |
| PATCH  | `/api/v1/admin/users/:id/suspend` | Admin+ | Suspend akun |

---

## Contoh Request

### Register
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":            "buyer@ptcontoh.com",
    "password":         "Contoh@2026!",
    "full_name":        "Budi Santoso",
    "company_name":     "PT Contoh Mining",
    "business_type":    "Kontraktor Tambang",
    "contact_person":   "Budi Santoso",
    "position":         "Procurement Manager",
    "mobile_number":    "08123456789",
    "whatsapp_number":  "6281234567890",
    "project_location": "Kutai Kartanegara, Kalimantan Timur",
    "industry":         "Pertambangan Batubara"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@oscarpart.id","password":"password_anda"}'
```

### Approve User (Admin)
```bash
curl -X PATCH http://localhost:4000/api/v1/admin/users/{USER_ID}/approve \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Login | 10 req / 15 menit (per IP) |
| Register | 5 req / jam |
| Refresh token | 10 req / 5 menit |
| Part search (public) | 30 req / menit |
| Part search (auth) | 60 req / menit |
| Global | 200 req / menit |

---

## Phase Berikutnya

**Phase 2** — Part Search API + Public Landing Page + Search UI:
- `GET /api/v1/parts/search?q=` — exact + fuzzy search dengan pg_trgm
- Redis caching untuk hot parts
- `POST /api/v1/parts/batch-lookup` — untuk RFQ engine
- Next.js frontend: landing page, search box, hasil pencarian (tiered by role)

---

## Struktur File Phase 1

```
oscarpart/
├── database/
│   ├── schema.sql              ← 15 tabel + enums + triggers
│   ├── indexes.sql             ← Performance indexes
│   └── seeds/
│       └── 001_initial_data.sql ← Brands, warehouses, settings
├── backend/
│   ├── src/
│   │   ├── index.ts            ← Express app entry point
│   │   ├── config/
│   │   │   ├── database.ts     ← PostgreSQL pool + query helpers
│   │   │   ├── redis.ts        ← Redis client + cache helpers
│   │   │   └── logger.ts       ← Winston logger
│   │   ├── services/
│   │   │   └── auth.service.ts ← Register, login, JWT, approval
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       ← JWT verify + RBAC
│   │   │   ├── rate-limit.middleware.ts ← Per-endpoint limits
│   │   │   ├── audit.middleware.ts      ← Action logging
│   │   │   └── validation.middleware.ts ← Input validation
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts         ← Auth endpoints
│   │   │   └── admin-users.controller.ts  ← Admin user mgmt
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── database/
│   │   │   └── migrate.ts      ← Migration runner
│   │   └── scripts/
│   │       └── setup-admin.ts  ← Superadmin wizard
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
└── docker-compose.yml
```
