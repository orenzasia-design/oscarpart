/**
 * UPDATE PART NUMBERS — SRT95C
 * Engine: Cummins QSK50-C
 * Transmission: Allison H8610AR
 *
 * Sources:
 * - Cummins QSK50 Parts Catalog (filter part numbers)
 * - Allison H8610AR Service Manual
 * - XCMG SRT95C Parts Book (via Google Drive — cross-reference)
 *
 * Bisa dipanggil dari bootstrap() atau standalone:
 * npx ts-node src/scripts/update-srt95c-pn.ts
 */

import { db } from '../config/database';
import logger from '../config/logger';

export async function updateSrt95cPartNumbers(): Promise<void> {
  try {
    logger.info('🔧 Updating part numbers for SRT95C...');

    async function setPN(like: string, pn: string, label: string): Promise<number> {
      const res = await db.query(`
        UPDATE pm_bundle_items bi
        SET part_number = $1
        FROM pm_bundles pb
        WHERE bi.bundle_id = pb.id
          AND pb.unit_model = 'SRT95C'
          AND bi.part_number IS NULL
          AND LOWER(bi.component_name) LIKE LOWER($2)
      `, [pn, `%${like}%`]);
      const n = res.rowCount ?? 0;
      if (n > 0) logger.info(`  ✅ SRT95C | ${label} → ${pn} (${n} rows)`);
      return n;
    }

    // ── Cummins QSK50-C Fuel Filters ────────────────────────────────
    // Fuel Pre-Filter / Rough Filter (Saringan Kasar BBM)
    // Cummins part: 3315840 (Fuel Filter, Primary)
    await setPN('Fuel Pre-Filter',    '3315840',  'Fuel Pre-Filter (Cummins QSK50)');
    await setPN('Rough Filter',       '3315840',  'Fuel Rough Filter (Cummins QSK50)');
    await setPN('Saringan Kasar BBM', '3315840',  'Saringan Kasar BBM');

    // Fuel Fine Filter (Saringan Halus BBM)
    // Cummins part: 3315843 (Fuel Filter, Secondary)
    await setPN('Fuel Fine Filter',   '3315843',  'Fuel Fine Filter (Cummins QSK50)');
    await setPN('Saringan Halus BBM', '3315843',  'Saringan Halus BBM');

    // ── Cummins QSK50-C Coolant Filter ──────────────────────────────
    // Cummins part: 3100306 (Water Filter / Coolant Filter)
    await setPN('Coolant Filter',     '3100306',  'Coolant Filter (Cummins QSK50)');
    await setPN('Water Filter',       '3100306',  'Water Filter (Cummins QSK50)');
    await setPN('Filter Air',         '3100306',  'Filter Air Cummins');
    await setPN('liquid de refroid',  '3100306',  'Liquid de Refroidissement Filter');

    // ── Allison H8610AR Transmission Filter ─────────────────────────
    // Allison part: 29545196 (Filter Element, Oil)
    await setPN('Transmission Filter', '29545196', 'Transmission Filter (Allison H8610AR)');
    await setPN('Allison H8610',       '29545196', 'Allison H8610AR Filter');

    // ── Summary ─────────────────────────────────────────────────────
    const remaining = await db.query(`
      SELECT COUNT(*) as cnt
      FROM pm_bundle_items bi
      JOIN pm_bundles pb ON bi.bundle_id = pb.id
      WHERE pb.unit_model = 'SRT95C'
        AND bi.component_category = 'FILTER'
        AND bi.part_number IS NULL
    `);
    const stillNull = parseInt(remaining.rows[0]?.cnt ?? '0');
    logger.info(`✅ SRT95C update done. FILTER items still null: ${stillNull}`);

  } catch (err) {
    logger.error('❌ updateSrt95cPartNumbers error:', err);
    throw err;
  }
}

// Standalone run
if (require.main === module) {
  updateSrt95cPartNumbers()
    .then(() => { logger.info('Done.'); process.exit(0); })
    .catch((e) => { logger.error(e); process.exit(1); });
}
