# OSCARPART API Documentation v1.0

Base URL: `https://oscarpart.id/api/v1`

---

## Authentication

Semua request yang memerlukan auth harus menyertakan header:
```
Authorization: Bearer <access_token>
```

Access token valid 15 menit. Gunakan endpoint `/auth/refresh` untuk mendapatkan token baru secara otomatis.

---

## Auth Endpoints

### POST /auth/register
Daftarkan akun baru. Status default: `pending` (menunggu approval admin).

**Body:**
```json
{
  "email":            "buyer@ptcontoh.com",
  "password":         "Contoh@2026!",
  "full_name":        "Budi Santoso",
  "company_name":     "PT Contoh Mining",
  "business_type":    "Kontraktor Tambang",
  "contact_person":   "Budi Santoso",
  "position":         "Procurement Manager",
  "mobile_number":    "08123456789",
  "whatsapp_number":  "6281234567890",
  "project_location": "Kutai Kartanegara, Kaltim",
  "industry":         "Pertambangan Batubara"
}
```

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**Response:** `{ accessToken, expiresIn, user: { id, email, role, status, ... } }`
**Side effect:** Sets `refreshToken` HTTP-only cookie.

### POST /auth/refresh
Gunakan refresh token cookie untuk dapatkan access token baru.
**Response:** `{ accessToken, expiresIn }`

### POST /auth/logout *(Auth required)*
Revoke refresh token. Clears cookie.

### GET /auth/me *(Auth required)*
Profil user yang sedang login.

---

## Parts Endpoints

### GET /parts/search?q={partNumber}
Cari part. Role-tiered response:
- `public/registered`: part_number, description, brand, unit_type
- `approved+`: + stock_quantity, warehouse_location
- `approved+`: + unit_price

**Rate limit:** 30 req/menit (public), 60/menit (authenticated)

**Response (approved user):**
```json
{
  "found": true,
  "exact": true,
  "total": 1,
  "parts": [{
    "id": "uuid",
    "part_number": "1R-0750",
    "description": "FILTER AS-OIL",
    "brand_name": "Caterpillar",
    "unit_type": "PCS",
    "stock_quantity": 45,
    "warehouse_location": "BPN-MAIN",
    "unit_price": 185000
  }]
}
```

### POST /parts/batch-lookup *(Approved+ required)*
Lookup array of part numbers (max 500). Digunakan RFQ engine.

**Body:** `{ "part_numbers": ["1R-0750", "CAT-123", "..."] }`

---

## RFQ Endpoints

### GET /rfq/template
Download template Excel kosong. No auth required.

### POST /rfq/draft
Buat draft RFQ baru. Returns `{ id, rfq_number }`.

### POST /rfq/upload
Upload file XLSX/CSV. Otomatis create draft + resolve items.

**Form-data:** `file` (XLSX/XLS/CSV, max 10MB)

**Response:**
```json
{
  "rfq_id": "uuid",
  "rfq_number": "RFQ-20260527-0001",
  "items": [...],
  "parse": {
    "total_rows": 50,
    "valid_rows": 49,
    "matched": 42,
    "unmatched": 7,
    "errors": ["Baris 5: Qty tidak valid"]
  }
}
```

### POST /rfq/:id/items
Update items dalam draft RFQ.

**Body:**
```json
{
  "items": [
    { "part_number": "1R-0750", "qty_requested": 10 },
    { "part_number": "6I-2501", "qty_requested": 5, "description": "Filter" }
  ]
}
```

### POST /rfq/:id/submit
Submit RFQ final dengan info customer.

**Body:**
```json
{
  "company_name":     "PT Contoh Mining",
  "contact_person":   "Budi Santoso",
  "position":         "Procurement Manager",
  "email":            "budi@ptcontoh.com",
  "whatsapp":         "6281234567890",
  "project_name":     "Overburden Removal Q3 2026",
  "delivery_location":"Pit A, Kutai Kartanegara",
  "notes":            "Urgent, butuh dalam 2 minggu"
}
```

**Response includes:** `whatsapp_url` (wa.me link untuk forward ke admin)

### GET /rfq/my *(Approved+ required)*
History RFQ milik user yang login.

### GET /rfq/:id *(Auth atau owner)*
Detail satu RFQ dengan semua items.

---

## Admin Endpoints

Semua endpoint `/admin/*` memerlukan role `admin` atau `superadmin`.

### Users
- `GET /admin/users` — List users (filter: status, role, search, page, limit)
- `GET /admin/users/pending-count` — Jumlah pending approval (untuk badge)
- `GET /admin/users/:id` — Detail user
- `PATCH /admin/users/:id/approve` — Approve pendaftaran
- `PATCH /admin/users/:id/reject` — Tolak: `{ "reason": "..." }`
- `PATCH /admin/users/:id/role` — Update role: `{ "role": "approved|admin" }`
- `PATCH /admin/users/:id/suspend` — Suspend akun

### RFQ
- `GET /admin/rfq` — List semua RFQ (filter: status, search, date_from, date_to)
- `GET /admin/pdf/rfq/:rfqId` — Generate & download PDF (Puppeteer)

### Leads
- `GET /admin/leads` — List CRM leads
- `GET /admin/leads/stats` — Pipeline statistics
- `PATCH /admin/leads/:id` — Update lead status, notes, assigned_to

### Analytics
- `GET /admin/analytics/kpis` — Dashboard KPI cards
- `GET /admin/analytics/search-trends?days=30` — Top searched parts
- `GET /admin/analytics/parts-not-found?days=30` — Parts tidak ditemukan
- `GET /admin/analytics/rfq-trends?period=daily|weekly|monthly`
- `GET /admin/analytics/top-customers?limit=10`
- `GET /admin/analytics/pipeline` — Revenue pipeline by lead status
- `GET /admin/analytics/top-brands`
- `GET /admin/analytics/activity-feed?limit=50`
- `GET /admin/analytics/search-volume` — 30-day chart data

### Parts (Admin)
- `GET /parts/admin/list` — Paginated list dengan filter
- `PUT /parts/admin/:partNumber` — Create/update single part
- `POST /parts/admin/bulk-import` — Import array of rows
- `GET /parts/admin/trending` — Top searched parts

### Settings *(Superadmin only)*
- `GET /admin/settings` — Semua settings
- `PATCH /admin/settings/:key` — Update: `{ "value": "..." }`

---

## Error Codes

| Code | Arti |
|------|------|
| `UNAUTHORIZED` | Token tidak ada atau invalid |
| `TOKEN_EXPIRED` | Access token expired → refresh |
| `FORBIDDEN` | Role tidak cukup |
| `ACCOUNT_NOT_APPROVED` | Akun pending/rejected |
| `ACCOUNT_SUSPENDED` | Akun disuspend |
| `EMAIL_EXISTS` | Email sudah terdaftar |
| `INVALID_CREDENTIALS` | Email/password salah |
| `VALIDATION_ERROR` | Input tidak valid (lihat `errors` array) |
| `RATE_LIMIT_EXCEEDED` | Terlalu banyak request |
| `RFQ_NOT_FOUND` | RFQ tidak ditemukan |
| `RFQ_ALREADY_SUBMITTED` | RFQ sudah dikirim |
| `BATCH_TOO_LARGE` | Lebih dari 500 part numbers |

---

## Role Hierarchy

```
public → registered → approved → admin → superadmin
  0           1           2         3          4
```

- `public` — Tidak login. Bisa search (tanpa stok/harga).
- `registered` — Daftar tapi belum di-approve. Bisa lihat stok.
- `approved` — Customer aktif. Bisa lihat harga, submit RFQ.
- `admin` — Bisa akses semua admin panel.
- `superadmin` — Bisa ubah settings sistem.
