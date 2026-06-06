import { db } from '../config/database';
import logger from '../config/logger';

export async function seedSkt80sData(): Promise<void> {
  try {
    // Cek apakah SKT80S sudah punya items
    const check = await db.query(`
      SELECT COUNT(*) as cnt FROM pm_bundle_items pbi
      JOIN pm_bundles pb ON pbi.bundle_id = pb.id
      WHERE pb.unit_model = 'SKT80S'
    `);
    if (parseInt(check.rows[0].cnt) > 0) {
      logger.info('SKT80S items already seeded, skipping');
      return;
    }

    logger.info('Seeding SKT80S PM data from GUI-SVC-SS-SKT80S-02...');

    const intervals = [250, 500, 1000, 2000, 3000, 4000];
    for (const interval of intervals) {
      const bundleRes = await db.query(
        `SELECT id FROM pm_bundles WHERE unit_model = 'SKT80S' AND interval_hm = $1`,
        [interval]
      );
      if (!bundleRes.rows.length) {
        logger.warn(`Bundle SKT80S ${interval}H not found, skipping`);
        continue;
      }
      const bundleId = bundleRes.rows[0].id;

      let items: any[] = [];

      if (interval === 250 || interval === 500) {
        items = [
          [1, 'OIL',    'Engine Oil (Minyak Mesin)',                'Drain and refill', null,               null, 'lot', 'SAE 15W/40 CH-4'],
          [2, 'OIL',    'Air Cleaner Oil Bath',                     'Drain and refill', null,               3.5,  'L',   'SAE 15W/40 CH-4'],
          [3, 'FILTER', 'Engine Oil Filter Element',                'Replace',          '60327523',         2,    'pcs', null],
          [4, 'FILTER', 'Fuel Rough Filter (Saringan Kasar)',       'Replace',          '160604020017',     1,    'pcs', null],
          [5, 'FILTER', 'Fuel Fine Filter Cartridge',               'Replace',          '160604020018',     1,    'pcs', null],
          [6, 'FILTER', 'Oil-Water Separator Filter Element',       'Replace',          '160603020024A',    1,    'pcs', null],
        ];
      } else if (interval === 1000) {
        items = [
          [1,  'OIL',    'Engine Oil (Minyak Mesin)',               'Drain and refill', null,               null, 'lot', 'SAE 15W/40 CH-4'],
          [2,  'OIL',    'Air Cleaner Oil Bath',                    'Drain and refill', null,               3.5,  'L',   'SAE 15W/40 CH-4'],
          [3,  'OIL',    'Transmission Oil (ATF)',                  'Drain and refill', null,               null, 'lot', 'ATF'],
          [4,  'OIL',    'Middle Axle Main Reducer Oil',            'Drain and refill', null,               20,   'L',   'SAE 85W/140'],
          [5,  'OIL',    'Middle Axle Wheel Edge Reducer Oil',      'Drain and refill', null,               12,   'L',   'SAE 85W/140'],
          [6,  'OIL',    'Rear Axle Main Reducer Oil',              'Drain and refill', null,               20,   'L',   'SAE 85W/140'],
          [7,  'OIL',    'Rear Axle Wheel Edge Reducer Oil',        'Clean and refill', null,               12,   'L',   'SAE 85W/140'],
          [8,  'FILTER', 'Engine Oil Filter Element',               'Replace',          '60327523',         2,    'pcs', null],
          [9,  'FILTER', 'Fuel Rough Filter (Saringan Kasar)',      'Replace',          '160604020017',     1,    'pcs', null],
          [10, 'FILTER', 'Fuel Fine Filter Cartridge',              'Replace',          '160604020018',     1,    'pcs', null],
          [11, 'FILTER', 'Oil-Water Separator Filter Element',      'Replace',          '160603020024A',    1,    'pcs', null],
          [12, 'FILTER', 'HYD Oil Return Filter',                   'Replace',          '60167851',         1,    'pcs', null],
          [13, 'FILTER', 'Hydraulic Steering Filter Element',       'Replace',          '60345316',         1,    'pcs', null],
          [14, 'FILTER', 'AC Fresh Air Filter',                     'Replace',          '141502000017',     1,    'pcs', null],
          [15, 'FILTER', 'Transmission (TM) Filter',                'Replace',          '130202000093A023', 1,    'pcs', null],
          [16, 'FILTER', 'Air Filter Outer Element',                'Replace',          '160602020020A',    1,    'pcs', null],
          [17, 'FILTER', 'Air Filter Inner Element',                'Replace',          '160602030016A',    1,    'pcs', null],
          [18, 'FILTER', 'Wet Air Cleaner Oil Bath Filter Element', 'Replace',          '160699000013A',    1,    'pcs', null],
          [19, 'FILTER', 'Magnetic Filter',                         'Replace',          '130202000093A026', 1,    'pcs', null],
          [20, 'FILTER', 'Hydraulic Tank Breather Filter',          'Replace',          '24001922',         1,    'pcs', null],
          [21, 'FILTER', 'Air Dryer (Pengering Udara)',             'Replace',          '60060965',         1,    'pcs', null],
        ];
      } else if (interval === 2000) {
        items = [
          [1,  'OIL',    'Engine Oil (Minyak Mesin)',               'Drain and refill', null,               null, 'lot', 'SAE 15W/40 CH-4'],
          [2,  'OIL',    'Transmission Oil (ATF)',                  'Drain and refill', null,               null, 'lot', 'ATF'],
          [3,  'OIL',    'Middle Axle Main Reducer Oil',            'Drain and refill', null,               20,   'L',   'SAE 85W/140'],
          [4,  'OIL',    'Middle Axle Wheel Edge Reducer Oil',      'Drain and refill', null,               12,   'L',   'SAE 85W/140'],
          [5,  'OIL',    'Rear Axle Main Reducer Oil',              'Drain and refill', null,               20,   'L',   'SAE 85W/140'],
          [6,  'OIL',    'Rear Axle Wheel Edge Reducer Oil',        'Clean and refill', null,               12,   'L',   'SAE 85W/140'],
          [7,  'FILTER', 'Engine Oil Filter Element',               'Replace',          '60327523',         2,    'pcs', null],
          [8,  'FILTER', 'Fuel Rough Filter (Saringan Kasar)',      'Replace',          '160604020017',     1,    'pcs', null],
          [9,  'FILTER', 'Fuel Fine Filter Cartridge',              'Replace',          '160604020018',     1,    'pcs', null],
          [10, 'FILTER', 'Oil-Water Separator Filter Element',      'Replace',          '160603020024A',    1,    'pcs', null],
          [11, 'FILTER', 'HYD Oil Return Filter',                   'Replace',          '60167851',         1,    'pcs', null],
          [12, 'FILTER', 'Hydraulic Steering Filter Element',       'Replace',          '60345316',         1,    'pcs', null],
          [13, 'FILTER', 'AC Fresh Air Filter',                     'Replace',          '141502000017',     1,    'pcs', null],
          [14, 'FILTER', 'Transmission (TM) Filter',                'Replace',          '130202000093A023', 1,    'pcs', null],
          [15, 'FILTER', 'Air Filter Outer Element',                'Replace',          '160602020020A',    1,    'pcs', null],
          [16, 'FILTER', 'Air Filter Inner Element',                'Replace',          '160602030016A',    1,    'pcs', null],
          [17, 'FILTER', 'Wet Air Cleaner Oil Bath Filter Element', 'Replace',          '160699000013A',    1,    'pcs', null],
          [18, 'FILTER', 'Magnetic Filter',                         'Replace',          '130202000093A026', 1,    'pcs', null],
          [19, 'FILTER', 'Hydraulic Tank Breather Filter',          'Replace',          '24001922',         1,    'pcs', null],
          [20, 'FILTER', 'Air Dryer (Pengering Udara)',             'Replace',          '60060965',         1,    'pcs', null],
        ];
      } else if (interval === 3000) {
        items = [
          [1, 'OIL',    'Hydraulic Oil',                            'Drain and refill', null,               162,  'L',   'Caltex HDZ46'],
          [2, 'FILTER', 'Engine Oil Filter Element',                'Replace',          '60327523',         2,    'pcs', null],
          [3, 'FILTER', 'Fuel Rough Filter',                        'Replace',          '160604020017',     1,    'pcs', null],
          [4, 'FILTER', 'Fuel Fine Filter Cartridge',               'Replace',          '160604020018',     1,    'pcs', null],
          [5, 'FILTER', 'HYD Oil Return Filter',                    'Replace',          '60167851',         1,    'pcs', null],
          [6, 'FILTER', 'Hydraulic Steering Filter Element',        'Replace',          '60345316',         1,    'pcs', null],
          [7, 'FILTER', 'Air Filter Outer Element',                 'Replace',          '160602020020A',    1,    'pcs', null],
          [8, 'FILTER', 'Air Filter Inner Element',                 'Replace',          '160602030016A',    1,    'pcs', null],
          [9, 'FILTER', 'Air Dryer (Pengering Udara)',              'Replace',          '60060965',         1,    'pcs', null],
        ];
      } else if (interval === 4000) {
        items = [
          [1,  'OIL',    'Radiator Coolant',                        'Drain and refill', null,               55,   'L',   'L-35 Antifreeze'],
          [2,  'OIL',    'Hydraulic Oil',                           'Drain and refill', null,               162,  'L',   'Caltex HDZ46'],
          [3,  'FILTER', 'Engine Oil Filter Element',               'Replace',          '60327523',         2,    'pcs', null],
          [4,  'FILTER', 'Fuel Rough Filter',                       'Replace',          '160604020017',     1,    'pcs', null],
          [5,  'FILTER', 'Fuel Fine Filter Cartridge',              'Replace',          '160604020018',     1,    'pcs', null],
          [6,  'FILTER', 'Oil-Water Separator Filter Element',      'Replace',          '160603020024A',    1,    'pcs', null],
          [7,  'FILTER', 'HYD Oil Return Filter',                   'Replace',          '60167851',         1,    'pcs', null],
          [8,  'FILTER', 'Hydraulic Steering Filter Element',       'Replace',          '60345316',         1,    'pcs', null],
          [9,  'FILTER', 'AC Fresh Air Filter',                     'Replace',          '141502000017',     1,    'pcs', null],
          [10, 'FILTER', 'Transmission (TM) Filter',                'Replace',          '130202000093A023', 1,    'pcs', null],
          [11, 'FILTER', 'Air Filter Outer Element',                'Replace',          '160602020020A',    1,    'pcs', null],
          [12, 'FILTER', 'Air Filter Inner Element',                'Replace',          '160602030016A',    1,    'pcs', null],
          [13, 'FILTER', 'Wet Air Cleaner Oil Bath Filter Element', 'Replace',          '160699000013A',    1,    'pcs', null],
          [14, 'FILTER', 'Magnetic Filter',                         'Replace',          '130202000093A026', 1,    'pcs', null],
          [15, 'FILTER', 'Hydraulic Tank Breather Filter',          'Replace',          '24001922',         1,    'pcs', null],
          [16, 'FILTER', 'Air Dryer (Pengering Udara)',             'Replace',          '60060965',         1,    'pcs', null],
        ];
      }

      for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
        await db.query(
          `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
        );
      }
      logger.info(`✅ SKT80S ${interval}H — ${items.length} items seeded`);
    }

    logger.info('✅ SKT80S seed completed successfully');
  } catch (error) {
    logger.error('SKT80S seed failed:', error);
    throw error;
  }
}
