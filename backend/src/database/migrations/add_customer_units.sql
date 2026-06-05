-- ============================================================
-- Migration: Tambah tabel customer_units
-- Untuk: Mining Parts Loyalty Engine - Fase 1 (HM Field)
-- Aman: Tidak mengubah tabel yang sudah ada
-- ============================================================

-- Aktifkan UUID extension jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Buat tabel customer_units
CREATE TABLE IF NOT EXISTS customer_units (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_name           VARCHAR(150) NOT NULL,
  model               VARCHAR(100) NOT NULL,
  serial_number       VARCHAR(100),
  current_hm          DECIMAL(10, 1),
  hm_updated_at       TIMESTAMPTZ,
  year_of_manufacture INTEGER,
  site_location       VARCHAR(255),
  notes               TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_customer_units_user_id ON customer_units(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_units_model   ON customer_units(model);
CREATE INDEX IF NOT EXISTS idx_customer_units_active  ON customer_units(is_active);

-- Komentar tabel
COMMENT ON TABLE customer_units IS 'Data unit alat berat milik pelanggan - Loyalty Engine Layer 1';
COMMENT ON COLUMN customer_units.current_hm       IS 'Hour Meter saat ini (dalam jam)';
COMMENT ON COLUMN customer_units.hm_updated_at    IS 'Kapan HM terakhir diupdate';
COMMENT ON COLUMN customer_units.is_active        IS 'Soft delete flag';
