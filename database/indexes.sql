-- ============================================================
-- OSCARPART Enterprise Platform — Performance Indexes
-- ============================================================

-- ============================================================
-- parts — critical for 100k+ row search performance
-- ============================================================

-- Primary search: exact part number lookup (most common)
CREATE UNIQUE INDEX idx_parts_part_number
  ON parts (part_number);

-- Trigram index for fuzzy/partial part number search (pg_trgm)
CREATE INDEX idx_parts_part_number_trgm
  ON parts USING GIN (part_number gin_trgm_ops);

-- Full-text search across part_number + description
CREATE INDEX idx_parts_fts
  ON parts USING GIN (
    to_tsvector('english', COALESCE(part_number, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand_name, ''))
  );

-- Filter by brand and status (admin list view)
CREATE INDEX idx_parts_brand_status
  ON parts (brand_id, status);

-- Active parts only (most queries filter by active)
CREATE INDEX idx_parts_status
  ON parts (status) WHERE status = 'active';

-- Warehouse filter
CREATE INDEX idx_parts_warehouse
  ON parts (warehouse_id);

-- ============================================================
-- users
-- ============================================================

-- Login lookup
CREATE UNIQUE INDEX idx_users_email
  ON users (email);

-- Admin approval queue (pending users)
CREATE INDEX idx_users_status_role
  ON users (status, role);

-- Pending approval queue specifically
CREATE INDEX idx_users_pending
  ON users (status, created_at DESC) WHERE status = 'pending';

-- ============================================================
-- refresh_tokens
-- ============================================================

CREATE UNIQUE INDEX idx_refresh_tokens_hash
  ON refresh_tokens (token_hash);

-- Cleanup: expired/revoked tokens
CREATE INDEX idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

CREATE INDEX idx_refresh_tokens_expires
  ON refresh_tokens (expires_at) WHERE revoked = FALSE;

-- ============================================================
-- rfq_sessions
-- ============================================================

CREATE UNIQUE INDEX idx_rfq_sessions_rfq_number
  ON rfq_sessions (rfq_number);

-- Customer lookup their own RFQs
CREATE INDEX idx_rfq_sessions_user_id
  ON rfq_sessions (user_id, created_at DESC);

-- Admin dashboard filters
CREATE INDEX idx_rfq_sessions_status
  ON rfq_sessions (status, created_at DESC);

-- Date range queries
CREATE INDEX idx_rfq_sessions_submitted_at
  ON rfq_sessions (submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Session token lookup (anonymous users)
CREATE INDEX idx_rfq_sessions_session_token
  ON rfq_sessions (session_token) WHERE session_token IS NOT NULL;

-- ============================================================
-- rfq_items
-- ============================================================

-- Get all items for a session (most common query)
CREATE INDEX idx_rfq_items_session_id
  ON rfq_items (rfq_session_id, sort_order);

-- Part number to find all RFQs containing a specific part
CREATE INDEX idx_rfq_items_part_number
  ON rfq_items (part_number);

-- Match status filter (analytics: how many unmatched)
CREATE INDEX idx_rfq_items_match_status
  ON rfq_items (match_status);

-- ============================================================
-- rfq_uploads
-- ============================================================

CREATE INDEX idx_rfq_uploads_session_id
  ON rfq_uploads (rfq_session_id);

CREATE INDEX idx_rfq_uploads_processing_status
  ON rfq_uploads (processing_status) WHERE processing_status IN ('pending', 'processing');

-- ============================================================
-- leads
-- ============================================================

-- CRM list view with status filter
CREATE INDEX idx_leads_status_created
  ON leads (lead_status, created_at DESC);

-- Assigned to (salesperson view)
CREATE INDEX idx_leads_assigned_to
  ON leads (assigned_to, lead_status);

-- Link back to RFQ
CREATE INDEX idx_leads_rfq_session_id
  ON leads (rfq_session_id);

-- Customer lookup
CREATE INDEX idx_leads_user_id
  ON leads (user_id);

-- ============================================================
-- search_logs (analytics — high write volume)
-- ============================================================

-- Trending parts (most searched)
CREATE INDEX idx_search_logs_part_number
  ON search_logs (part_number_searched, created_at DESC);

-- Daily analytics queries
CREATE INDEX idx_search_logs_created_at
  ON search_logs (created_at DESC);

-- User search history
CREATE INDEX idx_search_logs_user_id
  ON search_logs (user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- ============================================================
-- audit_log (security — high write volume)
-- ============================================================

-- Admin audit trail by user
CREATE INDEX idx_audit_log_user_id
  ON audit_log (user_id, created_at DESC);

-- Filter by action type
CREATE INDEX idx_audit_log_action
  ON audit_log (action, created_at DESC);

-- Entity trace
CREATE INDEX idx_audit_log_entity
  ON audit_log (entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- Time-range queries
CREATE INDEX idx_audit_log_created_at
  ON audit_log (created_at DESC);

-- ============================================================
-- notifications
-- ============================================================

-- Pending send queue
CREATE INDEX idx_notifications_status
  ON notifications (status, created_at) WHERE status = 'pending';

-- User notification history
CREATE INDEX idx_notifications_recipient
  ON notifications (recipient_user_id, created_at DESC) WHERE recipient_user_id IS NOT NULL;

-- ============================================================
-- activity_feed (admin dashboard live feed)
-- ============================================================

CREATE INDEX idx_activity_feed_created_at
  ON activity_feed (created_at DESC);

CREATE INDEX idx_activity_feed_action_type
  ON activity_feed (action_type, created_at DESC);

-- ============================================================
-- rfq_number_sequences
-- ============================================================

-- Primary key on date already handles this, no additional index needed
