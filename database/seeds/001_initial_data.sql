-- ============================================================
-- OSCARPART Enterprise Platform — Seed Data
-- Run after schema.sql and indexes.sql
-- ============================================================

-- ============================================================
-- BRANDS (common mining equipment brands)
-- ============================================================

INSERT INTO brands (name, slug, active, sort_order) VALUES
  ('Caterpillar', 'caterpillar', TRUE, 1),
  ('Komatsu', 'komatsu', TRUE, 2),
  ('Hitachi', 'hitachi', TRUE, 3),
  ('Volvo CE', 'volvo-ce', TRUE, 4),
  ('Liebherr', 'liebherr', TRUE, 5),
  ('Sandvik', 'sandvik', TRUE, 6),
  ('Atlas Copco', 'atlas-copco', TRUE, 7),
  ('Parker', 'parker', TRUE, 8),
  ('Gates', 'gates', TRUE, 9),
  ('SKF', 'skf', TRUE, 10),
  ('FAG', 'fag', TRUE, 11),
  ('Bosch Rexroth', 'bosch-rexroth', TRUE, 12),
  ('Cummins', 'cummins', TRUE, 13),
  ('Fleetguard', 'fleetguard', TRUE, 14),
  ('Donaldson', 'donaldson', TRUE, 15),
  ('Luk', 'luk', TRUE, 16),
  ('Sachs', 'sachs', TRUE, 17),
  ('NOK', 'nok', TRUE, 18),
  ('Ferodo', 'ferodo', TRUE, 19),
  ('OEM', 'oem', TRUE, 20);

-- ============================================================
-- WAREHOUSES
-- ============================================================

INSERT INTO warehouses (name, location, code, active) VALUES
  ('Gudang Utama Balikpapan', 'Balikpapan, Kalimantan Timur', 'BPN-MAIN', TRUE),
  ('Gudang Samarinda', 'Samarinda, Kalimantan Timur', 'SMD-01', TRUE),
  ('Gudang Jakarta', 'Jakarta Utara, DKI Jakarta', 'JKT-01', TRUE);

-- ============================================================
-- SUPERADMIN USER
-- Password: OscarAdmin@2026!
-- Hash generated with bcrypt rounds=12
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
-- ============================================================

INSERT INTO users (
  email,
  password_hash,
  full_name,
  role,
  status,
  company_name,
  contact_person,
  position
) VALUES (
  'admin@oscarpart.id',
  '$2b$12$PLACEHOLDER_HASH_CHANGE_ON_FIRST_RUN',  -- replaced by setup script
  'OSCARPART Administrator',
  'superadmin',
  'approved',
  'OSCARPART',
  'System Administrator',
  'Superadmin'
);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

INSERT INTO settings (key, value, value_type, description) VALUES
  -- Company
  ('company_name',          'OSCARPART',                       'string',  'Company display name'),
  ('company_tagline',       'Mining Parts & Equipment Specialist', 'string', 'Company tagline'),
  ('company_address',       'Jl. Soekarno Hatta No.XX, Balikpapan, Kalimantan Timur', 'string', 'Registered address'),
  ('company_phone',         '+62 XXX-XXXX-XXXX',               'string',  'Main phone number'),
  ('company_email',         'info@oscarpart.id',               'string',  'Main email address'),
  ('company_website',       'https://oscarpart.id',            'string',  'Website URL'),

  -- WhatsApp
  ('whatsapp_number',       '62XXXXXXXXXX',                    'string',  'WhatsApp Business number (international format, no +)'),
  ('whatsapp_enabled',      'true',                            'boolean', 'Enable WhatsApp RFQ redirect'),

  -- Financial
  ('tax_rate',              '11',                              'number',  'PPN percentage (default 11%)'),
  ('currency',              'IDR',                             'string',  'Default currency'),
  ('currency_symbol',       'Rp',                              'string',  'Currency symbol'),

  -- RFQ Settings
  ('rfq_validity_days',     '7',                               'number',  'Default RFQ validity in days'),
  ('rfq_template_s3_key',   '',                                'string',  'S3 key for downloadable RFQ template XLSX'),

  -- Auth
  ('jwt_access_expiry',     '15m',                             'string',  'JWT access token expiry'),
  ('jwt_refresh_expiry',    '30d',                             'string',  'JWT refresh token expiry'),
  ('registration_enabled',  'true',                            'boolean', 'Allow new user registrations'),
  ('require_approval',      'true',                            'boolean', 'Require admin approval before access'),

  -- Email
  ('email_from_name',       'OSCARPART',                       'string',  'Email sender name'),
  ('email_from_address',    'noreply@oscarpart.id',            'string',  'Email sender address'),
  ('email_admin_notify',    'admin@oscarpart.id',              'string',  'Admin email for notifications'),

  -- Search
  ('search_rate_limit_public',    '30',  'number', 'Search requests per minute for public users'),
  ('search_rate_limit_registered','60',  'number', 'Search requests per minute for registered users'),
  ('search_cache_ttl',            '300', 'number', 'Part search cache TTL in seconds (Redis)'),

  -- Security
  ('max_upload_size_mb',    '10',   'number',  'Maximum file upload size in MB'),
  ('allowed_file_types',    'xlsx,xls,csv', 'string', 'Allowed upload file extensions'),
  ('session_max_age_days',  '30',   'number',  'Maximum session age in days'),

  -- PDF
  ('pdf_watermark_enabled', 'true', 'boolean', 'Enable dynamic watermark on PDFs');
