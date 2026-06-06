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

      // ============================================================
      // SYZ326C — Data dari Check Sheet Service PT. PBT (lengkap dengan part number)
      // ============================================================
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

      // ============================================================
      // SKT90S — Data dari SANY OMM (tanpa part number)
      // ============================================================
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

      // ============================================================
      // SKT105S — Data dari SANY OMM versi 12.2021 (tanpa part number)
      // ============================================================
      if (model === 'SKT105S' && interval === 250) {
        const items = [
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
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT105S' && interval === 500) {
        const items = [
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
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT105S' && interval === 1000) {
        const items = [
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
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT105S' && interval === 2000) {
        const items = [
          [1,'CHECK', 'Fuel Tank',                           'Clean',            null, 1, 'lot', null],
          [2,'CHECK', 'Drive Axle',                          'Examine/Clean',    null, 1, 'lot', null],
          [3,'CHECK', 'Front Shaft Axial Clearance',         'Adjust',           null, 1, 'lot', null],
          [4,'CHECK', 'Shaft Knuckle Rotation Torque',       'Adjust',           null, 1, 'lot', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT105S' && interval === 3000) {
        const items = [
          [1,'OIL',   'Hydraulic Oil Full System', 'Change',       null, 1, 'lot', 'Per spec SKT105S OMM'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT105S' && interval === 4000) {
        const items = [
          [1,'CHECK', 'Radiator',                 'Clean',            null, 1, 'lot', null],
          [2,'CHECK', 'Internal Cooling System',  'Examine/Clean',    null, 1, 'lot', null],
          [3,'CHECK', 'Brake Drums Wear',          'Examine',          null, 1, 'lot', null],
          [4,'OIL',   'Transmission Oil',          'Change',           null, 1, 'lot', null],
          [5,'FILTER','Transmission Oil Filter',   'Replace',          null, 1, 'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }

      // ============================================================
      // SKT80S — Data dari Lembar Cek Layanan GUI-SVC-SS-SKT80S-02 (dengan part number)
      // ============================================================
      if (model === 'SKT80S' && interval === 250) {
        const items = [
          [1, 'OIL',    'Engine Oil (Minyak Mesin)',                 'Drain and refill', null,             null, 'lot', 'SAE 15W/40 CH-4'],
          [2, 'OIL',    'Air Cleaner Oil Bath',                      'Drain and refill', null,             3.5,  'L',   'SAE 15W/40 CH-4'],
          [3, 'FILTER', 'Engine Oil Filter Element',                 'Replace',          '60327523',       2,    'pcs', null],
          [4, 'FILTER', 'Fuel Rough Filter (Saringan Kasar)',        'Replace',          '160604020017',   1,    'pcs', null],
          [5, 'FILTER', 'Fuel Fine Filter Cartridge',                'Replace',          '160604020018',   1,    'pcs', null],
          [6, 'FILTER', 'Oil-Water Separator Filter Element',        'Replace',          '160603020024A',  1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT80S' && interval === 500) {
        // 500H = sama dengan 250H (interval 250 jam berulang)
        const items = [
          [1, 'OIL',    'Engine Oil (Minyak Mesin)',                 'Drain and refill', null,             null, 'lot', 'SAE 15W/40 CH-4'],
          [2, 'OIL',    'Air Cleaner Oil Bath',                      'Drain and refill', null,             3.5,  'L',   'SAE 15W/40 CH-4'],
          [3, 'FILTER', 'Engine Oil Filter Element',                 'Replace',          '60327523',       2,    'pcs', null],
          [4, 'FILTER', 'Fuel Rough Filter (Saringan Kasar)',        'Replace',          '160604020017',   1,    'pcs', null],
          [5, 'FILTER', 'Fuel Fine Filter Cartridge',                'Replace',          '160604020018',   1,    'pcs', null],
          [6, 'FILTER', 'Oil-Water Separator Filter Element',        'Replace',          '160603020024A',  1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT80S' && interval === 1000) {
        const items = [
          [1,  'OIL',    'Engine Oil (Minyak Mesin)',                'Drain and refill', null,             null, 'lot', 'SAE 15W/40 CH-4'],
          [2,  'OIL',    'Air Cleaner Oil Bath',                     'Drain and refill', null,             3.5,  'L',   'SAE 15W/40 CH-4'],
          [3,  'OIL',    'Transmission Oil (ATF)',                   'Drain and refill', null,             null, 'lot', 'ATF'],
          [4,  'OIL',    'Middle Axle Main Reducer Oil',             'Drain and refill', null,             20,   'L',   'SAE 85W/140'],
          [5,  'OIL',    'Middle Axle Wheel Edge Reducer Oil',       'Drain and refill', null,             12,   'L',   'SAE 85W/140'],
          [6,  'OIL',    'Rear Axle Main Reducer Oil',               'Drain and refill', null,             20,   'L',   'SAE 85W/140'],
          [7,  'OIL',    'Rear Axle Wheel Edge Reducer Oil',         'Clean and refill', null,             12,   'L',   'SAE 85W/140'],
          [8,  'FILTER', 'Engine Oil Filter Element',                'Replace',          '60327523',       2,    'pcs', null],
          [9,  'FILTER', 'Fuel Rough Filter (Saringan Kasar)',       'Replace',          '160604020017',   1,    'pcs', null],
          [10, 'FILTER', 'Fuel Fine Filter Cartridge',               'Replace',          '160604020018',   1,    'pcs', null],
          [11, 'FILTER', 'Oil-Water Separator Filter Element',       'Replace',          '160603020024A',  1,    'pcs', null],
          [12, 'FILTER', 'HYD Oil Return Filter',                    'Replace',          '60167851',       1,    'pcs', null],
          [13, 'FILTER', 'Hydraulic Steering Filter Element',        'Replace',          '60345316',       1,    'pcs', null],
          [14, 'FILTER', 'AC Fresh Air Filter',                      'Replace',          '141502000017',   1,    'pcs', null],
          [15, 'FILTER', 'Transmission (TM) Filter',                 'Replace',          '130202000093A023', 1,  'pcs', null],
          [16, 'FILTER', 'Air Filter Outer Element',                 'Replace',          '160602020020A',  1,    'pcs', null],
          [17, 'FILTER', 'Air Filter Inner Element',                 'Replace',          '160602030016A',  1,    'pcs', null],
          [18, 'FILTER', 'Wet Air Cleaner Oil Bath Filter Element',  'Replace',          '160699000013A',  1,    'pcs', null],
          [19, 'FILTER', 'Magnetic Filter',                          'Replace',          '130202000093A026', 1,  'pcs', null],
          [20, 'FILTER', 'Hydraulic Tank Breather Filter',           'Replace',          '24001922',       1,    'pcs', null],
          [21, 'FILTER', 'Air Dryer (Pengering Udara)',              'Replace',          '60060965',       1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT80S' && interval === 2000) {
        // 2000H = 1000H items + repeat
        const items = [
          [1,  'OIL',    'Engine Oil (Minyak Mesin)',                'Drain and refill', null,             null, 'lot', 'SAE 15W/40 CH-4'],
          [2,  'OIL',    'Transmission Oil (ATF)',                   'Drain and refill', null,             null, 'lot', 'ATF'],
          [3,  'OIL',    'Middle Axle Main Reducer Oil',             'Drain and refill', null,             20,   'L',   'SAE 85W/140'],
          [4,  'OIL',    'Middle Axle Wheel Edge Reducer Oil',       'Drain and refill', null,             12,   'L',   'SAE 85W/140'],
          [5,  'OIL',    'Rear Axle Main Reducer Oil',               'Drain and refill', null,             20,   'L',   'SAE 85W/140'],
          [6,  'OIL',    'Rear Axle Wheel Edge Reducer Oil',         'Clean and refill', null,             12,   'L',   'SAE 85W/140'],
          [7,  'FILTER', 'Engine Oil Filter Element',                'Replace',          '60327523',       2,    'pcs', null],
          [8,  'FILTER', 'Fuel Rough Filter (Saringan Kasar)',       'Replace',          '160604020017',   1,    'pcs', null],
          [9,  'FILTER', 'Fuel Fine Filter Cartridge',               'Replace',          '160604020018',   1,    'pcs', null],
          [10, 'FILTER', 'Oil-Water Separator Filter Element',       'Replace',          '160603020024A',  1,    'pcs', null],
          [11, 'FILTER', 'HYD Oil Return Filter',                    'Replace',          '60167851',       1,    'pcs', null],
          [12, 'FILTER', 'Hydraulic Steering Filter Element',        'Replace',          '60345316',       1,    'pcs', null],
          [13, 'FILTER', 'AC Fresh Air Filter',                      'Replace',          '141502000017',   1,    'pcs', null],
          [14, 'FILTER', 'Transmission (TM) Filter',                 'Replace',          '130202000093A023', 1,  'pcs', null],
          [15, 'FILTER', 'Air Filter Outer Element',                 'Replace',          '160602020020A',  1,    'pcs', null],
          [16, 'FILTER', 'Air Filter Inner Element',                 'Replace',          '160602030016A',  1,    'pcs', null],
          [17, 'FILTER', 'Wet Air Cleaner Oil Bath Filter Element',  'Replace',          '160699000013A',  1,    'pcs', null],
          [18, 'FILTER', 'Magnetic Filter',                          'Replace',          '130202000093A026', 1,  'pcs', null],
          [19, 'FILTER', 'Hydraulic Tank Breather Filter',           'Replace',          '24001922',       1,    'pcs', null],
          [20, 'FILTER', 'Air Dryer (Pengering Udara)',              'Replace',          '60060965',       1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT80S' && interval === 3000) {
        const items = [
          [1, 'OIL',    'Hydraulic Oil',                             'Drain and refill', null,             162,  'L',   'Caltex HDZ46'],
          [2, 'FILTER', 'Engine Oil Filter Element',                 'Replace',          '60327523',       2,    'pcs', null],
          [3, 'FILTER', 'Fuel Rough Filter',                        'Replace',          '160604020017',   1,    'pcs', null],
          [4, 'FILTER', 'Fuel Fine Filter Cartridge',                'Replace',          '160604020018',   1,    'pcs', null],
          [5, 'FILTER', 'HYD Oil Return Filter',                     'Replace',          '60167851',       1,    'pcs', null],
          [6, 'FILTER', 'Hydraulic Steering Filter Element',         'Replace',          '60345316',       1,    'pcs', null],
          [7, 'FILTER', 'Air Filter Outer Element',                  'Replace',          '160602020020A',  1,    'pcs', null],
          [8, 'FILTER', 'Air Filter Inner Element',                  'Replace',          '160602030016A',  1,    'pcs', null],
          [9, 'FILTER', 'Air Dryer (Pengering Udara)',               'Replace',          '60060965',       1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SKT80S' && interval === 4000) {
        const items = [
          [1, 'OIL',    'Radiator Coolant',                          'Drain and refill', null,             55,   'L',   'L-35 Antifreeze'],
          [2, 'OIL',    'Hydraulic Oil',                             'Drain and refill', null,             162,  'L',   'Caltex HDZ46'],
          [3, 'FILTER', 'Engine Oil Filter Element',                 'Replace',          '60327523',       2,    'pcs', null],
          [4, 'FILTER', 'Fuel Rough Filter',                        'Replace',          '160604020017',   1,    'pcs', null],
          [5, 'FILTER', 'Fuel Fine Filter Cartridge',                'Replace',          '160604020018',   1,    'pcs', null],
          [6, 'FILTER', 'Oil-Water Separator Filter Element',        'Replace',          '160603020024A',  1,    'pcs', null],
          [7, 'FILTER', 'HYD Oil Return Filter',                     'Replace',          '60167851',       1,    'pcs', null],
          [8, 'FILTER', 'Hydraulic Steering Filter Element',         'Replace',          '60345316',       1,    'pcs', null],
          [9, 'FILTER', 'AC Fresh Air Filter',                       'Replace',          '141502000017',   1,    'pcs', null],
          [10,'FILTER', 'Transmission (TM) Filter',                  'Replace',          '130202000093A023', 1,  'pcs', null],
          [11,'FILTER', 'Air Filter Outer Element',                  'Replace',          '160602020020A',  1,    'pcs', null],
          [12,'FILTER', 'Air Filter Inner Element',                  'Replace',          '160602030016A',  1,    'pcs', null],
          [13,'FILTER', 'Wet Air Cleaner Oil Bath Filter Element',   'Replace',          '160699000013A',  1,    'pcs', null],
          [14,'FILTER', 'Magnetic Filter',                           'Replace',          '130202000093A026', 1,  'pcs', null],
          [15,'FILTER', 'Hydraulic Tank Breather Filter',            'Replace',          '24001922',       1,    'pcs', null],
          [16,'FILTER', 'Air Dryer (Pengering Udara)',               'Replace',          '60060965',       1,    'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
    }


      // ============================================================
      // SRT95C — Data dari OMM Chapter 36 (French OMM, lengkap)
      // ============================================================
      if (model === 'SRT95C' && interval === 250) {
        const items: any[] = [
          [1,'OIL',   'Engine Oil - Carter de vilebrequin (Minyak Mesin)',         'Drain and refill',  null,            134, 'L',   'EO SAE 15W/40 API CH-4 / Mobil Delvac Super 15W/40'],
          [2,'OIL',   'PTO Engine Oil',                                             'Check/refill',      null,            4,   'L',   'EPL MIL-L-2105C'],
          [3,'OIL',   'Hub Reducer Oil (Minyak Gardan Roda)',                       'Check/refill',      null,            57,  'L',   'EPL MIL-L-2105C (total all hubs)'],
          [4,'FILTER','Engine Oil Filter (Saringan Oli Mesin)',                     'Replace',           'B222100000595', 2,   'pcs', null],
          [5,'FILTER','Fuel Pre-Filter / Rough Filter (Saringan Kasar BBM)',        'Replace',           null,            2,   'pcs', 'Refer to engine manual'],
          [6,'FILTER','Fuel Fine Filter (Saringan Halus BBM)',                      'Replace',           null,            2,   'pcs', 'Refer to engine manual'],
          [7,'FILTER','Coolant Filter / Liquid de refroidissement Filter',          'Replace',           null,            1,   'pcs', 'Maintain DCA4 concentration'],
          [8,'FILTER','Air Filter Element (Elemen Filter Udara)',                   'Replace',           '60013897',      2,   'pcs', 'Replace when restriction indicator lights up'],
          [9,'FILTER','Hydraulic Return Filter - Lifting/Cooling (Filter Oli HYD)','Replace',           '60215480',      2,   'pcs', null],
          [10,'FILTER','Hydraulic Line Filter - Steering (Filter Kemudi)',          'Replace',           '60215915',      1,   'pcs', null],
          [11,'FILTER','Hydraulic Cooling Line Filter (Filter Pendingin HYD)',      'Replace',           '60100714',      2,   'pcs', null],
          [12,'GREASE','Front Suspension Cylinder Bearing',                         'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [13,'GREASE','Steering Cylinder Bearing',                                 'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [14,'GREASE','Steering Rod Bearing',                                      'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [15,'GREASE','A-Frame Ball Joint (Ball Joint Frame A)',                   'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [16,'GREASE','Lateral Stabilizer Link Bearing',                           'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [17,'GREASE','Body Hinge Pin (Pin Engsel Bak)',                           'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [18,'GREASE','Lifting Cylinder Bearing (Bearing Silinder Angkat)',        'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [19,'GREASE','A-Frame Arm Bearing (Bearing Lengan A)',                    'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [20,'GREASE','Drive Shaft / Propeller Shaft (Poros Gardan) — 6 points',  'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SRT95C' && interval === 500) {
        const items: any[] = [
          [1,'OIL',   'Engine Oil (Minyak Mesin)',                   'Drain and refill',  null,            134, 'L',   'EO SAE 15W/40 API CH-4'],
          [2,'OIL',   'PTO Engine Oil',                              'Check/refill',      null,            4,   'L',   'EPL MIL-L-2105C'],
          [3,'OIL',   'Hub Reducer Oil (Minyak Gardan Roda)',        'Check/refill',      null,            57,  'L',   'EPL MIL-L-2105C'],
          [4,'FILTER','Engine Oil Filter (Saringan Oli Mesin)',      'Replace',           'B222100000595', 2,   'pcs', null],
          [5,'FILTER','Fuel Pre-Filter (Saringan Kasar BBM)',        'Replace',           null,            2,   'pcs', null],
          [6,'FILTER','Fuel Fine Filter (Saringan Halus BBM)',       'Replace',           null,            2,   'pcs', null],
          [7,'FILTER','Coolant Filter',                              'Replace',           null,            1,   'pcs', null],
          [8,'FILTER','Air Filter Element (Elemen Filter Udara)',    'Replace',           '60013897',      2,   'pcs', null],
          [9,'FILTER','Hydraulic Return Filter - Lifting/Cooling',   'Replace',           '60215480',      2,   'pcs', null],
          [10,'FILTER','Hydraulic Line Filter - Steering',           'Replace',           '60215915',      1,   'pcs', null],
          [11,'FILTER','Hydraulic Cooling Line Filter',              'Replace',           '60100714',      2,   'pcs', null],
          [12,'FILTER','Oil Separator / Déshuileur Filter',          'Replace',           'B222100000622', 2,   'pcs', null],
          [13,'FILTER','Water Filter (Filter Air)',                  'Replace',           '21083623',      1,   'pcs', null],
          [14,'GREASE','Front Suspension Cylinder Bearing',          'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [15,'GREASE','Rear Suspension Cylinder Bearing',           'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [16,'GREASE','Steering Cylinder Bearing',                  'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [17,'GREASE','Steering Rod Bearing',                       'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [18,'GREASE','A-Frame Ball Joint',                         'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [19,'GREASE','Lateral Stabilizer Link Bearing',            'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [20,'GREASE','Body Hinge Pin',                             'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [21,'GREASE','Lifting Cylinder Bearing',                   'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [22,'GREASE','A-Frame Arm Bearing',                        'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [23,'GREASE','Drive Shaft / Propeller Shaft — 6 points',   'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [24,'GREASE','Steering Tank Bearing',                      'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [25,'GREASE','Crankshaft Pin / Direction Bearing',         'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SRT95C' && interval === 1000) {
        const items: any[] = [
          [1,'OIL',   'Engine Oil (Minyak Mesin)',                   'Drain and refill',  null,            134, 'L',   'EO SAE 15W/40 API CH-4'],
          [2,'OIL',   'Transmission Oil - BV (Oli Transmisi)',       'Drain and refill',  null,            100, 'L',   'HTF Allison TranSynd RD / TES-295'],
          [3,'OIL',   'PTO Engine Oil',                              'Drain and refill',  null,            4,   'L',   'EPL MIL-L-2105C'],
          [4,'OIL',   'Hub Reducer Oil (Minyak Gardan Roda)',        'Check/refill',      null,            57,  'L',   'EPL MIL-L-2105C'],
          [5,'FILTER','Engine Oil Filter (Saringan Oli Mesin)',      'Replace',           'B222100000595', 2,   'pcs', null],
          [6,'FILTER','Fuel Pre-Filter (Saringan Kasar BBM)',        'Replace',           null,            2,   'pcs', null],
          [7,'FILTER','Fuel Fine Filter (Saringan Halus BBM)',       'Replace',           null,            2,   'pcs', null],
          [8,'FILTER','Coolant Filter',                              'Replace',           null,            1,   'pcs', null],
          [9,'FILTER','Air Filter Element',                          'Replace',           '60013897',      2,   'pcs', null],
          [10,'FILTER','Hydraulic Return Filter - Lifting (Filter Return HYD)', 'Replace','60215480',     2,   'pcs', null],
          [11,'FILTER','Hydraulic Return Filter - Steering (Filter Kemudi)',    'Replace','60215915',     1,   'pcs', null],
          [12,'FILTER','Hydraulic Cooling Line Filter',              'Replace',           '60100714',      2,   'pcs', null],
          [13,'FILTER','Transmission Filter (Allison H8610AR)',      'Replace',           null,            1,   'pcs', 'Refer to Allison H8610AR manual'],
          [14,'FILTER','Rear Brake Group Valve Filter (Filter Valve Rem)', 'Replace',    '60046289',      1,   'pcs', null],
          [15,'FILTER','Hydraulic Tank Breather (Breather Tangki HYD)', 'Replace',       '60186788',      2,   'pcs', null],
          [16,'FILTER','Suction Filter - Steering/Brake (Filter Isap)', 'Replace',       '60209904',      1,   'pcs', null],
          [17,'FILTER','Oil Separator / Déshuileur Filter',          'Replace',           'B222100000622', 2,   'pcs', null],
          [18,'FILTER','Water Filter',                               'Replace',           '21083623',      1,   'pcs', null],
          [19,'GREASE','Front Suspension Cylinder Bearing',          'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [20,'GREASE','Rear Suspension Cylinder Bearing',           'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [21,'GREASE','Steering Cylinder Bearing',                  'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [22,'GREASE','Steering Rod Bearing',                       'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [23,'GREASE','A-Frame Ball Joint',                         'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [24,'GREASE','Lateral Stabilizer Link Bearing',            'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [25,'GREASE','Body Hinge Pin',                             'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [26,'GREASE','Lifting Cylinder Bearing',                   'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [27,'GREASE','A-Frame Arm Bearing',                        'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [28,'GREASE','Drive Shaft / Propeller Shaft — 6 points',   'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [29,'GREASE','Steering Tank Bearing',                      'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
          [30,'GREASE','Crankshaft Pin / Direction Bearing',         'Lubricate',         null,            null,'lot', 'EP NLGI grease'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SRT95C' && interval === 2000) {
        // 2000H = 1200H SRT95C — Differential + Hub Reducer drain/refill
        const items: any[] = [
          [1,'OIL',   'Engine Oil (Minyak Mesin)',                              'Drain and refill',       null,            134, 'L',   'EO SAE 15W/40 API CH-4'],
          [2,'OIL',   'Transmission Oil - BV (Oli Transmisi)',                  'Drain and refill',       null,            100, 'L',   'HTF Allison TranSynd RD / TES-295'],
          [3,'OIL',   'PTO Engine Oil',                                         'Drain, clean and refill',null,            4,   'L',   'EPL MIL-L-2105C'],
          [4,'OIL',   'Differential + Conical Gear Oil (Minyak Diferensial)',   'Drain, clean and refill',null,            61,  'L',   'EPL SAE 85W/140 API GL-5'],
          [5,'OIL',   'Hub Reducer Oil — all hubs (Minyak Gardan Roda)',        'Drain and refill',       null,            57,  'L',   'EPL SAE 85W/140 API GL-5'],
          [6,'FILTER','Engine Oil Filter',                                       'Replace',                'B222100000595', 2,   'pcs', null],
          [7,'FILTER','Fuel Pre-Filter',                                         'Replace',                null,            2,   'pcs', null],
          [8,'FILTER','Fuel Fine Filter',                                        'Replace',                null,            2,   'pcs', null],
          [9,'FILTER','Coolant Filter',                                          'Replace',                null,            1,   'pcs', null],
          [10,'FILTER','Transmission Filter (Allison H8610AR)',                  'Replace',                null,            1,   'pcs', null],
          [11,'FILTER','Hydraulic Return Filter - Lifting',                      'Replace',                '60215480',      2,   'pcs', null],
          [12,'FILTER','Hydraulic Line Filter - Steering',                       'Replace',                '60215915',      1,   'pcs', null],
          [13,'FILTER','Hydraulic Cooling Line Filter',                          'Replace',                '60100714',      2,   'pcs', null],
          [14,'FILTER','Rear Brake Group Valve Filter',                          'Replace',                '60046289',      1,   'pcs', null],
          [15,'FILTER','Hydraulic Tank Breather (Breather Tangki)',              'Replace',                '60186788',      2,   'pcs', null],
          [16,'FILTER','Suction Filter - Steering/Brake',                        'Replace',                '60209904',      1,   'pcs', null],
          [17,'FILTER','Oil Separator Filter',                                   'Replace',                'B222100000622', 2,   'pcs', null],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SRT95C' && interval === 3000) {
        const items: any[] = [
          [1,'OIL',   'Engine Oil (Minyak Mesin)',                              'Drain and refill',       null,            134, 'L',   'EO SAE 15W/40 API CH-4'],
          [2,'OIL',   'Transmission Oil - BV (Oli Transmisi)',                  'Drain and refill',       null,            100, 'L',   'HTF Allison TranSynd RD'],
          [3,'OIL',   'PTO Engine Oil',                                         'Drain, clean and refill',null,            4,   'L',   'EPL MIL-L-2105C'],
          [4,'OIL',   'Differential + Conical Gear Oil',                        'Drain, clean and refill',null,            61,  'L',   'EPL SAE 85W/140'],
          [5,'OIL',   'Hub Reducer Oil (Minyak Gardan Roda)',                   'Drain and refill',       null,            57,  'L',   'EPL SAE 85W/140'],
          [6,'OIL',   'Hydraulic Oil - Direction/Braking System (Oli Hidraulik)','Clean and refill',     null,            480, 'L',   'HO ISO VG46 Anti-wear / Shell VG46'],
          [7,'OIL',   'Hydraulic Oil - Lifting/Cooling System (Oli Hidraulik)', 'Clean and refill',      null,            280, 'L',   'HO ISO VG46 Anti-wear'],
          [8,'OIL',   'Fuel Tank (Tangki BBM) — drain and refill',             'Drain and refill',       null,            1030,'L',   'Diesel'],
          [9,'OIL',   'Rear Brake Oil (Oli Rem Belakang)',                      'Drain and refill',       null,            null,'lot', 'HO (check capacity per brake)'],
          [10,'FILTER','Engine Oil Filter',                                      'Replace',                'B222100000595', 2,   'pcs', null],
          [11,'FILTER','Fuel Pre-Filter',                                        'Replace',                null,            2,   'pcs', null],
          [12,'FILTER','Fuel Fine Filter',                                       'Replace',                null,            2,   'pcs', null],
          [13,'FILTER','Coolant Filter',                                         'Replace',                null,            1,   'pcs', null],
          [14,'FILTER','Transmission Filter',                                    'Replace',                null,            1,   'pcs', null],
          [15,'FILTER','Hydraulic Return Filter - Lifting',                      'Replace',                '60215480',      2,   'pcs', null],
          [16,'FILTER','Hydraulic Line Filter - Steering',                       'Replace',                '60215915',      1,   'pcs', null],
          [17,'FILTER','Hydraulic Cooling Line Filter',                          'Replace',                '60100714',      2,   'pcs', null],
          [18,'FILTER','Rear Brake Group Valve Filter',                          'Replace',                '60046289',      1,   'pcs', null],
          [19,'FILTER','Hydraulic Tank Breather',                                'Replace',                '60186788',      2,   'pcs', null],
          [20,'FILTER','Suction Filter - Steering/Brake',                        'Replace',                '60209904',      1,   'pcs', null],
          [21,'FILTER','Suction Filter - Lifting/Cooling',                       'Replace',                '60209906',      3,   'pcs', null],
          [22,'FILTER','Oil Separator Filter',                                   'Replace',                'B222100000622', 2,   'pcs', null],
          [23,'FILTER','Water Filter',                                           'Replace',                '21083623',      1,   'pcs', null],
          [24,'GREASE','Front Wheel Bearing (Bearing Roda Depan) — check play, replace grease', 'Lubricate + inspect', null, null,'lot', 'EP NLGI-2 grease (no molybdenum)'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }
      if (model === 'SRT95C' && interval === 4000) {
        const items: any[] = [
          [1,'OIL',   'Engine Oil (Minyak Mesin)',                              'Drain and refill',       null,            134, 'L',   'EO SAE 15W/40 API CH-4'],
          [2,'OIL',   'Transmission Oil - BV (Oli Transmisi)',                  'Drain and refill',       null,            100, 'L',   'HTF Allison TranSynd RD'],
          [3,'OIL',   'PTO Engine Oil',                                         'Drain, clean and refill',null,            4,   'L',   'EPL MIL-L-2105C'],
          [4,'OIL',   'Differential + Conical Gear Oil',                        'Drain, clean and refill',null,            61,  'L',   'EPL SAE 85W/140'],
          [5,'OIL',   'Hub Reducer Oil (Minyak Gardan Roda)',                   'Drain and refill',       null,            57,  'L',   'EPL SAE 85W/140'],
          [6,'OIL',   'Hydraulic Oil - Direction/Braking System (Oli Hidraulik)','Clean and refill',     null,            480, 'L',   'HO ISO VG46'],
          [7,'OIL',   'Hydraulic Oil - Lifting/Cooling System (Oli Hidraulik)', 'Clean and refill',      null,            280, 'L',   'HO ISO VG46'],
          [8,'OIL',   'Fuel Tank (Tangki BBM)',                                  'Drain and refill',      null,            1030,'L',   'Diesel'],
          [9,'OIL',   'Rear Brake Oil',                                          'Drain and refill',      null,            null,'lot', 'HO'],
          [10,'OIL',  'Coolant System - BV + Retarder + Rear Brake (Coolant)',  'Drain, clean and refill',null,           300, 'L',   'Antifreeze/Coolant — Mobil Antigel -45°C'],
          [11,'FILTER','Engine Oil Filter',                                      'Replace',                'B222100000595', 2,   'pcs', null],
          [12,'FILTER','Fuel Pre-Filter',                                        'Replace',                null,            2,   'pcs', null],
          [13,'FILTER','Fuel Fine Filter',                                       'Replace',                null,            2,   'pcs', null],
          [14,'FILTER','Coolant Filter',                                         'Replace',                null,            1,   'pcs', null],
          [15,'FILTER','Transmission Filter',                                    'Replace',                null,            1,   'pcs', null],
          [16,'FILTER','Hydraulic Return Filter - Lifting',                      'Replace',                '60215480',      2,   'pcs', null],
          [17,'FILTER','Hydraulic Line Filter - Steering',                       'Replace',                '60215915',      1,   'pcs', null],
          [18,'FILTER','Hydraulic Cooling Line Filter',                          'Replace',                '60100714',      2,   'pcs', null],
          [19,'FILTER','Rear Brake Group Valve Filter',                          'Replace',                '60046289',      1,   'pcs', null],
          [20,'FILTER','Hydraulic Tank Breather',                                'Replace',                '60186788',      2,   'pcs', null],
          [21,'FILTER','Suction Filter - Steering/Brake',                        'Replace',                '60209904',      1,   'pcs', null],
          [22,'FILTER','Suction Filter - Lifting/Cooling',                       'Replace',                '60209906',      3,   'pcs', null],
          [23,'FILTER','Oil Separator Filter',                                   'Replace',                'B222100000622', 2,   'pcs', null],
          [24,'FILTER','Water Filter',                                           'Replace',                '21083623',      1,   'pcs', null],
          [25,'FILTER','Air Filter Element',                                     'Replace',                '60013897',      2,   'pcs', null],
          [26,'GREASE','Front Wheel Bearing (Bearing Roda Depan) — check play, replace grease', 'Lubricate + inspect', null, null,'lot', 'EP NLGI-2 grease (no molybdenum)'],
        ];
        for (const [no,cat,name2,act,pn,qty,unit2,spec] of items) {
          await db.query(
            `INSERT INTO pm_bundle_items (bundle_id,item_no,component_category,component_name,action,part_number,qty,unit,spec) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [bundleId,no,cat,name2,act,pn,qty,unit2,spec]
          );
        }
      }

    logger.info('✅ pm_bundles migration completed successfully');
  } catch (error) {
    logger.error('pm_bundles migration failed:', error);
    throw error;
  }
}
