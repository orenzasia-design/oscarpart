-- ============================================================
-- OSCARPART Enterprise Platform — PostgreSQL Schema
-- Version: 1.0.0
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'public',
  'registered',
  'approved',
  'admin',
  'superadmin'
);

CREATE TYPE user_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

CREATE TYPE part_status AS ENUM (
  'active',
  'inactive',
  'discontinued'
);

CREATE TYPE rfq_status AS ENUM (
  'draft',
  'submitted',
  'processing',
  'quoted',
  'closed',
  'cancelled'
);

CREATE TYPE match_status AS ENUM (
  'matched',
  'unmatched',
  'partial'
);

CREATE TYPE lead_source AS ENUM (
  'search',
  'rfq-manual',
  'rfq-upload',
  'direct'
);

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'won',
  'lost'
);

CREATE TYPE notification_type AS ENUM (
  'email',
  'whatsapp',
  'system'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sent',
  'failed'
);

CREATE TYPE file_type AS ENUM (
  'xlsx',
  'xls',
  'csv'
);

CREATE TYPE processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- ============================================================
-- TABLE 1: brands
-- ============================================================

CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  logo_url      TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: warehouses
-- ============================================================

CREATE TABLE warehouses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  location    VARCHAR(255),
  code        VARCHAR(20) NOT NULL UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: parts
-- ============================================================

CREATE TABLE parts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_number         VARCHAR(100) NOT NULL UNIQUE,
  description         TEXT,
  unit_type           VARCHAR(50),
  brand_id            UUID REFERENCES brands(id) ON DELETE SET NULL,
  brand_name          VARCHAR(100),                          -- denormalised for speed
  stock_quantity      NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price          NUMERIC(15,2),                        -- NULL = price on request
  warehouse_id        UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  warehouse_location  VARCHAR(50),                          -- denormalised
  status              part_status NOT NULL DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: users
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(150) NOT NULL,
  role              user_role NOT NULL DEFAULT 'registered',
  status            user_status NOT NULL DEFAULT 'pending',

  -- Company / business info
  company_name      VARCHAR(200),
  business_type     VARCHAR(100),
  contact_person    VARCHAR(150),
  position          VARCHAR(100),
  mobile_number     VARCHAR(30),
  whatsapp_number   VARCHAR(30),
  project_location  VARCHAR(255),
  industry          VARCHAR(100),
  website           VARCHAR(255),

  -- Approval tracking
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ
);

-- ============================================================
-- TABLE 5: refresh_tokens
-- ============================================================

CREATE TABLE refresh_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked       BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at    TIMESTAMPTZ,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: rfq_number_sequences (atomic counter per day)
-- ============================================================

CREATE TABLE rfq_number_sequences (
  date           DATE PRIMARY KEY,
  last_sequence  INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- TABLE 7: rfq_sessions
-- ============================================================

CREATE TABLE rfq_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_number          VARCHAR(30) NOT NULL UNIQUE,           -- RFQ-20260526-0001
  user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token       VARCHAR(255),                          -- for anonymous sessions

  -- Customer snapshot (captured at submission time)
  company_name        VARCHAR(200),
  contact_person      VARCHAR(150),
  position            VARCHAR(100),
  email               VARCHAR(255),
  whatsapp            VARCHAR(30),
  project_name        VARCHAR(255),
  delivery_location   VARCHAR(255),
  notes               TEXT,

  -- Status & financials
  status              rfq_status NOT NULL DEFAULT 'draft',
  subtotal            NUMERIC(15,2),
  tax_rate            NUMERIC(5,2) NOT NULL DEFAULT 11.00,   -- PPN 11%
  tax_amount          NUMERIC(15,2),
  grand_total         NUMERIC(15,2),

  -- PDF
  pdf_path            TEXT,                                  -- S3 key
  pdf_generated_at    TIMESTAMPTZ,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: rfq_items
-- ============================================================

CREATE TABLE rfq_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_session_id      UUID NOT NULL REFERENCES rfq_sessions(id) ON DELETE CASCADE,
  part_number         VARCHAR(100) NOT NULL,
  part_id             UUID REFERENCES parts(id) ON DELETE SET NULL,
  description         TEXT,
  brand               VARCHAR(100),
  unit_type           VARCHAR(50),
  stock_available     NUMERIC(12,2),
  unit_price_at_time  NUMERIC(15,2),
  qty_requested       NUMERIC(12,2) NOT NULL DEFAULT 1,
  line_total          NUMERIC(15,2),
  match_status        match_status NOT NULL DEFAULT 'unmatched',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: rfq_uploads
-- ============================================================

CREATE TABLE rfq_uploads (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_session_id      UUID NOT NULL REFERENCES rfq_sessions(id) ON DELETE CASCADE,
  original_filename   VARCHAR(255) NOT NULL,
  s3_key              TEXT,
  file_type           file_type NOT NULL,
  file_size_bytes     INTEGER,
  rows_total          INTEGER,
  rows_matched        INTEGER,
  rows_unmatched      INTEGER,
  processing_status   processing_status NOT NULL DEFAULT 'pending',
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: leads
-- ============================================================

CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_session_id    UUID REFERENCES rfq_sessions(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Contact snapshot
  company_name      VARCHAR(200),
  contact_person    VARCHAR(150),
  email             VARCHAR(255),
  whatsapp          VARCHAR(30),
  project_name      VARCHAR(255),
  industry          VARCHAR(100),

  -- CRM data
  lead_source       lead_source NOT NULL DEFAULT 'rfq-manual',
  lead_status       lead_status NOT NULL DEFAULT 'new',
  potential_value   NUMERIC(15,2),
  assigned_to       UUID REFERENCES users(id) ON DELETE SET NULL,
  notes             TEXT,
  contacted_at      TIMESTAMPTZ,
  closed_at         TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: search_logs
-- ============================================================

CREATE TABLE search_logs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id            VARCHAR(255),
  part_number_searched  VARCHAR(100) NOT NULL,
  found                 BOOLEAN NOT NULL DEFAULT FALSE,
  result_count          INTEGER NOT NULL DEFAULT 0,
  ip_address            VARCHAR(45),
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: audit_log
-- ============================================================

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     UUID,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: notifications
-- ============================================================

CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                  notification_type NOT NULL,
  recipient_user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_email       VARCHAR(255),
  recipient_whatsapp    VARCHAR(30),
  subject               VARCHAR(500),
  body                  TEXT NOT NULL,
  status                notification_status NOT NULL DEFAULT 'pending',
  sent_at               TIMESTAMPTZ,
  error_message         TEXT,
  retry_count           INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 14: settings
-- ============================================================

CREATE TABLE settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key           VARCHAR(100) NOT NULL UNIQUE,
  value         TEXT,
  value_type    VARCHAR(20) NOT NULL DEFAULT 'string',  -- string/number/boolean/json
  description   TEXT,
  updated_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 15: activity_feed (admin dashboard live feed)
-- ============================================================

CREATE TABLE activity_feed (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type     VARCHAR(50) NOT NULL,   -- 'search', 'rfq_submit', 'user_register', etc.
  description     TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_parts
  BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_rfq_sessions
  BEFORE UPDATE ON rfq_sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
