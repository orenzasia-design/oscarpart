/**
 * Migration: Tambah kolom last_pm_hm ke customer_units
 * Auto-run via bootstrap() — aman dijalankan berulang (IF NOT EXISTS)
 */
import { db } from '../config/database';
import logger from '../config/logger';

export async function migrateLastPmHm(): Promise<void> {
  try {
    await db.query(`
      ALTER TABLE customer_units
        ADD COLUMN IF NOT EXISTS last_pm_hm    DECIMAL(10,1),
        ADD COLUMN IF NOT EXISTS last_pm_date  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_pm_notes TEXT
    `);
    logger.info('✅ customer_units: last_pm_hm columns ready');
  } catch (err) {
    logger.error('❌ migrateLastPmHm:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateLastPmHm().then(() => process.exit(0)).catch(() => process.exit(1));
}
