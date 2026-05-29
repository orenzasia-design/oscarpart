import { query } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';
import logger from '../config/logger';

// ============================================================
// Types
// ============================================================

export interface PartPublic {
  id: string;
  part_number: string;
  description: string | null;
  brand_name: string | null;
  unit_type: string | null;
  status: string;
}

export interface PartRegistered extends PartPublic {
  stock_quantity: number;
  warehouse_location: string | null;
}

export interface PartApproved extends PartRegistered {
  unit_price: number | null;
}

export interface SearchResult {
  found: boolean;
  exact: boolean;
  total: number;
  parts: PartPublic[] | PartRegistered[] | PartApproved[];
}

export interface BatchLookupItem {
  part_number: string;
  found: boolean;
  part: PartApproved | null;
}

// ============================================================
// Field sets per role (price gating)
// ============================================================

const FIELDS_PUBLIC = `
  id, part_number, description, brand_name, unit_type, status`;

const FIELDS_REGISTERED = `
  id, part_number, description, brand_name, unit_type, status,
  stock_quantity, warehouse_location`;

const FIELDS_APPROVED = `
  id, part_number, description, brand_name, unit_type, status,
  stock_quantity, warehouse_location, unit_price`;

function getFields(role?: string): string {
  if (!role || role === 'public' || role === 'registered') return FIELDS_REGISTERED;
  if (role === 'approved' || role === 'admin' || role === 'superadmin') return FIELDS_APPROVED;
  return FIELDS_PUBLIC;
}

// Cache TTL: 5 minutes for hot parts
const CACHE_TTL = parseInt(process.env.SEARCH_CACHE_TTL || '300');
const CACHE_PREFIX = 'parts:';

// ============================================================
// Single part search — exact + fuzzy fallback
// ============================================================

export async function searchParts(
  searchQuery: string,
  role: string = 'public',
  userId: string | null = null,
  sessionId: string | null = null,
  ipAddress: string | null = null,
  userAgent: string | null = null
): Promise<SearchResult> {
  const q = searchQuery.trim().toUpperCase();
  const fields = getFields(role);
  const cacheKey = `${CACHE_PREFIX}${role}:${q}`;

  // Try cache first (only for exact lookups)
  const cached = await cacheGet<SearchResult>(cacheKey);
  if (cached) {
    // Log search (async, non-blocking)
    logSearch(q, userId, sessionId, cached.found, cached.total, ipAddress, userAgent);
    return { ...cached, parts: cached.parts };
  }

  // 1. Try exact match first (fastest)
  const exactResult = await query<Record<string, unknown>>(
    `SELECT ${fields}
     FROM parts
     WHERE part_number = $1
       AND status = 'active'
     LIMIT 1`,
    [q]
  );

  if (exactResult.rowCount > 0) {
    const result: SearchResult = {
      found: true,
      exact: true,
      total: 1,
      parts: exactResult.rows as unknown as PartApproved[],
    };
    await cacheSet(cacheKey, result, CACHE_TTL);
    logSearch(q, userId, sessionId, true, 1, ipAddress, userAgent);
    return result;
  }

  // 2. Fuzzy search using pg_trgm similarity (handles typos + partial matches)
  const fuzzyResult = await query<Record<string, unknown>>(
    `SELECT ${fields},
            similarity(part_number, $1) AS sim_score
     FROM parts
     WHERE (
       part_number % $1                              -- trigram similarity
       OR part_number ILIKE $2                       -- prefix match
       OR to_tsvector('english', COALESCE(part_number,'') || ' ' || COALESCE(description,''))
          @@ plainto_tsquery('english', $3)          -- full-text
     )
     AND status = 'active'
     ORDER BY
       similarity(part_number, $1) DESC,
       CASE WHEN part_number ILIKE $2 THEN 0 ELSE 1 END
     LIMIT 10`,
    [q, `${q}%`, searchQuery]
  );

  const found = fuzzyResult.rowCount > 0;

  // Remove internal sim_score from response
  const parts = fuzzyResult.rows.map(({ sim_score: _, ...rest }) => rest);

  const result: SearchResult = {
    found,
    exact: false,
    total: fuzzyResult.rowCount,
    parts: parts as unknown as PartApproved[],
  };

  if (found) {
    await cacheSet(cacheKey, result, CACHE_TTL);
  }

  logSearch(q, userId, sessionId, found, fuzzyResult.rowCount, ipAddress, userAgent);
  return result;
}

// ============================================================
// Batch lookup — for RFQ engine (array of part numbers)
// Only available to approved+ users
// ============================================================

export async function batchLookup(
  partNumbers: string[],
  role: string = 'approved'
): Promise<BatchLookupItem[]> {
  if (!partNumbers || partNumbers.length === 0) return [];
  if (partNumbers.length > 500) {
    throw new Error('BATCH_TOO_LARGE');
  }

  const normalized = partNumbers.map((p) => p.trim().toUpperCase());
  const fields = getFields(role);

  // Single query for all part numbers
  const result = await query<PartApproved & { part_number: string }>(
    `SELECT ${fields}
     FROM parts
     WHERE part_number = ANY($1::text[])
       AND status = 'active'`,
    [normalized as unknown as string]
  );

  const foundMap = new Map<string, PartApproved>();
  result.rows.forEach((p) => foundMap.set(p.part_number, p));

  return normalized.map((pn) => ({
    part_number: pn,
    found: foundMap.has(pn),
    part: foundMap.get(pn) || null,
  }));
}

// ============================================================
// Admin: full part list with pagination
// ============================================================

export async function adminListParts(options: {
  page: number;
  limit: number;
  search?: string;
  brand?: string;
  status?: string;
  warehouse?: string;
}): Promise<{ parts: PartApproved[]; total: number }> {
  const { page, limit, search, brand, status, warehouse } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(part_number ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (brand) {
    conditions.push(`brand_name ILIKE $${idx}`);
    params.push(`%${brand}%`);
    idx++;
  }
  if (status) {
    conditions.push(`status = $${idx}`);
    params.push(status);
    idx++;
  }
  if (warehouse) {
    conditions.push(`warehouse_location ILIKE $${idx}`);
    params.push(`%${warehouse}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, partsRes] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) FROM parts ${where}`, params as string[]),
    query<PartApproved>(
      `SELECT id, part_number, description, brand_name, unit_type, status,
              stock_quantity, warehouse_location, unit_price, created_at, updated_at
       FROM parts ${where}
       ORDER BY part_number
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset] as string[]
    ),
  ]);

  return {
    parts: partsRes.rows,
    total: parseInt(countRes.rows[0].count),
  };
}

// ============================================================
// Admin: upsert single part
// ============================================================

export async function upsertPart(data: {
  part_number: string;
  description?: string;
  unit_type?: string;
  brand_name?: string;
  stock_quantity?: number;
  unit_price?: number;
  warehouse_location?: string;
  status?: string;
}): Promise<PartApproved> {
  const result = await query<PartApproved>(
    `INSERT INTO parts (
       part_number, description, unit_type, brand_name,
       stock_quantity, unit_price, warehouse_location, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::part_status, 'active'::part_status))
     ON CONFLICT (part_number) DO UPDATE SET
       description        = EXCLUDED.description,
       unit_type          = EXCLUDED.unit_type,
       brand_name         = EXCLUDED.brand_name,
       stock_quantity     = EXCLUDED.stock_quantity,
       unit_price         = EXCLUDED.unit_price,
       warehouse_location = EXCLUDED.warehouse_location,
       status             = EXCLUDED.status::part_status,
       updated_at         = NOW()
     RETURNING id, part_number, description, brand_name, unit_type,
               stock_quantity, unit_price, warehouse_location, status`,
    [
      data.part_number.toUpperCase(),
      data.description || null,
      data.unit_type || null,
      data.brand_name || null,
      data.stock_quantity ?? 0,
      data.unit_price ?? null,
      data.warehouse_location || null,
      data.status || 'active',
    ]
  );
  return result.rows[0];
}

// ============================================================
// Admin: bulk import from parsed XLSX data
// ============================================================

export async function bulkImportParts(
  rows: Array<{
    part_number: string;
    description?: string;
    unit_type?: string;
    brand_name?: string;
    stock_quantity?: number;
    unit_price?: number;
    warehouse_location?: string;
  }>
): Promise<{ imported: number; errors: string[] }> {
  let imported = 0;
  const errors: string[] = [];

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      await Promise.all(
        batch.map((row) => {
          if (!row.part_number) return Promise.resolve();
          return upsertPart(row).then(() => { imported++; });
        })
      );
    } catch (err) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err}`);
    }
  }

  return { imported, errors };
}

// ============================================================
// Trending parts (top searched)
// ============================================================

export async function getTrendingParts(days: number = 7, limit: number = 20): Promise<unknown[]> {
  const result = await query(
    `SELECT
       part_number_searched AS part_number,
       COUNT(*) AS search_count,
       SUM(CASE WHEN found THEN 1 ELSE 0 END) AS found_count
     FROM search_logs
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY part_number_searched
     ORDER BY search_count DESC
     LIMIT $1`,
    [limit.toString()]
  );
  return result.rows;
}

// ============================================================
// Internal: log search async
// ============================================================

function logSearch(
  partNumber: string,
  userId: string | null,
  sessionId: string | null,
  found: boolean,
  count: number,
  ip: string | null,
  ua: string | null
): void {
  query(
    `INSERT INTO search_logs
       (user_id, session_id, part_number_searched, found, result_count, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, sessionId, partNumber, found, count, ip, ua]
  ).catch((err: Error) => logger.error('Search log write failed', { err }));
}