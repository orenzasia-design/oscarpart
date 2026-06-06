/**
 * UPDATE PART NUMBERS — SKT90S, SKT105S, SYZ440C
 * Data 100% dari Parts List Catalogue (Google Drive)
 *
 * SKT90S  → Parts List xlsx FAST MOVING section
 * SKT105S → Parts List xlsx FAST MOVING section
 * SYZ440C → adopts SYZ326C chassis parts (per instruksi user)
 *
 * Bisa dipanggil dari bootstrap() atau standalone:
 * npx ts-node src/scripts/update-part-numbers-final.ts
 */

import { db } from '../config/database';
import logger from '../config/logger';

export async function updatePartNumbersFinal(): Promise<void> {
  try {
    logger.info('🔧 Updating part numbers for SKT90S, SKT105S, SYZ440C...');

    // Helper: UPDATE part_number WHERE NULL dan component_name LIKE
    async function setPN(unit: string, like: string, pn: string, label: string): Promise<number> {
      const res = await db.query(`
        UPDATE pm_bundle_items bi
        SET part_number = $1
        FROM pm_bundles pb
        WHERE bi.bundle_id = pb.id
          AND pb.unit_model = $2
          AND bi.part_number IS NULL
          AND LOWER(bi.component_name) LIKE LOWER($3)
      `, [pn, unit, `%${like}%`]);
      const n = res.rowCount ?? 0;
      if (n > 0) logger.info(`  ✅ ${unit} | ${label} → ${pn} (${n} rows updated)`);
      return n;
    }

    // ── SKT90S ──────────────────────────────────────────────────────
    // Engine Oil Filters
    await setPN('SKT90S', 'Filter, Engine Oil',        '61000119',        'Engine Oil Filter assy');
    await setPN('SKT90S', 'Engine Oil Filter Element', '60327523',        'Engine Oil Filter Element');
    await setPN('SKT90S', 'Oil Filter Element',        '60327523',        'Oil Filter Element');
    // Fuel Filters
    await setPN('SKT90S', 'Fuel Fine Filter',          '61019554',        'Fuel Fine Filter assy');
    await setPN('SKT90S', 'Fuel Fine Filter Core',     '160604020018',    'Fuel Fine Filter Core');
    await setPN('SKT90S', 'Fuel Fine Filter Element',  '160604020018',    'Fuel Fine Filter Element');
    await setPN('SKT90S', 'Fuel Coarse Filter',        '61019553',        'Fuel Coarse Filter assy');
    await setPN('SKT90S', 'Fuel Coarse Filter Core',   '160604020017',    'Fuel Coarse Filter Core');
    await setPN('SKT90S', 'Fuel Coarse Filter Element','160604020017',    'Fuel Coarse Filter Element');
    await setPN('SKT90S', 'Oil-Water Separator',       '160603010026A',   'Oil-Water Separator assy');
    await setPN('SKT90S', 'Water Separator',           '160603010026A',   'Water Separator');
    await setPN('SKT90S', 'Oil-Water Separator Filter','160603020024A',   'Oil-Water Separator Element');
    await setPN('SKT90S', 'Fuel Filter Element',       '160604020018',    'Fuel Filter Element generic');
    // Air Filter
    await setPN('SKT90S', 'Air Filter',                '160602010071A',   'Air Filter');
    // Belts & Tensioner
    await setPN('SKT90S', 'Belt',                      '60141428',        'Belt');
    await setPN('SKT90S', 'Poly V-Belt',               '160399000008A',   'Poly V-Belt');
    await setPN('SKT90S', 'Poly V Belt',               '160399000008A',   'Poly V Belt');
    await setPN('SKT90S', 'Automatic Tensioner',       '160399000009A',   'Automatic Tensioner');
    await setPN('SKT90S', 'Tensioner',                 '160399000009A',   'Tensioner');
    await setPN('SKT90S', 'Idle Gear',                 '160399000007A',   'Idle Gear');
    await setPN('SKT90S', 'Idle Wheel',                '160399000007A',   'Idle Wheel');
    // Hydraulic Filters
    await setPN('SKT90S', 'Filter, Oil Return',        '60101256',        'Oil Return Filter');
    await setPN('SKT90S', 'Oil Return Filter',         '60101256',        'Oil Return Filter');
    await setPN('SKT90S', 'Hydraulic Filter',          '60345316',        'Hydraulic Filter Element');
    await setPN('SKT90S', 'Pipeline Filter',           '151501000022A',   'Pipeline Filter');
    await setPN('SKT90S', 'Pressure Oil Filter',       '60278222',        'Pressure Oil Filter');
    // Transmission Filters
    await setPN('SKT90S', 'Oil Filter (Transmisi)',    '130202000126A210','Transmission Oil Filter');
    await setPN('SKT90S', 'Suction Filter (Transmisi)','130202000126A122','Transmission Suction Filter');
    await setPN('SKT90S', 'Suction Filter',            '130202000126A122','Suction Filter');
    // Air Dryer
    await setPN('SKT90S', 'Air Handling Unit',         '152599000112A',   'Air Handling Unit');
    await setPN('SKT90S', 'Air Dryer',                 '152599000112A001','Air Dryer element');
    // Brake
    await setPN('SKT90S', 'Piston Accumulator',        '60308391',        'Piston Accumulator');
    await setPN('SKT90S', 'Piston Type Accumulator',   '60308391',        'Piston Type Accumulator');
    await setPN('SKT90S', 'Relay Valve',               '60330808',        'Relay Valve');
    await setPN('SKT90S', 'Air Storage Tank',          '152599000195A',   'Air Storage Tank');
    await setPN('SKT90S', 'Air Reservoir',             '152599000195A',   'Air Reservoir');
    await setPN('SKT90S', 'Air Tank',                  '152599000195A',   'Air Tank');
    // Suspension
    await setPN('SKT90S', 'Front Suspension Cylinder', '250901040645A',   'Front Suspension Cylinder');
    await setPN('SKT90S', 'Steering Cylinder',         '250901040643A',   'Steering Cylinder');
    await setPN('SKT90S', 'Damper',                    '131601000001A',   'Damper');
    // Cooling
    await setPN('SKT90S', 'Fan',                       '160802010001A',   'Fan');
    await setPN('SKT90S', 'Water Pump',                '160102120008A076','Water Pump');
    await setPN('SKT90S', 'Thermostat',                '160202000001A',   'Thermostat');
    // Electrical & Lubrication
    await setPN('SKT90S', 'Battery',                   '60190637',        'Battery');
    await setPN('SKT90S', 'Centralized Lubrication',   '152605000377A',   'Centralized Lubrication System');

    // ── SKT105S ─────────────────────────────────────────────────────
    // Engine Oil Filters
    await setPN('SKT105S', 'Filter, Engine Oil',        '61000119',        'Engine Oil Filter assy');
    await setPN('SKT105S', 'Engine Oil Filter',         '61000119',        'Engine Oil Filter assy');
    await setPN('SKT105S', 'Engine Oil Filter Element', '60327523',        'Engine Oil Filter Element');
    await setPN('SKT105S', 'Oil Filter Element',        '60327523',        'Oil Filter Element');
    // Fuel Filters
    await setPN('SKT105S', 'Fuel Fine Filter',          '61019554',        'Fuel Fine Filter assy');
    await setPN('SKT105S', 'Fuel Fine Filter Core',     '160604020018',    'Fuel Fine Filter Core');
    await setPN('SKT105S', 'Fuel Coarse Filter',        '61019553',        'Fuel Coarse Filter assy');
    await setPN('SKT105S', 'Fuel Coarse Filter Core',   '160604020017',    'Fuel Coarse Filter Core');
    await setPN('SKT105S', 'Oil-Water Separator',       '160603010026A',   'Oil-Water Separator assy');
    await setPN('SKT105S', 'Water Separator',           '160603010026A',   'Water Separator');
    await setPN('SKT105S', 'Oil-Water Separator Filter','160603020024A',   'Oil-Water Separator Element');
    await setPN('SKT105S', 'Fuel Filter Element',       '160604020018',    'Fuel Filter Element generic');
    // Air Filter — PN BERBEDA dari SKT90S!
    await setPN('SKT105S', 'Air Filter',                '160602010126A',   'Air Filter (SKT105S)');
    // Belts & Tensioner — Tensioner PN BERBEDA!
    await setPN('SKT105S', 'Belt',                      '60141428',        'Belt');
    await setPN('SKT105S', 'Poly V-Belt',               '160399000008A',   'Poly V-Belt');
    await setPN('SKT105S', 'Poly V Belt',               '160399000008A',   'Poly V Belt');
    await setPN('SKT105S', 'Tensioner, Automatic',      '169900000152A',   'Automatic Tensioner (SKT105S)');
    await setPN('SKT105S', 'Automatic Tensioner',       '169900000152A',   'Automatic Tensioner (SKT105S)');
    await setPN('SKT105S', 'Tensioner',                 '169900000152A',   'Tensioner (SKT105S)');
    await setPN('SKT105S', 'Idle Gear',                 '160399000007A',   'Idle Gear');
    // Transmission Filters
    await setPN('SKT105S', 'Oil Filter (Transmisi)',    '130202000126A210','Transmission Oil Filter');
    await setPN('SKT105S', 'Suction Filter (Transmisi)','130202000126A122','Transmission Suction Filter');
    await setPN('SKT105S', 'Suction Filter',            '130202000126A122','Suction Filter');
    // Hydraulic Filters
    await setPN('SKT105S', 'Filter, Oil Return',        '60101256',        'Oil Return Filter');
    await setPN('SKT105S', 'Oil Return Filter',         '60101256',        'Oil Return Filter');
    await setPN('SKT105S', 'Pressure Oil Filter',       '60278222',        'Pressure Oil Filter');
    await setPN('SKT105S', 'Hydraulic Filter',          '60345316',        'Hydraulic Filter Element');
    await setPN('SKT105S', 'Pipeline Filter',           '151501000022A',   'Pipeline Filter');
    // Air Dryer
    await setPN('SKT105S', 'Air Handling Unit',         '152599000112A',   'Air Handling Unit');
    await setPN('SKT105S', 'Air Dryer',                 '152599000112A001','Air Dryer element');
    // Brake
    await setPN('SKT105S', 'Piston Accumulator',        '60308391',        'Piston Accumulator');
    await setPN('SKT105S', 'Piston Type Accumulator',   '60308391',        'Piston Type Accumulator');
    await setPN('SKT105S', 'Relay Valve',               '60330808',        'Relay Valve');
    await setPN('SKT105S', 'Air Reservoir',             '152599000195A',   'Air Reservoir');
    await setPN('SKT105S', 'Air Storage Tank',          '152599000195A',   'Air Storage Tank');
    await setPN('SKT105S', 'Air Tank',                  '152599000195A',   'Air Tank');
    // Suspension — PN BERBEDA (SKT100 series)!
    await setPN('SKT105S', 'Front Suspension Cylinder', '150901040969A',   'Front Suspension Cylinder (SKT105S)');
    await setPN('SKT105S', 'Rear Suspension Cylinder',  '150901040970A',   'Rear Suspension Cylinder (SKT105S)');
    await setPN('SKT105S', 'Steering Cylinder',         '250901040643A',   'Steering Cylinder');
    await setPN('SKT105S', 'Damper',                    '131601000001A',   'Damper');
    // Cooling — Water Pump PN BERBEDA!
    await setPN('SKT105S', 'Fan',                       '160802010001A',   'Fan');
    await setPN('SKT105S', 'Water Pump',                '160201000004A',   'Water Pump (SKT105S)');
    await setPN('SKT105S', 'Thermostat',                '160202000001A',   'Thermostat');
    // Electrical & Lubrication
    await setPN('SKT105S', 'Battery',                   '60190637',        'Battery');
    await setPN('SKT105S', 'Centralized Lubrication',   '152605000377A',   'Centralized Lubrication System');

    // ── SYZ440C — adopts SYZ326C (per instruksi user, chassis identik) ─
    await setPN('SYZ440C', 'Oil Filter Element',        '160605020019',    'Oil Filter Element (ref SYZ326C)');
    await setPN('SYZ440C', 'Engine Oil Filter',         '160605020019',    'Engine Oil Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Fuel Filter Element',       '160101120038A001','Fuel Filter Element (ref SYZ326C)');
    await setPN('SYZ440C', 'Fuel Fine Filter',          '160101120038A001','Fuel Fine Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Water Separator',           '1000424916',      'Water Separator (ref SYZ326C)');
    await setPN('SYZ440C', 'Fuel Water Separator',      '1000424916',      'Fuel Water Separator (ref SYZ326C)');
    await setPN('SYZ440C', 'Air Dryer Filter',          '152599000024A',   'Air Dryer Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Air Dryer',                 '152599000024A',   'Air Dryer (ref SYZ326C)');
    await setPN('SYZ440C', 'Air Handling Unit',         '152599000112A',   'Air Handling Unit (ref SYZ326C)');
    await setPN('SYZ440C', 'Filter, Oil Return',        '60101256',        'Oil Return Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Oil Return Filter',         '60101256',        'Oil Return Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Hydraulic Filter',          '60345316',        'Hydraulic Filter (ref SYZ326C)');
    await setPN('SYZ440C', 'Belt',                      '60141428',        'Belt (ref SYZ326C)');
    await setPN('SYZ440C', 'Poly V-Belt',               '160399000008A',   'Poly V-Belt (ref SYZ326C)');
    await setPN('SYZ440C', 'Fan',                       '160802010001A',   'Fan (ref SYZ326C)');
    await setPN('SYZ440C', 'Water Pump',                '160102120008A076','Water Pump (ref SYZ326C)');
    await setPN('SYZ440C', 'Thermostat',                '160202000001A',   'Thermostat (ref SYZ326C)');
    await setPN('SYZ440C', 'Battery',                   '60190637',        'Battery (ref SYZ326C)');
    await setPN('SYZ440C', 'Relay Valve',               '60330808',        'Relay Valve (ref SYZ326C)');

    // ── Summary ─────────────────────────────────────────────────────
    const summary = await db.query(`
      SELECT
        pb.unit_model,
        COUNT(bi.id) AS total,
        COUNT(bi.part_number) AS with_pn,
        COUNT(*) - COUNT(bi.part_number) AS still_null
      FROM pm_bundles pb
      JOIN pm_bundle_items bi ON bi.bundle_id = pb.id
      WHERE pb.unit_model IN ('SKT90S','SKT105S','SYZ440C')
      GROUP BY pb.unit_model ORDER BY pb.unit_model
    `);
    for (const r of summary.rows) {
      const pct = Math.round((Number(r.with_pn) / Number(r.total)) * 100);
      logger.info(`  📊 ${r.unit_model}: ${r.with_pn}/${r.total} items punya PN (${pct}%) | null: ${r.still_null}`);
    }
    logger.info('✅ Part number update selesai!');

  } catch (err) {
    logger.error('❌ Error updating part numbers:', err);
    // Tidak throw — agar bootstrap tetap lanjut meski ada error
  }
}

// Standalone run
if (require.main === module) {
  updatePartNumbersFinal()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
