/**
 * Migration: buat tabel pm_reminder_logs
 * Mencegah kirim notifikasi PM duplikat dalam 20 jam
 *
 * Run: npx ts-node src/scripts/create-pm-reminder-logs.ts
 * Atau otomatis via bootstrap()
 */
import { db } from '../config/database';
import logger from '../config/logger';

export async function createPmReminderLogsTable(): Promise<void> {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pm_reminder_logs (
        id           SERIAL PRIMARY KEY,
        unit_id      VARCHAR(50) NOT NULL,
        bundle_id    INTEGER     NOT NULL,
        reminder_type VARCHAR(20) NOT NULL, -- 'overdue' | 'due_soon'
        hm_to_next   INTEGER,
        sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (unit_id, bundle_id, reminder_type)
      )
    `);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_pm_reminder_logs_unit
        ON pm_reminder_logs(unit_id, sent_at)
    `);
    logger.info('✅ pm_reminder_logs table ready');
  } catch (err) {
    logger.error('❌ createPmReminderLogsTable:', err);
    throw err;
  }
}

if (require.main === module) {
  createPmReminderLogsTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
