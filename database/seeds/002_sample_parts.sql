-- ============================================================
-- OSCARPART — Sample Parts Data (100 parts for development)
-- Run after 001_initial_data.sql
-- In production: import real data via bulk-import API or COPY
-- ============================================================

INSERT INTO parts (part_number, description, brand_name, unit_type, stock_quantity, unit_price, warehouse_location, status) VALUES

-- ── Caterpillar Filters ──────────────────────────────────────
('1R-0750',  'FILTER AS-OIL (CAT)',             'Caterpillar', 'PCS',  45,   185000,  'BPN-MAIN', 'active'),
('1R-0716',  'FILTER AS-FUEL PRIMARY (CAT)',     'Caterpillar', 'PCS',  38,   215000,  'BPN-MAIN', 'active'),
('1R-0749',  'FILTER AS-FUEL SECONDARY (CAT)',   'Caterpillar', 'PCS',  30,   195000,  'BPN-MAIN', 'active'),
('1R-0762',  'FILTER AS-HYDRAULIC (CAT)',         'Caterpillar', 'PCS',  25,   320000,  'BPN-MAIN', 'active'),
('6I-2501',  'FILTER AS-AIR OUTER (CAT 320)',     'Caterpillar', 'PCS',  20,   450000,  'BPN-MAIN', 'active'),
('6I-2502',  'FILTER AS-AIR INNER (CAT 320)',     'Caterpillar', 'PCS',  18,   310000,  'BPN-MAIN', 'active'),
('1R-0755',  'FILTER-ENGINE OIL (CAT 330)',       'Caterpillar', 'PCS',  35,   210000,  'BPN-MAIN', 'active'),
('1R-0741',  'FILTER AS-TRANSMISSION (CAT)',      'Caterpillar', 'PCS',  15,   385000,  'BPN-MAIN', 'active'),
('126-1813', 'FILTER AS-OIL BYPASS (CAT)',        'Caterpillar', 'PCS',  22,   165000,  'BPN-MAIN', 'active'),
('131-1812', 'ELEMENT AS-FILTER (CAT D9)',        'Caterpillar', 'PCS',  12,   425000,  'SMD-01',   'active'),

-- ── Caterpillar Undercarriage ────────────────────────────────
('175-8574', 'TRACK LINK AS-SEALED (CAT 320)',    'Caterpillar', 'LINK', 8,   2850000, 'BPN-MAIN', 'active'),
('252-7867', 'SPROCKET-RIM SEGMENT (CAT 330)',    'Caterpillar', 'PCS',  6,   1950000, 'BPN-MAIN', 'active'),
('9W-7232',  'TRACK SHOE-TRIPLE GROUSER',         'Caterpillar', 'PCS', 24,   485000,  'BPN-MAIN', 'active'),
('1947682',  'ROLLER-BOTTOM (CAT 320D)',          'Caterpillar', 'PCS', 10,   1650000, 'BPN-MAIN', 'active'),
('1947683',  'ROLLER-TOP CARRIER (CAT 320D)',     'Caterpillar', 'PCS',  8,   1450000, 'BPN-MAIN', 'active'),
('105-6838', 'IDLER GP-FRONT (CAT 320)',          'Caterpillar', 'PCS',  4,   3850000, 'BPN-MAIN', 'active'),

-- ── Caterpillar Hydraulic ────────────────────────────────────
('170-5479', 'SEAL KIT-ARM CYLINDER (CAT 320)',   'Caterpillar', 'SET',  12,  780000,  'BPN-MAIN', 'active'),
('170-5480', 'SEAL KIT-BOOM CYLINDER (CAT 320)',  'Caterpillar', 'SET',  10,  850000,  'BPN-MAIN', 'active'),
('170-5481', 'SEAL KIT-BUCKET CYLINDER',          'Caterpillar', 'SET',  15,  680000,  'BPN-MAIN', 'active'),
('8E-6488',  'SEAL O-RING KIT (CAT)',             'Caterpillar', 'SET',  30,  125000,  'BPN-MAIN', 'active'),

-- ── Komatsu Filters ──────────────────────────────────────────
('600-211-1340', 'FILTER ELEMENT-FUEL (KOM)',     'Komatsu',   'PCS',  40,  225000,  'BPN-MAIN', 'active'),
('600-211-1231', 'FILTER ELEMENT-OIL (KOM)',      'Komatsu',   'PCS',  35,  195000,  'BPN-MAIN', 'active'),
('600-185-4100', 'FILTER ELEMENT-HYDRAULIC (KOM)','Komatsu',   'PCS',  28,  345000,  'BPN-MAIN', 'active'),
('600-181-6740', 'FILTER ELEMENT-CORROSION',      'Komatsu',   'PCS',  20,  185000,  'SMD-01',   'active'),
('600-211-1221', 'CARTRIDGE-FUEL FILTER (KOM)',   'Komatsu',   'PCS',  22,  265000,  'BPN-MAIN', 'active'),
('207-60-71181', 'FILTER ELEMENT-PILOT (KOM)',    'Komatsu',   'PCS',  18,  155000,  'BPN-MAIN', 'active'),

-- ── Komatsu Undercarriage ────────────────────────────────────
('207-30-00111', 'SHOE ASSY-TRACK (PC200)',       'Komatsu',   'PCS',  20,  520000,  'BPN-MAIN', 'active'),
('201-30-00510', 'ROLLER ASSY-LOWER (PC200)',     'Komatsu',   'PCS',   8, 1750000,  'BPN-MAIN', 'active'),
('208-30-00041', 'ROLLER ASSY-UPPER (PC200)',     'Komatsu',   'PCS',   6, 1550000,  'BPN-MAIN', 'active'),
('208-30-00230', 'IDLER ASSY-FRONT (PC200)',      'Komatsu',   'PCS',   4, 4200000,  'BPN-MAIN', 'active'),

-- ── Komatsu Hydraulic Seals ──────────────────────────────────
('707-98-67240', 'SEAL KIT-BOOM CYLINDER (PC200)','Komatsu',   'SET',  14,  890000,  'BPN-MAIN', 'active'),
('707-98-45310', 'SEAL KIT-ARM CYLINDER (PC200)', 'Komatsu',   'SET',  12,  820000,  'BPN-MAIN', 'active'),
('707-99-45210', 'SEAL KIT-BUCKET CYL (PC200)',   'Komatsu',   'SET',  16,  760000,  'BPN-MAIN', 'active'),

-- ── Hitachi Parts ────────────────────────────────────────────
('4436371',  'FILTER FUEL PRIMARY (HIT)',         'Hitachi',   'PCS',  25,  235000,  'BPN-MAIN', 'active'),
('4616072',  'FILTER OIL ENGINE (HIT ZX)',        'Hitachi',   'PCS',  22,  205000,  'BPN-MAIN', 'active'),
('4290379',  'FILTER HYDRAULIC (HIT ZX200)',      'Hitachi',   'PCS',  18,  365000,  'BPN-MAIN', 'active'),
('4291585',  'SEAL KIT-BOOM (HIT ZX200)',         'Hitachi',   'SET',  10,  920000,  'BPN-MAIN', 'active'),
('4291586',  'SEAL KIT-ARM (HIT ZX200)',          'Hitachi',   'SET',   8,  875000,  'BPN-MAIN', 'active'),
('4291587',  'SEAL KIT-BUCKET (HIT ZX200)',       'Hitachi',   'SET',  12,  810000,  'SMD-01',   'active'),
('9100851',  'TRACK ROLLER (HIT ZX200)',          'Hitachi',   'PCS',   8, 1820000,  'BPN-MAIN', 'active'),

-- ── Volvo CE ─────────────────────────────────────────────────
('14503685', 'FILTER ENGINE OIL (VOL EC)',        'Volvo CE',  'PCS',  20,  245000,  'BPN-MAIN', 'active'),
('14503686', 'FILTER FUEL (VOL EC210)',           'Volvo CE',  'PCS',  18,  275000,  'BPN-MAIN', 'active'),
('14533547', 'FILTER HYDRAULIC RETURN (VOL)',     'Volvo CE',  'PCS',  15,  395000,  'BPN-MAIN', 'active'),
('14526300', 'SEAL KIT BUCKET CYL (VOL EC210)',   'Volvo CE',  'SET',   8,  985000,  'BPN-MAIN', 'active'),

-- ── Cummins Engine Parts ─────────────────────────────────────
('3926842',  'OIL FILTER (CUMMINS 6BT)',          'Cummins',   'PCS',  30,  195000,  'BPN-MAIN', 'active'),
('3931063',  'FUEL FILTER (CUMMINS 6BT)',         'Cummins',   'PCS',  28,  225000,  'BPN-MAIN', 'active'),
('3315843',  'AIR FILTER OUTER (CUMMINS)',        'Cummins',   'PCS',  15,  485000,  'BPN-MAIN', 'active'),
('3315844',  'AIR FILTER INNER (CUMMINS)',        'Cummins',   'PCS',  15,  320000,  'BPN-MAIN', 'active'),
('3903224',  'COOLANT FILTER (CUMMINS)',          'Cummins',   'PCS',  20,  175000,  'BPN-MAIN', 'active'),
('3803699',  'INJECTOR SEAL KIT (CUMMINS 6BT)',   'Cummins',   'SET',   8,  650000,  'BPN-MAIN', 'active'),
('3923776',  'HEAD GASKET SET (CUMMINS 6BT)',     'Cummins',   'SET',   5, 2850000,  'BPN-MAIN', 'active'),

-- ── Fleetguard Filters ───────────────────────────────────────
('LF3786',   'LUBE FILTER (FLEETGUARD)',          'Fleetguard','PCS',  35,  185000,  'BPN-MAIN', 'active'),
('FF5052',   'FUEL FILTER (FLEETGUARD)',          'Fleetguard','PCS',  30,  215000,  'BPN-MAIN', 'active'),
('AF25557',  'AIR FILTER OUTER (FLEETGUARD)',     'Fleetguard','PCS',  20,  465000,  'BPN-MAIN', 'active'),
('WF2073',   'WATER FILTER (FLEETGUARD)',         'Fleetguard','PCS',  25,  165000,  'BPN-MAIN', 'active'),
('HF6177',   'HYDRAULIC FILTER (FLEETGUARD)',     'Fleetguard','PCS',  18,  285000,  'BPN-MAIN', 'active'),

-- ── Gates Belts & Hoses ──────────────────────────────────────
('9330-1265','V-BELT (GATES)',                    'Gates',     'PCS',  20,  185000,  'BPN-MAIN', 'active'),
('9330-1266','FAN BELT (GATES)',                  'Gates',     'PCS',  18,  155000,  'BPN-MAIN', 'active'),
('4PK-1000', 'BELT POLY-V 4PK1000 (GATES)',      'Gates',     'PCS',  15,  225000,  'BPN-MAIN', 'active'),
('4PK-1200', 'BELT POLY-V 4PK1200 (GATES)',      'Gates',     'PCS',  12,  245000,  'BPN-MAIN', 'active'),
('6PK-1780', 'BELT POLY-V 6PK1780 (GATES)',      'Gates',     'PCS',  10,  285000,  'BPN-MAIN', 'active'),

-- ── SKF Bearings ─────────────────────────────────────────────
('6205-2RS1','BEARING 6205-2RS1 (SKF)',           'SKF',       'PCS',  40,  125000,  'BPN-MAIN', 'active'),
('6206-2RS1','BEARING 6206-2RS1 (SKF)',           'SKF',       'PCS',  35,  145000,  'BPN-MAIN', 'active'),
('6207-2RS1','BEARING 6207-2RS1 (SKF)',           'SKF',       'PCS',  30,  165000,  'BPN-MAIN', 'active'),
('6308-2RS1','BEARING 6308-2RS1 (SKF)',           'SKF',       'PCS',  25,  195000,  'BPN-MAIN', 'active'),
('22220-E',  'BEARING 22220-E SPHERICAL (SKF)',   'SKF',       'PCS',  10,  685000,  'BPN-MAIN', 'active'),
('32215-J2', 'BEARING 32215 TAPER (SKF)',         'SKF',       'PCS',  12,  545000,  'SMD-01',   'active'),
('NU-210-EC','BEARING NU210 CYLINDRICAL (SKF)',   'SKF',       'PCS',   8,  425000,  'BPN-MAIN', 'active'),

-- ── FAG Bearings ─────────────────────────────────────────────
('6204-2RSR','BEARING 6204-2RSR (FAG)',           'FAG',       'PCS',  40,  115000,  'BPN-MAIN', 'active'),
('6305-2RSR','BEARING 6305-2RSR (FAG)',           'FAG',       'PCS',  35,  135000,  'BPN-MAIN', 'active'),
('23220-E1A','BEARING 23220 SPHERICAL (FAG)',     'FAG',       'PCS',  10,  625000,  'BPN-MAIN', 'active'),

-- ── Bosch Rexroth Hydraulics ─────────────────────────────────
('R978017479','SEAL KIT CYLINDER (REXROTH)',      'Bosch Rexroth','SET', 8,  950000, 'BPN-MAIN', 'active'),
('R978017480','SEAL KIT PUMP (REXROTH A10)',      'Bosch Rexroth','SET', 5, 1250000, 'BPN-MAIN', 'active'),
('R978017481','O-RING KIT VALVE (REXROTH)',       'Bosch Rexroth','SET',12,  450000, 'BPN-MAIN', 'active'),

-- ── Parker Hydraulics ────────────────────────────────────────
('G7-14-A',  'HYDRAULIC HOSE 1/2" (PARKER)',     'Parker',    'MTR',  50,   95000,  'BPN-MAIN', 'active'),
('G7-20-A',  'HYDRAULIC HOSE 3/4" (PARKER)',     'Parker',    'MTR',  40,  125000,  'BPN-MAIN', 'active'),
('G7-25-A',  'HYDRAULIC HOSE 1" (PARKER)',       'Parker',    'MTR',  30,  165000,  'BPN-MAIN', 'active'),
('P5013-8',  'HYDRAULIC FITTING 1/2" (PARKER)',  'Parker',    'PCS',  80,   45000,  'BPN-MAIN', 'active'),
('P5013-12', 'HYDRAULIC FITTING 3/4" (PARKER)',  'Parker',    'PCS',  60,   65000,  'BPN-MAIN', 'active'),
('P5013-16', 'HYDRAULIC FITTING 1" (PARKER)',    'Parker',    'PCS',  50,   85000,  'BPN-MAIN', 'active'),

-- ── NOK Seals ────────────────────────────────────────────────
('NOK-TC-40','OIL SEAL 40X62X12 (NOK TC)',       'NOK',       'PCS',  25,   85000,  'BPN-MAIN', 'active'),
('NOK-TC-50','OIL SEAL 50X72X12 (NOK TC)',       'NOK',       'PCS',  20,   95000,  'BPN-MAIN', 'active'),
('NOK-TC-60','OIL SEAL 60X85X10 (NOK TC)',       'NOK',       'PCS',  18,  110000,  'BPN-MAIN', 'active'),
('NOK-TC-70','OIL SEAL 70X95X10 (NOK TC)',       'NOK',       'PCS',  15,  125000,  'SMD-01',   'active'),
('NOK-TC-80','OIL SEAL 80X105X12 (NOK TC)',      'NOK',       'PCS',  12,  145000,  'BPN-MAIN', 'active'),

-- ── Donaldson Filters ────────────────────────────────────────
('P502145',  'HYDRAULIC FILTER (DONALDSON)',      'Donaldson', 'PCS',  20,  295000,  'BPN-MAIN', 'active'),
('P502455',  'FUEL FILTER (DONALDSON)',           'Donaldson', 'PCS',  18,  235000,  'BPN-MAIN', 'active'),
('P136005',  'AIR FILTER OUTER (DONALDSON)',      'Donaldson', 'PCS',  15,  445000,  'BPN-MAIN', 'active'),
('P182089',  'LUBE FILTER (DONALDSON)',           'Donaldson', 'PCS',  22,  185000,  'BPN-MAIN', 'active'),

-- ── Sandvik Rock Tools ───────────────────────────────────────
('R32-SH38', 'SHANK ADAPTER R32-SH38 (SANDVIK)', 'Sandvik',   'PCS',   6, 3850000, 'BPN-MAIN', 'active'),
('R32-D45',  'DRILL BIT DTH 45mm (SANDVIK)',      'Sandvik',   'PCS',  10, 2250000, 'BPN-MAIN', 'active'),
('CORODRILL-460', 'INSERT BIT 89mm (SANDVIK)',   'Sandvik',    'PCS',   8, 4500000, 'BPN-MAIN', 'active'),

-- ── OEM Generic ─────────────────────────────────────────────
('OEM-BELT-1','V-BELT A-48 (OEM)',               'OEM',       'PCS',  30,  125000,  'BPN-MAIN', 'active'),
('OEM-BELT-2','V-BELT B-54 (OEM)',               'OEM',       'PCS',  25,  145000,  'BPN-MAIN', 'active'),
('OEM-SEAL-1','SEAL KIT GENERIC 50MM (OEM)',     'OEM',       'SET',  20,  185000,  'BPN-MAIN', 'active');

-- ============================================================
-- Update brand_id references (match by brand_name)
-- ============================================================
UPDATE parts p
SET brand_id = b.id
FROM brands b
WHERE p.brand_name = b.name;

-- ============================================================
-- Update warehouse_id references (match by code)
-- ============================================================
UPDATE parts p
SET warehouse_id = w.id
FROM warehouses w
WHERE p.warehouse_location = w.code;
