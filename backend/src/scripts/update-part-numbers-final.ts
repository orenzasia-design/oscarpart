/**
 * UPDATE PART NUMBERS — SKT90S, SKT105S, SYZ440C
 * Data 100% dari Parts List Catalogue (Google Drive)
 * 
 * SKT90S  → Parts List xlsx (FAST MOVING section)
 * SKT105S → Parts List xlsx (FAST MOVING section) 
 * SYZ440C → adopts SYZ326C chassis parts (per instruksi user)
 *
 * Run: npx ts-node src/scripts/update-part-numbers-final.ts
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('=== UPDATE PART NUMBERS START ===\n');

    // ─────────────────────────────────────────────
    // HELPER: update part_number berdasarkan component_name LIKE
    // ─────────────────────────────────────────────
    async function updatePN(unitModel: string, componentLike: string, partNumber: string, label?: string) {
      const res = await client.query(`
        UPDATE pm_bundle_items bi
        SET part_number = $1
        FROM pm_bundles pb
        WHERE bi.bundle_id = pb.id
          AND pb.unit_model = $2
          AND bi.part_number IS NULL
          AND LOWER(bi.component_name) LIKE LOWER($3)
      `, [partNumber, unitModel, `%${componentLike}%`]);
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  ✅ ${unitModel} | ${label || componentLike} → ${partNumber} (${res.rowCount} rows)`);
      }
      return res.rowCount ?? 0;
    }

    // ─────────────────────────────────────────────────────────────────
    // SKT90S — dari SKT90S-PartsList.xlsx FAST MOVING section
    // ─────────────────────────────────────────────────────────────────
    console.log('--- SKT90S ---');

    // Engine Oil Filter
    await updatePN('SKT90S', 'Filter, Engine Oil',       '61000119',       'Engine Oil Filter (assy)');
    await updatePN('SKT90S', 'Engine Oil Filter Element', '60327523',       'Engine Oil Filter Element');
    await updatePN('SKT90S', 'Oil Filter Element',        '60327523',       'Oil Filter Element');

    // Fuel Filters
    await updatePN('SKT90S', 'Fuel Fine Filter',          '61019554',       'Fuel Fine Filter (assy)');
    await updatePN('SKT90S', 'Fuel Fine Filter Core',     '160604020018',   'Fuel Fine Filter Core/Element');
    await updatePN('SKT90S', 'Fuel Fine Filter Element',  '160604020018',   'Fuel Fine Filter Element');
    await updatePN('SKT90S', 'Fuel Coarse Filter',        '61019553',       'Fuel Coarse Filter (assy)');
    await updatePN('SKT90S', 'Fuel Coarse Filter Core',   '160604020017',   'Fuel Coarse Filter Core/Element');
    await updatePN('SKT90S', 'Fuel Coarse Filter Element','160604020017',   'Fuel Coarse Filter Element');
    await updatePN('SKT90S', 'Oil-Water Separator',       '160603010026A',  'Oil-Water Separator (assy)');
    await updatePN('SKT90S', 'Water Separator',           '160603010026A',  'Water Separator');
    await updatePN('SKT90S', 'Oil-Water Separator Filter','160603020024A',  'Oil-Water Separator Element');
    await updatePN('SKT90S', 'Separator Filter Element',  '160603020024A',  'Separator Filter Element');
    await updatePN('SKT90S', 'Fuel Filter Element',       '160604020018',   'Fuel Filter Element (generic)');

    // Air Filter
    await updatePN('SKT90S', 'Air Filter',                '160602010071A',  'Air Filter');

    // Belts & Tensioner
    await updatePN('SKT90S', 'Belt',                      '60141428',       'Belt (poly V)');
    await updatePN('SKT90S', 'Poly V-Belt',               '160399000008A',  'Poly V-Belt');
    await updatePN('SKT90S', 'Poly V Belt',               '160399000008A',  'Poly V Belt');
    await updatePN('SKT90S', 'Automatic Tensioner',       '160399000009A',  'Automatic Tensioner');
    await updatePN('SKT90S', 'Tensioner',                 '160399000009A',  'Tensioner');
    await updatePN('SKT90S', 'Idle Gear',                 '160399000007A',  'Idle Gear');
    await updatePN('SKT90S', 'Idle Wheel',                '160399000007A',  'Idle Wheel');

    // Hydraulic Filters
    await updatePN('SKT90S', 'Filter, Oil Return',        '60101256',       'Oil Return Filter');
    await updatePN('SKT90S', 'Oil Return Filter',         '60101256',       'Oil Return Filter');
    await updatePN('SKT90S', 'Hydraulic Filter',          '60345316',       'Hydraulic Filter Element');
    await updatePN('SKT90S', 'Pipeline Filter',           '151501000022A',  'Pipeline Filter');
    await updatePN('SKT90S', 'Pressure Oil Filter',       '60278222',       'Pressure Oil Filter');

    // Transmission Filters
    await updatePN('SKT90S', 'Oil Filter (Transmisi)',    '130202000126A210','Transmission Oil Filter');
    await updatePN('SKT90S', 'Suction Filter (Transmisi)','130202000126A122','Transmission Suction Filter');
    await updatePN('SKT90S', 'Suction Filter',            '130202000126A122','Suction Filter');
    await updatePN('SKT90S', 'Oil Filter Transmisi',      '130202000126A210','Transmisi Oil Filter');

    // Air Dryer / Air Handling
    await updatePN('SKT90S', 'Air Handling Unit',         '152599000112A',  'Air Handling Unit');
    await updatePN('SKT90S', 'Air Dryer',                 '152599000112A001','Air Dryer (element)');
    await updatePN('SKT90S', 'Air Handling',              '152599000112A',  'Air Handling');

    // Brake / Accumulator / Air Tank
    await updatePN('SKT90S', 'Piston Accumulator',        '60308391',       'Piston Accumulator');
    await updatePN('SKT90S', 'Piston Type Accumulator',   '60308391',       'Piston Type Accumulator');
    await updatePN('SKT90S', 'Relay Valve',               '60330808',       'Relay Valve');
    await updatePN('SKT90S', 'Air Storage Tank',          '152599000195A',  'Air Storage Tank');
    await updatePN('SKT90S', 'Air Reservoir',             '152599000195A',  'Air Reservoir');
    await updatePN('SKT90S', 'Air Tank',                  '152599000195A',  'Air Tank');

    // Suspension
    await updatePN('SKT90S', 'Front Suspension Cylinder', '250901040645A',  'Front Suspension Cylinder');
    await updatePN('SKT90S', 'Steering Cylinder',         '250901040643A',  'Steering Cylinder');
    await updatePN('SKT90S', 'Damper',                    '131601000001A',  'Damper');

    // Cooling
    await updatePN('SKT90S', 'Fan',                       '160802010001A',  'Fan');
    await updatePN('SKT90S', 'Water Pump',                '160102120008A076','Water Pump');
    await updatePN('SKT90S', 'Thermostat',                '160202000001A',  'Thermostat');

    // Electrical
    await updatePN('SKT90S', 'Battery',                   '60190637',       'Battery');

    // Lubrication
    await updatePN('SKT90S', 'Centralized Lubrication',   '152605000377A',  'Centralized Lubrication System');

    // ─────────────────────────────────────────────────────────────────
    // SKT105S — dari SKT105S-PartsList.xlsx FAST MOVING section
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SKT105S ---');

    // Engine Oil Filters
    await updatePN('SKT105S', 'Filter, Engine Oil',        '61000119',        'Engine Oil Filter (assy)');
    await updatePN('SKT105S', 'Engine Oil Filter',         '61000119',        'Engine Oil Filter (assy)');
    await updatePN('SKT105S', 'Engine Oil Filter Element', '60327523',        'Engine Oil Filter Element');
    await updatePN('SKT105S', 'Oil Filter Element',        '60327523',        'Oil Filter Element');

    // Fuel Filters
    await updatePN('SKT105S', 'Fuel Fine Filter',          '61019554',        'Fuel Fine Filter (assy)');
    await updatePN('SKT105S', 'Fuel Fine Filter Core',     '160604020018',    'Fuel Fine Filter Core');
    await updatePN('SKT105S', 'Fuel Coarse Filter',        '61019553',        'Fuel Coarse Filter (assy)');
    await updatePN('SKT105S', 'Fuel Coarse Filter Core',   '160604020017',    'Fuel Coarse Filter Core');
    await updatePN('SKT105S', 'Oil-Water Separator',       '160603010026A',   'Oil-Water Separator (assy)');
    await updatePN('SKT105S', 'Water Separator',           '160603010026A',   'Water Separator');
    await updatePN('SKT105S', 'Oil-Water Separator Filter','160603020024A',   'Oil-Water Separator Element');
    await updatePN('SKT105S', 'Separator Filter Element',  '160603020024A',   'Separator Filter Element');
    await updatePN('SKT105S', 'Fuel Filter Element',       '160604020018',    'Fuel Filter Element (generic)');

    // Air Filter — SKT105S pakai PN berbeda dari SKT90S!
    await updatePN('SKT105S', 'Air Filter',                '160602010126A',   'Air Filter (SKT105S-spesifik)');

    // Belts & Tensioner
    await updatePN('SKT105S', 'Belt',                      '60141428',        'Belt');
    await updatePN('SKT105S', 'Poly V-Belt',               '160399000008A',   'Poly V-Belt');
    await updatePN('SKT105S', 'Poly V Belt',               '160399000008A',   'Poly V Belt');
    await updatePN('SKT105S', 'Tensioner, Automatic',      '169900000152A',   'Automatic Tensioner');
    await updatePN('SKT105S', 'Automatic Tensioner',       '169900000152A',   'Automatic Tensioner');
    await updatePN('SKT105S', 'Tensioner',                 '169900000152A',   'Tensioner');
    await updatePN('SKT105S', 'Idle Gear',                 '160399000007A',   'Idle Gear');

    // Transmission Filters
    await updatePN('SKT105S', 'Oil Filter (Transmisi)',    '130202000126A210','Transmission Oil Filter');
    await updatePN('SKT105S', 'Suction Filter (Transmisi)','130202000126A122','Transmission Suction Filter');
    await updatePN('SKT105S', 'Suction Filter',            '130202000126A122','Suction Filter');

    // Hydraulic Filters
    await updatePN('SKT105S', 'Filter, Oil Return',        '60101256',        'Oil Return Filter');
    await updatePN('SKT105S', 'Oil Return Filter',         '60101256',        'Oil Return Filter');
    await updatePN('SKT105S', 'Pressure Oil Filter',       '60278222',        'Pressure Oil Filter');
    await updatePN('SKT105S', 'Hydraulic Filter',          '60345316',        'Hydraulic Filter Element');
    await updatePN('SKT105S', 'Pipeline Filter',           '151501000022A',   'Pipeline Filter');

    // Air Dryer / Air Handling
    await updatePN('SKT105S', 'Air Handling Unit',         '152599000112A',   'Air Handling Unit');
    await updatePN('SKT105S', 'Air Dryer',                 '152599000112A001','Air Dryer (element)');

    // Brake / Accumulator / Air Tank
    await updatePN('SKT105S', 'Piston Accumulator',        '60308391',        'Piston Accumulator');
    await updatePN('SKT105S', 'Piston Type Accumulator',   '60308391',        'Piston Type Accumulator');
    await updatePN('SKT105S', 'Relay Valve',               '60330808',        'Relay Valve');
    await updatePN('SKT105S', 'Air Reservoir',             '152599000195A',   'Air Reservoir');
    await updatePN('SKT105S', 'Air Storage Tank',          '152599000195A',   'Air Storage Tank');
    await updatePN('SKT105S', 'Air Tank',                  '152599000195A',   'Air Tank');

    // Suspension — SKT105S pakai PN berbeda (SKT100 series)
    await updatePN('SKT105S', 'Front Suspension Cylinder', '150901040969A',   'Front Suspension Cylinder');
    await updatePN('SKT105S', 'Rear Suspension Cylinder',  '150901040970A',   'Rear Suspension Cylinder');
    await updatePN('SKT105S', 'Steering Cylinder',         '250901040643A',   'Steering Cylinder');
    await updatePN('SKT105S', 'Damper',                    '131601000001A',   'Damper');

    // Cooling
    await updatePN('SKT105S', 'Fan',                       '160802010001A',   'Fan');
    await updatePN('SKT105S', 'Water Pump',                '160201000004A',   'Water Pump (SKT105S-spesifik)');
    await updatePN('SKT105S', 'Thermostat',                '160202000001A',   'Thermostat');

    // Electrical
    await updatePN('SKT105S', 'Battery',                   '60190637',        'Battery');

    // Lubrication
    await updatePN('SKT105S', 'Centralized Lubrication',   '152605000377A',   'Centralized Lubrication System');

    // ─────────────────────────────────────────────────────────────────
    // SYZ440C — chassis identik dengan SYZ326C (per instruksi user)
    // Engine: sama, Filters: sama, pakai PN SYZ326C sebagai acuan
    // ─────────────────────────────────────────────────────────────────
    console.log('\n--- SYZ440C ---');

    // Engine Oil Filters (sama dengan SYZ326C)
    await updatePN('SYZ440C', 'Oil Filter Element',        '160605020019',    'Oil Filter Element (SYZ326C ref)');
    await updatePN('SYZ440C', 'Engine Oil Filter',         '160605020019',    'Engine Oil Filter (SYZ326C ref)');

    // Fuel Filters (sama dengan SYZ326C)
    await updatePN('SYZ440C', 'Fuel Filter Element',       '160101120038A001','Fuel Filter Element (SYZ326C ref)');
    await updatePN('SYZ440C', 'Fuel Fine Filter',          '160101120038A001','Fuel Fine Filter (SYZ326C ref)');
    await updatePN('SYZ440C', 'Water Separator',           '1000424916',      'Water Separator (SYZ326C ref)');
    await updatePN('SYZ440C', 'Fuel Water Separator',      '1000424916',      'Fuel Water Separator (SYZ326C ref)');

    // Air Dryer (sama dengan SYZ326C)
    await updatePN('SYZ440C', 'Air Dryer Filter',          '152599000024A',   'Air Dryer Filter (SYZ326C ref)');
    await updatePN('SYZ440C', 'Air Dryer',                 '152599000024A',   'Air Dryer (SYZ326C ref)');
    await updatePN('SYZ440C', 'Air Handling Unit',         '152599000112A',   'Air Handling Unit (SYZ326C ref)');

    // Hydraulic Filters (sama dengan SYZ326C)
    await updatePN('SYZ440C', 'Filter, Oil Return',        '60101256',        'Oil Return Filter (SYZ326C ref)');
    await updatePN('SYZ440C', 'Oil Return Filter',         '60101256',        'Oil Return Filter (SYZ326C ref)');
    await updatePN('SYZ440C', 'Hydraulic Filter',          '60345316',        'Hydraulic Filter (SYZ326C ref)');

    // Belts
    await updatePN('SYZ440C', 'Belt',                      '60141428',        'Belt (SYZ326C ref)');
    await updatePN('SYZ440C', 'Poly V-Belt',               '160399000008A',   'Poly V-Belt (SYZ326C ref)');

    // Cooling
    await updatePN('SYZ440C', 'Fan',                       '160802010001A',   'Fan (SYZ326C ref)');
    await updatePN('SYZ440C', 'Water Pump',                '160102120008A076','Water Pump (SYZ326C ref)');
    await updatePN('SYZ440C', 'Thermostat',                '160202000001A',   'Thermostat (SYZ326C ref)');

    // Electrical
    await updatePN('SYZ440C', 'Battery',                   '60190637',        'Battery (SYZ326C ref)');

    // Relay Valve
    await updatePN('SYZ440C', 'Relay Valve',               '60330808',        'Relay Valve (SYZ326C ref)');

    // ─────────────────────────────────────────────────────────────────
    // SUMMARY REPORT
    // ─────────────────────────────────────────────────────────────────
    console.log('\n=== SUMMARY ===');
    const summary = await client.query(`
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
      const pct = Math.round((r.with_pn / r.total) * 100);
      console.log(`${r.unit_model}: ${r.with_pn}/${r.total} items punya PN (${pct}%) | null: ${r.still_null}`);
    }
    console.log('\n✅ Update selesai!');

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
