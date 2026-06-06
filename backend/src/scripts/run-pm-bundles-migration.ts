import { db } from '../config/database';
import logger from '../config/logger';

export async function runPmBundlesMigration(): Promise<void> {
  try {
    // Cek apakah tabel sudah ada
    const check = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pm_bundles'
      ) AS exists`
    );
    if (check.rows[0].exists) {
      logger.info('pm_bundles table already exists, skipping migration');
      return;
    }

    logger.info('Running pm_bundles migration...');

    await db.query(`
      CREATE TABLE IF NOT EXISTS pm_bundles (
        id SERIAL PRIMARY KEY,
        unit_model VARCHAR(20) NOT NULL,
        interval_hm INTEGER NOT NULL,
        bundle_name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pm_bundle_items (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER REFERENCES pm_bundles(id) ON DELETE CASCADE,
        item_no INTEGER,
        component_category VARCHAR(50),
        component_name VARCHAR(200) NOT NULL,
        action VARCHAR(100),
        part_number VARCHAR(100),
        qty NUMERIC(10,2),
        unit VARCHAR(20),
        spec VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_pm_bundles_unit_model ON pm_bundles(unit_model)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_pm_bundles_interval ON pm_bundles(interval_hm)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_pm_bundle_items_bundle_id ON pm_bundle_items(bundle_id)`);

    // Seed bundles
    const bundlesSeed = [
      // SYZ326C
      ['SYZ326C', 250,  'PM 250H SYZ326C',  'Service bundle 250 jam untuk SANY SYZ326C-8WR'],
      ['SYZ326C', 500,  'PM 500H SYZ326C',  'Service bundle 500 jam untuk SANY SYZ326C-8WR'],
      ['SYZ326C', 1000, 'PM 1000H SYZ326C', 'Service bundle 1000 jam untuk SANY SYZ326C-8WR'],
      ['SYZ326C', 2000, 'PM 2000H SYZ326C', 'Service bundle 2000 jam untuk SANY SYZ326C-8WR'],
      ['SYZ326C', 3000, 'PM 3000H SYZ326C', 'Service bundle 3000 jam untuk SANY SYZ326C-8WR'],
      ['SYZ326C', 4000, 'PM 4000H SYZ326C', 'Service bundle 4000 jam untuk SANY SYZ326C-8WR'],
      // SKT90S
      ['SKT90S', 250,  'PM 250H SKT90S',  'Service bundle 250 jam - SKT90S Mining Wide-Body Dump Truck'],
      ['SKT90S', 500,  'PM 500H SKT90S',  'Service bundle 500 jam - SKT90S Mining Wide-Body Dump Truck'],
      ['SKT90S', 1000, 'PM 1000H SKT90S', 'Service bundle 1000 jam - SKT90S Mining Wide-Body Dump Truck'],
      ['SKT90S', 2000, 'PM 2000H SKT90S', 'Service bundle 2000 jam - SKT90S Mining Wide-Body Dump Truck'],
      ['SKT90S', 3000, 'PM 3000H SKT90S', 'Service bundle 3000 jam - SKT90S Mining Wide-Body Dump Truck'],
      ['SKT90S', 4000, 'PM 4000H SKT90S', 'Service bundle 4000 jam - SKT90S Mining Wide-Body Dump Truck'],
      // SKT80S
      ['SKT80S', 250,  'PM 250H SKT80S',  'Service bundle 250 jam - SKT80S Wide Body Truck'],
      ['SKT80S', 500,  'PM 500H SKT80S',  'Service bundle 500 jam - SKT80S Wide Body Truck'],
      ['SKT80S', 1000, 'PM 1000H SKT80S', 'Service bundle 1000 jam - SKT80S Wide Body Truck'],
      ['SKT80S', 2000, 'PM 2000H SKT80S', 'Service bundle 2000 jam - SKT80S Wide Body Truck'],
      ['SKT80S', 3000, 'PM 3000H SKT80S', 'Service bundle 3000 jam - SKT80S Wide Body Truck'],
      ['SKT80S', 4000, 'PM 4000H SKT80S', 'Service bundle 4000 jam - SKT80S Wide Body Truck'],
      // SKT105S
      ['SKT105S', 250,  'PM 250H SKT105S',  'Service bundle 250 jam - SKT105S Mining Wide-Body Dump Truck'],
      ['SKT105S', 500,  'PM 500H SKT105S',  'Service bundle 500 jam - SKT105S Mining Wide-Body Dump Truck'],
      ['SKT105S', 1000, 'PM 1000H SKT105S', 'Service bundle 1000 jam - SKT105S Mining Wide-Body Dump Truck'],
      ['SKT105S', 2000, 'PM 2000H SKT105S', 'Service bundle 2000 jam - SKT105S Mining Wide-Body Dump Truck'],
      ['SKT105S', 3000, 'PM 3000H SKT105S', 'Service bundle 3000 jam - SKT105S Mining Wide-Body Dump Truck'],
      ['SKT105S', 4000, 'PM 4000H SKT105S', 'Service bundle 4000 jam - SKT105S Mining Wide-Body Dump Truck'],
      // SRT95C
      ['SRT95C', 250,  'PM 250H SRT95C',  'Service bundle 250 jam - SRT95C Off-Highway Truck'],
      ['SRT95C', 500,  'PM 500H SRT95C',  'Service bundle 500 jam - SRT95C Off-Highway Truck'],
      ['SRT95C', 1000, 'PM 1000H SRT95C', 'Service bundle 1000 jam - SRT95C Off-Highway Truck'],
      ['SRT95C', 2000, 'PM 2000H SRT95C', 'Service bundle 2000 jam - SRT95C Off-Highway Truck'],
      ['SRT95C', 3000, 'PM 3000H SRT95C', 'Service bundle 3000 jam - SRT95C Off-Highway Truck'],
      ['SRT95C', 4000, 'PM 4000H SRT95C', 'Service bundle 4000 jam - SRT95C Off-Highway Truck'],
      // SYZ440C
      ['SYZ440C', 250,  'PM 250H SYZ440C',  'Service bundle 250 jam - SYZ440C Dump Truck'],
      ['SYZ440C', 500,  'PM 500H SYZ440C',  'Service bundle 500 jam - SYZ440C Dump Truck'],
      ['SYZ440C', 1000, 'PM 1000H SYZ440C', 'Service bundle 1000 jam - SYZ440C Dump Truck'],
      ['SYZ440C', 2000, 'PM 2000H SYZ440C', 'Service bundle 2000 jam - SYZ440C Dump Truck'],
      ['SYZ440C', 3000, 'PM 3000H SYZ440C', 'Service bundle 3000 jam - SYZ440C Dump Truck'],
      ['SYZ440C', 4000, 'PM 4000H SYZ440C', 'Service bundle 4000 jam - SYZ440C Dump Truck'],
    ] as const;

    for (const [model, interval, name, desc] of bundlesSeed) {
      const res = await db.query(
        `INSERT INTO pm_bundles (unit_model, interval_hm, bundle_name, description)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [model, interval, name, desc]
      );
      const bundleId = res.rows[0].id;

      // Seed items only for units with confirmed data
      if (model === 'SYZ326C' && interval === 250) {
        const items250 = [
          [1,'OIL',    'Engine Oil',          'Drain and refill', null,               30,  'L',   '15W-40 CH-4'],
          [2,'OIL',    'Oil Bath Air Filter', 'Check and refill', null,               3,   'L',   '15W-40 CH-4'],
          [3,'FILTER', 'Fuel Filter Element', 'Replace',          '160101120038A001', 2,   'pcs', null],
          [4,'FILTER', 'Water Separator',     'Replace',          '1000424916',       1,   'pcs', null],
          [5,'FILTER', 'Oil Filter Element',  'Replace',          '160605020019',     2,   'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items250) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SYZ326C' && interval === 500) {
        const items500 = [
          [1,'OIL',    'Engine Oil',                 'Drain and refill', null,               30, 'L',   '15W-40 CH-4'],
          [2,'OIL',    'Oil Bath Air Filter',         'Check and refill', null,               3,  'L',   '15W-40 CH-4'],
          [3,'OIL',    'Steering Hydraulic System',   'Check and refill', null,               8,  'L',   'ATF III F'],
          [4,'OIL',    'Hydraulic Clutch Mechanism',  'Check and refill', null,               1,  'L',   'Brake Fluid DOT 3'],
          [5,'FILTER', 'Fuel Filter Element',         'Replace',          '160101120038A001', 2,  'pcs', null],
          [6,'FILTER', 'Water Separator',             'Replace',          '1000424916',       1,  'pcs', null],
          [7,'FILTER', 'Oil Filter Element',          'Replace',          '160605020019',     2,  'pcs', null],
          [8,'FILTER', 'Air Dryer Filter SYZ326',     'Replace',          '152599000172A001', 1,  'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items500) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SYZ326C' && interval === 1000) {
        const items1000 = [
          [1,'OIL',    'Engine Oil',                       'Drain and refill', null,               30,  'L',   '15W-40 CH-4'],
          [2,'OIL',    'Oil Bath Air Filter',               'Check and refill', null,               3,   'L',   '15W-40 CH-4'],
          [3,'OIL',    'Transmission Oil',                  'Drain and refill', null,               14,  'L',   'Gear Oil 85W/90 GL5'],
          [4,'OIL',    'Steering Hydraulic System',         'Check and refill', null,               8,   'L',   'ATF III F'],
          [5,'OIL',    'Middle Axle Main Reducer',          'Drain and refill', null,               18,  'L',   'Gear Oil 85W-140 GL5'],
          [6,'OIL',    'Middle Axle Hub Reducer',           'Drain and refill', null,               8.3, 'L',   'Gear Oil 85W-140 GL5'],
          [7,'OIL',    'Rear Axle Main Reducer',            'Drain and refill', null,               18,  'L',   'Gear Oil 85W-140 GL5'],
          [8,'OIL',    'Rear Axle Hub Reducer',             'Check and refill', null,               8.3, 'L',   'Gear Oil 85W-140 GL5'],
          [9,'OIL',    'Hydraulic Clutch Mechanism',        'Check and refill', null,               1,   'L',   'Brake Fluid DOT 3'],
          [10,'OIL',   'Hydraulic Mechanism Lifting Cab',   'Check and refill', null,               1,   'L',   'ISO VG-46'],
          [11,'FILTER','Fuel Filter Element',               'Replace',          '160101120038A001', 2,   'pcs', null],
          [12,'FILTER','Water Separator',                   'Replace',          '1000424916',       1,   'pcs', null],
          [13,'FILTER','Oil Filter Element',                'Replace',          '160605020019',     2,   'pcs', null],
          [14,'FILTER','Air Dryer Filter SYZ326',           'Replace',          '152599000172A001', 1,   'pcs', null],
          [15,'FILTER','Air Filter Outer Element AF25276',  'Replace',          '160602020036A',    1,   'pcs', null],
          [16,'FILTER','Air Filter Inner Element',          'Replace',          '160602030026A',    1,   'pcs', null],
          [17,'FILTER','Fresh Air Filter AC',               'Replace',          '141502000017',     1,   'pcs', null],
          [18,'FILTER','Filter Strainer',                   'Replace',          '60022607',         1,   'pcs', null],
          [19,'FILTER','Power Steering Filter Element',     'Replace',          'A222100000393',    1,   'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items1000) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SYZ326C' && interval === 3000) {
        const items3000 = [
          [1,'OIL','Hydraulic Tipper Vessel', 'Change and refill', null, 100, 'L', 'ISO VG-46'],
          [2,'OIL','Engine Cooling System',   'Change and refill', null, 45,  'L', 'Ethylene Glycol'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items3000) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT90S' && interval === 500) {
        const items = [
          [1,'OIL',    'Engine Oil',              'Drain and refill', null, 1, 'lot', '15W-40 or equivalent'],
          [2,'FILTER', 'Engine Oil Filter',        'Replace',          null, 1, 'pcs', null],
          [3,'FILTER', 'Fuel Filter Element',      'Replace',          null, 1, 'pcs', null],
          [4,'FILTER', 'Fuel-Water Separator',     'Replace',          null, 1, 'pcs', null],
          [5,'FILTER', 'Oil-Gas Separator',        'Check/Maintain',   null, 1, 'pcs', null],
          [6,'FILTER', 'Air Filter Element',       'Check/Clean',      null, 1, 'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT90S' && interval === 1000) {
        const items = [
          [1,'OIL',    'Engine Oil',              'Drain and refill', null, 1, 'lot', '15W-40 or equivalent'],
          [2,'OIL',    'Drive Axle Oil',           'Check/Inspect',    null, 1, 'lot', null],
          [3,'FILTER', 'Engine Oil Filter',        'Replace',          null, 1, 'pcs', null],
          [4,'FILTER', 'Fuel Filter Element',      'Replace',          null, 1, 'pcs', null],
          [5,'FILTER', 'Fuel-Water Separator',     'Replace',          null, 1, 'pcs', null],
          [6,'FILTER', 'Air Filter Element',       'Replace',          null, 1, 'pcs', null],
          [7,'CHECK',  'Hydraulic System',         'Full Inspection',  null, 1, 'lot', null],
          [8,'CHECK',  'Suspension System',        'Inspect',          null, 1, 'lot', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT90S' && interval === 3000) {
        const items = [
          [1,'OIL',   'Hydraulic Oil Full System', 'Replace',      null, 1, 'lot', 'Per spec SKT90S'],
          [2,'CHECK', 'Brake Drum',                 'Inspect wear', null, 1, 'lot', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
    }

    logger.info('✅ pm_bundles migration completed successfully');
  } catch (error) {
    logger.error('pm_bundles migration failed:', error);
    throw error;
  }
}
