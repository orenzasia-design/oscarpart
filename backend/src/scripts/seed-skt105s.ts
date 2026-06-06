import { db } from '../config/database';
import logger from '../config/logger';

/**
 * Script untuk seed data PM SKT105S ke tabel yang sudah ada
 * Jalankan sekali: npx ts-node src/scripts/seed-skt105s.ts
 */
export async function seedSkt105sData(): Promise<void> {
  try {
    logger.info('Seeding SKT105S PM data...');

    // Cek apakah bundle SKT105S sudah punya items
    const checkItems = await db.query(`
      SELECT COUNT(*) as cnt FROM pm_bundle_items bi
      JOIN pm_bundles b ON b.id = bi.bundle_id
      WHERE b.unit_model = 'SKT105S'
    `);
    if (parseInt(checkItems.rows[0].cnt) > 0) {
      logger.info('SKT105S data already seeded, skipping');
      return;
    }

    // Data PM per interval (dari SANY OMM SKT105S, versi 12.2021)
    const skt105sItems: Record<number, Array<[number,string,string,string,null,number,string,string|null]>> = {
      250: [
        [1,'OIL',    'Engine Oil',                         'Drain and refill', null, 1, 'lot', '15W-40 CH-4 or equivalent'],
        [2,'FILTER', 'Engine Oil Filter Element',          'Replace',          null, 1, 'pcs', null],
        [3,'FILTER', 'Fuel Fine Filter Element',           'Replace',          null, 1, 'pcs', null],
        [4,'FILTER', 'Fuel Rough Filter',                  'Replace',          null, 1, 'pcs', null],
        [5,'FILTER', 'Fuel-Water Separator Filter',        'Replace',          null, 1, 'pcs', null],
        [6,'FILTER', 'Oil-Gas Separator Filter Element',   'Replace',          null, 1, 'pcs', null],
        [7,'CHECK',  'Engine Belt',                        'Examine',          null, 1, 'lot', null],
        [8,'CHECK',  'Fan Belt',                           'Examine',          null, 1, 'lot', null],
        [9,'CHECK',  'Wheel Rim Nuts',                     'Examine',          null, 1, 'lot', null],
        [10,'CHECK', 'Vehicle Brake Clearance',            'Examine',          null, 1, 'lot', null],
        [11,'CHECK', 'Transmission Shaft Bolt Torque',     'Adjust',           null, 1, 'lot', null],
        [12,'OIL',   'Transmission Oil',                   'Examine',          null, 1, 'lot', null],
        [13,'OIL',   'Drive Axle Oil',                     'Examine/Change',   null, 1, 'lot', null],
      ],
      500: [
        [1,'OIL',    'Engine Oil',                         'Drain and refill', null, 1, 'lot', '15W-40 CH-4 or equivalent'],
        [2,'FILTER', 'Engine Oil Filter Element',          'Replace',          null, 1, 'pcs', null],
        [3,'FILTER', 'Fuel Fine Filter Element',           'Replace',          null, 1, 'pcs', null],
        [4,'FILTER', 'Fuel Rough Filter',                  'Replace',          null, 1, 'pcs', null],
        [5,'FILTER', 'Fuel-Water Separator Filter',        'Replace',          null, 1, 'pcs', null],
        [6,'FILTER', 'Oil-Gas Separator Filter Element',   'Replace',          null, 1, 'pcs', null],
        [7,'FILTER', 'Air Filter Element',                 'Replace',          null, 1, 'pcs', null],
        [8,'CHECK',  'Vehicle Brake Clearance',            'Examine',          null, 1, 'lot', null],
        [9,'FILTER', 'Steering System Pressure Oil Filter','Replace',          null, 1, 'pcs', null],
        [10,'FILTER','Elevating Tank Breather Valve Filter','Replace',         null, 1, 'pcs', null],
        [11,'FILTER','Elevating Tank Oil Return Filter',   'Replace',          null, 1, 'pcs', null],
      ],
      1000: [
        [1,'OIL',    'Engine Oil',                         'Drain and refill', null, 1, 'lot', '15W-40 CH-4 or equivalent'],
        [2,'FILTER', 'Engine Oil Filter Element',          'Replace',          null, 1, 'pcs', null],
        [3,'FILTER', 'Fuel Fine Filter Element',           'Replace',          null, 1, 'pcs', null],
        [4,'FILTER', 'Fuel Rough Filter',                  'Replace',          null, 1, 'pcs', null],
        [5,'FILTER', 'Fuel-Water Separator Filter',        'Replace',          null, 1, 'pcs', null],
        [6,'FILTER', 'Oil-Gas Separator Filter Element',   'Replace',          null, 1, 'pcs', null],
        [7,'FILTER', 'Air Filter Element',                 'Replace',          null, 1, 'pcs', null],
        [8,'FILTER', 'Steering System Pressure Oil Filter','Replace',          null, 1, 'pcs', null],
        [9,'FILTER', 'Elevating Tank Breather Valve Filter','Replace',         null, 1, 'pcs', null],
        [10,'FILTER','Elevating Tank Oil Return Filter',   'Replace',          null, 1, 'pcs', null],
        [11,'CHECK', 'Drive System',                       'Examine/Adjust',   null, 1, 'lot', null],
        [12,'CHECK', 'Suspension System',                  'Examine',          null, 1, 'lot', null],
        [13,'OIL',   'Transmission Oil',                   'Examine',          null, 1, 'lot', null],
        [14,'OIL',   'Drive Axle Oil',                     'Examine/Change',   null, 1, 'lot', null],
      ],
      2000: [
        [1,'CHECK', 'Fuel Tank',                           'Clean',            null, 1, 'lot', null],
        [2,'CHECK', 'Drive Axle',                          'Examine/Clean',    null, 1, 'lot', null],
        [3,'CHECK', 'Front Shaft Axial Clearance',         'Adjust',           null, 1, 'lot', null],
        [4,'CHECK', 'Shaft Knuckle Rotation Torque',       'Adjust',           null, 1, 'lot', null],
      ],
      3000: [
        [1,'OIL',   'Hydraulic Oil Full System',           'Change',           null, 1, 'lot', 'Per spec SKT105S OMM'],
      ],
      4000: [
        [1,'CHECK', 'Radiator',                 'Clean',            null, 1, 'lot', null],
        [2,'CHECK', 'Internal Cooling System',  'Examine/Clean',    null, 1, 'lot', null],
        [3,'CHECK', 'Brake Drums Wear',          'Examine',          null, 1, 'lot', null],
        [4,'OIL',   'Transmission Oil',          'Change',           null, 1, 'lot', null],
        [5,'FILTER','Transmission Oil Filter',   'Replace',          null, 1, 'pcs', null],
      ],
    };

    for (const [intervalStr, items] of Object.entries(skt105sItems)) {
      const interval = parseInt(intervalStr);
      const bundleResult = await db.query(
        `SELECT id FROM pm_bundles WHERE unit_model = 'SKT105S' AND interval_hm = $1`,
        [interval]
      );
      if (bundleResult.rows.length === 0) {
        logger.warn(`Bundle SKT105S ${interval}H tidak ditemukan, skip`);
        continue;
      }
      const bundleId = bundleResult.rows[0].id;
      for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
        await db.query(
          `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
        );
      }
      logger.info(`✅ SKT105S ${interval}H: ${items.length} items inserted`);
    }

    logger.info('✅ SKT105S seed completed!');
  } catch (error) {
    logger.error('SKT105S seed failed:', error);
    throw error;
  }
}

// Auto-run jika dipanggil langsung
seedSkt105sData().then(() => process.exit(0)).catch(() => process.exit(1));
