import { query, withTransaction } from '../config/database';
import { batchLookup } from './part-search.service';
import logger from '../config/logger';
import { PoolClient } from 'pg';

// ============================================================
// Types
// ============================================================

export interface RfqItem {
  part_number: string;
  description?: string;
  brand?: string;
  unit_type?: string;
  qty_requested: number;
}

export interface RfqCustomerInfo {
  company_name: string;
  contact_person: string;
  position: string;
  email: string;
  whatsapp: string;
  project_name: string;
  delivery_location: string;
  notes?: string;
}

export interface RfqSession {
  id: string;
  rfq_number: string;
  user_id: string | null;
  status: string;
  company_name: string | null;
  contact_person: string | null;
  position: string | null;
  email: string | null;
  whatsapp: string | null;
  project_name: string | null;
  delivery_location: string | null;
  notes: string | null;
  subtotal: number | null;
  tax_rate: number;
  tax_amount: number | null;
  grand_total: number | null;
  items: RfqItemResolved[];
  created_at: string;
  submitted_at: string | null;
  pdf_path: string | null;
}

export interface RfqItemResolved {
  id: string;
  part_number: string;
  description: string | null;
  brand: string | null;
  unit_type: string | null;
  stock_available: number | null;
  unit_price_at_time: number | null;
  qty_requested: number;
  line_total: number | null;
  match_status: 'matched' | 'unmatched' | 'partial';
  sort_order: number;
}

// ============================================================
// RFQ Number Generator (atomic per-day sequence)
// RFQ-YYYYMMDD-XXXX
// ============================================================

export async function generateRfqNumber(client: PoolClient): Promise<string> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const dateStr = today.replace(/-/g, '');             // YYYYMMDD

  const result = await client.query<{ last_sequence: number }>(
    `INSERT INTO rfq_number_sequences (date, last_sequence)
     VALUES ($1, 1)
     ON CONFLICT (date) DO UPDATE
       SET last_sequence = rfq_number_sequences.last_sequence + 1
     RETURNING last_sequence`,
    [today]
  );

  const seq = result.rows[0].last_sequence;
  return `RFQ-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// ============================================================
// Create draft RFQ session
// ============================================================

export async function createDraftRfq(
  userId: string | null,
  sessionToken: string | null
): Promise<{ id: string; rfq_number: string }> {
  const result = await withTransaction(async (client) => {
    const rfqNumber = await generateRfqNumber(client);

    const r = await client.query<{ id: string; rfq_number: string }>(
      `INSERT INTO rfq_sessions (rfq_number, user_id, session_token, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING id, rfq_number`,
      [rfqNumber, userId, sessionToken]
    );
    return r.rows[0];
  });
  return result;
}

// ============================================================
// Add/update items in RFQ — resolves against parts DB
// ============================================================

export async function resolveRfqItems(
  rfqSessionId: string,
  items: RfqItem[],
  role: string = 'approved'
): Promise<RfqItemResolved[]> {
  if (items.length === 0) return [];

  const partNumbers = items.map((i) => i.part_number);
  const lookupResults = await batchLookup(partNumbers, role);
  const lookupMap = new Map(lookupResults.map((r) => [r.part_number, r]));

  // Delete existing items for this session first (replace strategy)
  await query(
    'DELETE FROM rfq_items WHERE rfq_session_id = $1',
    [rfqSessionId]
  );

  const resolved: RfqItemResolved[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pn = item.part_number.trim().toUpperCase();
    const lookup = lookupMap.get(pn);
    const matchStatus = lookup?.found ? 'matched' : 'unmatched';
    const part = lookup?.part;

    const unitPrice = part?.unit_price ?? null;
    const lineTotal =
      unitPrice !== null ? parseFloat((unitPrice * item.qty_requested).toFixed(2)) : null;

    const r = await query<RfqItemResolved>(
      `INSERT INTO rfq_items (
         rfq_session_id, part_number, part_id,
         description, brand, unit_type,
         stock_available, unit_price_at_time,
         qty_requested, line_total, match_status, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        rfqSessionId,
        pn,
        part?.id || null,
        item.description || part?.description || null,
        item.brand       || part?.brand_name  || null,
        item.unit_type   || part?.unit_type   || null,
        part ? (part as { stock_quantity?: number }).stock_quantity ?? null : null,
        unitPrice,
        item.qty_requested,
        lineTotal,
        matchStatus,
        i,
      ]
    );

    resolved.push(r.rows[0]);
  }

  return resolved;
}

// ============================================================
// Calculate financials for an RFQ session
// ============================================================

export async function calculateRfqFinancials(
  rfqSessionId: string,
  taxRate: number = 11
): Promise<{ subtotal: number; taxAmount: number; grandTotal: number }> {
  const result = await query<{ subtotal: string }>(
    `SELECT COALESCE(SUM(line_total), 0) AS subtotal
     FROM rfq_items
     WHERE rfq_session_id = $1 AND line_total IS NOT NULL`,
    [rfqSessionId]
  );

  const subtotal  = parseFloat(result.rows[0].subtotal);
  const taxAmount = parseFloat((subtotal * (taxRate / 100)).toFixed(2));
  const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

  await query(
    `UPDATE rfq_sessions
     SET subtotal = $1, tax_amount = $2, grand_total = $3, tax_rate = $4, updated_at = NOW()
     WHERE id = $5`,
    [subtotal, taxAmount, grandTotal, taxRate, rfqSessionId]
  );

  return { subtotal, taxAmount, grandTotal };
}

// ============================================================
// Submit RFQ — finalise with customer info
// ============================================================

export async function submitRfq(
  rfqSessionId: string,
  customerInfo: RfqCustomerInfo,
  userId: string | null
): Promise<RfqSession> {
  // Validate: must have at least 1 item
  const itemCount = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM rfq_items WHERE rfq_session_id = $1',
    [rfqSessionId]
  );

  if (parseInt(itemCount.rows[0].count) === 0) {
    throw new Error('RFQ_NO_ITEMS');
  }

  // Check ownership
  const session = await query<{ user_id: string | null; session_token: string | null; status: string }>(
    'SELECT user_id, session_token, status FROM rfq_sessions WHERE id = $1',
    [rfqSessionId]
  );

  if (session.rowCount === 0) throw new Error('RFQ_NOT_FOUND');
  if (session.rows[0].status !== 'draft') throw new Error('RFQ_ALREADY_SUBMITTED');

  // Get tax rate from settings
  const settingRes = await query<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'tax_rate'`
  );
  const taxRate = parseFloat(settingRes.rows[0]?.value || '11');

  // Recalculate financials
  await calculateRfqFinancials(rfqSessionId, taxRate);

  // Update session to submitted
  const result = await query<RfqSession>(
    `UPDATE rfq_sessions SET
       status           = 'submitted',
       company_name     = $2,
       contact_person   = $3,
       position         = $4,
       email            = $5,
       whatsapp         = $6,
       project_name     = $7,
       delivery_location = $8,
       notes            = $9,
       submitted_at     = NOW(),
       updated_at       = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      rfqSessionId,
      customerInfo.company_name,
      customerInfo.contact_person,
      customerInfo.position,
      customerInfo.email,
      customerInfo.whatsapp,
      customerInfo.project_name,
      customerInfo.delivery_location,
      customerInfo.notes || null,
    ]
  );

  const rfq = result.rows[0];

  // Create Lead record (CRM capture)
  await createLeadFromRfq(rfq, userId);

  // Activity feed
  await query(
    `INSERT INTO activity_feed (actor_user_id, action_type, description, metadata)
     VALUES ($1, 'rfq_submit', $2, $3)`,
    [
      userId,
      `RFQ ${rfq.rfq_number} dikirim oleh ${customerInfo.company_name}`,
      JSON.stringify({
        rfqId:       rfq.id,
        rfqNumber:   rfq.rfq_number,
        company:     customerInfo.company_name,
        grandTotal:  rfq.grand_total,
      }),
    ]
  );

  // Return full RFQ with items
  return getRfqById(rfqSessionId);
}

// ============================================================
// Get full RFQ with items
// ============================================================

export async function getRfqById(rfqSessionId: string): Promise<RfqSession> {
  const [sessionRes, itemsRes] = await Promise.all([
    query<RfqSession>(
      'SELECT * FROM rfq_sessions WHERE id = $1',
      [rfqSessionId]
    ),
    query<RfqItemResolved>(
      'SELECT * FROM rfq_items WHERE rfq_session_id = $1 ORDER BY sort_order',
      [rfqSessionId]
    ),
  ]);

  if (sessionRes.rowCount === 0) throw new Error('RFQ_NOT_FOUND');

  return { ...sessionRes.rows[0], items: itemsRes.rows };
}

// ============================================================
// Admin: list all RFQs
// ============================================================

export async function adminListRfqs(options: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ rfqs: RfqSession[]; total: number }> {
  const { page, limit, status, search, dateFrom, dateTo } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) { conditions.push(`r.status = $${idx++}`); params.push(status); }
  if (search) {
    conditions.push(`(r.rfq_number ILIKE $${idx} OR r.company_name ILIKE $${idx} OR r.contact_person ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (dateFrom) { conditions.push(`r.created_at >= $${idx++}`); params.push(dateFrom); }
  if (dateTo)   { conditions.push(`r.created_at <= $${idx++}`); params.push(dateTo); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, rfqsRes] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) FROM rfq_sessions r ${where}`,
      params as string[]
    ),
    query<RfqSession>(
      `SELECT r.*,
              (SELECT COUNT(*) FROM rfq_items WHERE rfq_session_id = r.id) AS item_count
       FROM rfq_sessions r
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset] as string[]
    ),
  ]);

  return { rfqs: rfqsRes.rows, total: parseInt(countRes.rows[0].count) };
}

// ============================================================
// Internal: create CRM lead from submitted RFQ
// ============================================================

async function createLeadFromRfq(
  rfq: RfqSession,
  userId: string | null
): Promise<void> {
  try {
    await query(
      `INSERT INTO leads (
         rfq_session_id, user_id,
         company_name, contact_person, email, whatsapp,
         project_name, lead_source, lead_status, potential_value
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'rfq-manual', 'new', $8)
       ON CONFLICT DO NOTHING`,
      [
        rfq.id,
        userId,
        rfq.company_name,
        rfq.contact_person,
        rfq.email,
        rfq.whatsapp,
        rfq.project_name,
        rfq.grand_total,
      ]
    );
  } catch (err) {
    logger.error('Failed to create lead from RFQ', { rfqId: rfq.id, err });
  }
}
