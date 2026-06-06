-- ============================================================
-- MIGRATION: Bundle PM SANY
-- Project: OSCARPART
-- Created: 2026-06-06
-- ============================================================

-- Tabel pm_bundles: header bundle PM per unit per interval
CREATE TABLE IF NOT EXISTS pm_bundles (
  id SERIAL PRIMARY KEY,
  unit_model VARCHAR(20) NOT NULL,         -- e.g. 'SKT80S', 'SKT90S', 'SRT95C', 'SYZ326C', 'SYZ440C', 'SKT105S'
  interval_hm INTEGER NOT NULL,            -- interval dalam jam (HM): 250, 500, 1000, 2000, 3000, 4000
  bundle_name VARCHAR(100) NOT NULL,       -- e.g. 'PM 250H SKT80S'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel pm_bundle_items: detail item per bundle
CREATE TABLE IF NOT EXISTS pm_bundle_items (
  id SERIAL PRIMARY KEY,
  bundle_id INTEGER REFERENCES pm_bundles(id) ON DELETE CASCADE,
  item_no INTEGER,                          -- urutan item
  component_category VARCHAR(50),           -- 'OIL', 'FILTER', 'GREASE', 'CHECK', 'REPLACE'
  component_name VARCHAR(200) NOT NULL,     -- nama komponen
  action VARCHAR(100),                      -- 'Replace', 'Check and refill', 'Drain and refill', dll
  part_number VARCHAR(100),                 -- part number SANY (jika ada)
  qty NUMERIC(10,2),                        -- jumlah
  unit VARCHAR(20),                         -- 'pcs', 'L', 'kg', dll
  spec VARCHAR(200),                        -- spesifikasi: '15W-40 CH-4', 'ISO VG-46', dll
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_pm_bundles_unit_model ON pm_bundles(unit_model);
CREATE INDEX IF NOT EXISTS idx_pm_bundles_interval ON pm_bundles(interval_hm);
CREATE INDEX IF NOT EXISTS idx_pm_bundle_items_bundle_id ON pm_bundle_items(bundle_id);

-- ============================================================
-- SEED DATA: SYZ326C (data paling lengkap dari check sheet)
-- ============================================================

-- Bundle 250H SYZ326C
INSERT INTO pm_bundles (unit_model, interval_hm, bundle_name, description) VALUES
('SYZ326C', 250,  'PM 250H SYZ326C',  'Service bundle 250 jam untuk SANY SYZ326C-8WR'),
('SYZ326C', 500,  'PM 500H SYZ326C',  'Service bundle 500 jam untuk SANY SYZ326C-8WR'),
('SYZ326C', 1000, 'PM 1000H SYZ326C', 'Service bundle 1000 jam untuk SANY SYZ326C-8WR'),
('SYZ326C', 2000, 'PM 2000H SYZ326C', 'Service bundle 2000 jam untuk SANY SYZ326C-8WR'),
('SYZ326C', 3000, 'PM 3000H SYZ326C', 'Service bundle 3000 jam untuk SANY SYZ326C-8WR'),
('SYZ326C', 4000, 'PM 4000H SYZ326C', 'Service bundle 4000 jam untuk SANY SYZ326C-8WR');

-- Items untuk PM 250H SYZ326C (bundle_id = 1)
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec) 
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1,  'OIL',    'Engine Oil',              'Drain and refill',    NULL,               30,   'L',   '15W-40 CH-4'),
  (2,  'OIL',    'Oil Bath Air Filter',     'Check and refill',    NULL,               3,    'L',   '15W-40 CH-4'),
  (3,  'FILTER', 'Fuel Filter Element',     'Replace',             '160101120038A001', 2,    'pcs', NULL),
  (4,  'FILTER', 'Water Separator',         'Replace',             '1000424916',       1,    'pcs', NULL),
  (5,  'FILTER', 'Oil Filter Element',      'Replace',             '160605020019',     2,    'pcs', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SYZ326C' AND b.interval_hm = 250;

-- Items untuk PM 500H SYZ326C (bundle_id = 2)
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1,  'OIL',    'Engine Oil',              'Drain and refill',    NULL,               30,   'L',   '15W-40 CH-4'),
  (2,  'OIL',    'Oil Bath Air Filter',     'Check and refill',    NULL,               3,    'L',   '15W-40 CH-4'),
  (3,  'OIL',    'Steering Hydraulic',      'Check and refill',    NULL,               8,    'L',   'ATF III F'),
  (4,  'OIL',    'Hydraulic Clutch Mech',   'Check and refill',    NULL,               1,    'L',   'Brake Fluid DOT 3'),
  (5,  'FILTER', 'Fuel Filter Element',     'Replace',             '160101120038A001', 2,    'pcs', NULL),
  (6,  'FILTER', 'Water Separator',         'Replace',             '1000424916',       1,    'pcs', NULL),
  (7,  'FILTER', 'Oil Filter Element',      'Replace',             '160605020019',     2,    'pcs', NULL),
  (8,  'FILTER', 'Air Dryer Filter',        'Replace',             '152599000172A001', 1,    'pcs', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SYZ326C' AND b.interval_hm = 500;

-- Items untuk PM 1000H SYZ326C (bundle_id = 3)
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1,  'OIL',    'Engine Oil',                     'Drain and refill', NULL,               30,   'L',   '15W-40 CH-4'),
  (2,  'OIL',    'Oil Bath Air Filter',             'Check and refill', NULL,               3,    'L',   '15W-40 CH-4'),
  (3,  'OIL',    'Transmission Oil',                'Drain and refill', NULL,               14,   'L',   'Gear Oil 85W/90 GL5'),
  (4,  'OIL',    'Steering Hydraulic',              'Check and refill', NULL,               8,    'L',   'ATF III F'),
  (5,  'OIL',    'Middle Axle Main Reducer',        'Drain and refill', NULL,               18,   'L',   'Gear Oil 85W-140 GL5'),
  (6,  'OIL',    'Middle Axle Hub Reducer',         'Drain and refill', NULL,               8.3,  'L',   'Gear Oil 85W-140 GL5'),
  (7,  'OIL',    'Rear Axle Main Reducer',          'Drain and refill', NULL,               18,   'L',   'Gear Oil 85W-140 GL5'),
  (8,  'OIL',    'Rear Axle Hub Reducer',           'Check and refill', NULL,               8.3,  'L',   'Gear Oil 85W-140 GL5'),
  (9,  'OIL',    'Hydraulic Clutch Mechanism',      'Check and refill', NULL,               1,    'L',   'Brake Fluid DOT 3'),
  (10, 'OIL',    'Hydraulic Mechanism Lifting Cab', 'Check and refill', NULL,               1,    'L',   'ISO VG-46'),
  (11, 'FILTER', 'Fuel Filter Element',             'Replace',          '160101120038A001', 2,    'pcs', NULL),
  (12, 'FILTER', 'Water Separator',                 'Replace',          '1000424916',       1,    'pcs', NULL),
  (13, 'FILTER', 'Oil Filter Element',              'Replace',          '160605020019',     2,    'pcs', NULL),
  (14, 'FILTER', 'Air Dryer Filter',                'Replace',          '152599000172A001', 1,    'pcs', NULL),
  (15, 'FILTER', 'Air Filter Outer Element',        'Replace',          '160602020036A',    1,    'pcs', 'AF25276'),
  (16, 'FILTER', 'Air Filter Inner Element',        'Replace',          '160602030026A',    1,    'pcs', NULL),
  (17, 'FILTER', 'Fresh Air Filter AC',             'Replace',          '141502000017',     1,    'pcs', NULL),
  (18, 'FILTER', 'Filter Strainer',                 'Replace',          '60022607',         1,    'pcs', NULL),
  (19, 'FILTER', 'Power Steering Filter',           'Replace',          'A222100000393',    1,    'pcs', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SYZ326C' AND b.interval_hm = 1000;

-- Items untuk PM 3000H SYZ326C (bundle_id = 5)
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1, 'OIL', 'Hydraulic Tipper Vessel', 'Change and refill', NULL, 100, 'L', 'ISO VG-46'),
  (2, 'OIL', 'Engine Cooling System',   'Change and refill', NULL, 45,  'L', 'Ethylene Glycol')
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SYZ326C' AND b.interval_hm = 3000;

-- ============================================================
-- SEED DATA: SKT90S (dari OMM SANY asli - interval terstruktur)
-- ============================================================

INSERT INTO pm_bundles (unit_model, interval_hm, bundle_name, description) VALUES
('SKT90S', 250,  'PM 250H SKT90S',  'Service bundle 250 jam - SKT90S Mining Wide-Body Dump Truck'),
('SKT90S', 500,  'PM 500H SKT90S',  'Service bundle 500 jam - SKT90S Mining Wide-Body Dump Truck'),
('SKT90S', 1000, 'PM 1000H SKT90S', 'Service bundle 1000 jam - SKT90S Mining Wide-Body Dump Truck'),
('SKT90S', 2000, 'PM 2000H SKT90S', 'Service bundle 2000 jam - SKT90S Mining Wide-Body Dump Truck'),
('SKT90S', 3000, 'PM 3000H SKT90S', 'Service bundle 3000 jam - SKT90S Mining Wide-Body Dump Truck'),
('SKT90S', 4000, 'PM 4000H SKT90S', 'Service bundle 4000 jam - SKT90S Mining Wide-Body Dump Truck');

-- SKT90S PM 500H
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1, 'OIL',    'Engine Oil',               'Drain and refill', NULL, 1, 'lot', '15W-40 or equivalent'),
  (2, 'FILTER', 'Engine Oil Filter',        'Replace',          NULL, 1, 'pcs', NULL),
  (3, 'FILTER', 'Fuel Filter Element',      'Replace',          NULL, 1, 'pcs', NULL),
  (4, 'FILTER', 'Fuel-Water Separator',     'Replace',          NULL, 1, 'pcs', NULL),
  (5, 'FILTER', 'Oil-Gas Separator',        'Check/Maintain',   NULL, 1, 'pcs', NULL),
  (6, 'FILTER', 'Air Filter Element',       'Check/Clean',      NULL, 1, 'pcs', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SKT90S' AND b.interval_hm = 500;

-- SKT90S PM 1000H
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1, 'OIL',    'Engine Oil',               'Drain and refill', NULL, 1, 'lot', '15W-40 or equivalent'),
  (2, 'OIL',    'Drive Axle Oil',           'Check/Inspect',    NULL, 1, 'lot', NULL),
  (3, 'FILTER', 'Engine Oil Filter',        'Replace',          NULL, 1, 'pcs', NULL),
  (4, 'FILTER', 'Fuel Filter Element',      'Replace',          NULL, 1, 'pcs', NULL),
  (5, 'FILTER', 'Fuel-Water Separator',     'Replace',          NULL, 1, 'pcs', NULL),
  (6, 'FILTER', 'Air Filter Element',       'Replace',          NULL, 1, 'pcs', NULL),
  (7, 'CHECK',  'Hydraulic System',         'Full inspection',  NULL, 1, 'lot', NULL),
  (8, 'CHECK',  'Suspension System',        'Inspect',          NULL, 1, 'lot', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SKT90S' AND b.interval_hm = 1000;

-- SKT90S PM 3000H
INSERT INTO pm_bundle_items (bundle_id, item_no, component_category, component_name, action, part_number, qty, unit, spec)
SELECT b.id, v.item_no, v.component_category, v.component_name, v.action, v.part_number, v.qty, v.unit, v.spec
FROM pm_bundles b, (VALUES
  (1, 'OIL',   'Hydraulic Oil (full system)', 'Replace',      NULL, 1, 'lot', 'Per spec SKT90S'),
  (2, 'CHECK', 'Brake Drum',                  'Inspect wear', NULL, 1, 'lot', NULL)
) AS v(item_no, component_category, component_name, action, part_number, qty, unit, spec)
WHERE b.unit_model = 'SKT90S' AND b.interval_hm = 3000;

-- Placeholder bundles untuk unit lain (akan diisi setelah baca OMM masing-masing)
INSERT INTO pm_bundles (unit_model, interval_hm, bundle_name, description) VALUES
('SKT80S',  250,  'PM 250H SKT80S',   'Service bundle 250 jam - SKT80S Wide Body Truck'),
('SKT80S',  500,  'PM 500H SKT80S',   'Service bundle 500 jam - SKT80S Wide Body Truck'),
('SKT80S',  1000, 'PM 1000H SKT80S',  'Service bundle 1000 jam - SKT80S Wide Body Truck'),
('SKT105S', 250,  'PM 250H SKT105S',  'Service bundle 250 jam - SKT105S Mining Wide-Body Dump Truck'),
('SKT105S', 500,  'PM 500H SKT105S',  'Service bundle 500 jam - SKT105S Mining Wide-Body Dump Truck'),
('SKT105S', 1000, 'PM 1000H SKT105S', 'Service bundle 1000 jam - SKT105S Mining Wide-Body Dump Truck'),
('SRT95C',  250,  'PM 250H SRT95C',   'Service bundle 250 jam - SRT95C Off-Highway Truck'),
('SRT95C',  500,  'PM 500H SRT95C',   'Service bundle 500 jam - SRT95C Off-Highway Truck'),
('SRT95C',  1000, 'PM 1000H SRT95C',  'Service bundle 1000 jam - SRT95C Off-Highway Truck'),
('SYZ440C', 250,  'PM 250H SYZ440C',  'Service bundle 250 jam - SYZ440C Dump Truck'),
('SYZ440C', 500,  'PM 500H SYZ440C',  'Service bundle 500 jam - SYZ440C Dump Truck'),
('SYZ440C', 1000, 'PM 1000H SYZ440C', 'Service bundle 1000 jam - SYZ440C Dump Truck');
