-- Migration: Tambah kolom last_pm_hm ke customer_units
-- Untuk: PM Reminder System — tracking kapan PM terakhir dilakukan
-- Aman: menggunakan ALTER TABLE IF NOT EXISTS pattern

ALTER TABLE customer_units
  ADD COLUMN IF NOT EXISTS last_pm_hm       DECIMAL(10,1),
  ADD COLUMN IF NOT EXISTS last_pm_date     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_pm_notes    TEXT;

COMMENT ON COLUMN customer_units.last_pm_hm    IS 'HM saat PM terakhir dilakukan';
COMMENT ON COLUMN customer_units.last_pm_date   IS 'Tanggal PM terakhir dilakukan';
COMMENT ON COLUMN customer_units.last_pm_notes  IS 'Catatan PM terakhir (opsional)';
