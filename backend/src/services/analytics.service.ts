import { query } from '../config/database';
import { cacheGet, cacheSet } from '../config/redis';

const ANALYTICS_CACHE_TTL = 300; // 5 minutes

// ============================================================
// Dashboard Overview KPIs
// ============================================================

export async function getDashboardKpis(): Promise<Record<string, unknown>> {
  const cacheKey = 'analytics:kpis';
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) return cached;

  const [
    newLeadsToday,
    rfqsThisWeek,
    pipelineValue,
    pendingApprovals,
    searchesToday,
    activeCustomers,
  ] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM leads WHERE created_at >= CURRENT_DATE`
    ),
    query<{ count: string; total: string }>(
      `SELECT COUNT(*) AS count, COALESCE(SUM(grand_total), 0) AS total
       FROM rfq_sessions
       WHERE status != 'draft' AND created_at >= NOW() - INTERVAL '7 days'`
    ),
    query<{ total: string }>(
      `SELECT COALESCE(SUM(potential_value), 0) AS total
       FROM leads WHERE lead_status NOT IN ('won','lost')`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users WHERE status = 'pending'`
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM search_logs WHERE created_at >= CURRENT_DATE`
    ),
    query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) AS count FROM rfq_sessions
       WHERE user_id IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'`
    ),
  ]);

  const result = {
    new_leads_today:     parseInt(newLeadsToday.rows[0].count),
    rfqs_this_week:      parseInt(rfqsThisWeek.rows[0].count),
    rfq_value_this_week: parseFloat(rfqsThisWeek.rows[0].total),
    active_pipeline:     parseFloat(pipelineValue.rows[0].total),
    pending_approvals:   parseInt(pendingApprovals.rows[0].count),
    searches_today:      parseInt(searchesToday.rows[0].count),
    active_customers_30d: parseInt(activeCustomers.rows[0].count),
    generated_at:        new Date().toISOString(),
  };

  await cacheSet(cacheKey, result, ANALYTICS_CACHE_TTL);
  return result;
}

// ============================================================
// Search Trends (top searched parts)
// ============================================================

export async function getSearchTrends(days: number = 30): Promise<unknown[]> {
  const cacheKey = `analytics:search-trends:${days}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const result = await query(
    `SELECT
       part_number_searched,
       COUNT(*) AS total_searches,
       SUM(CASE WHEN found THEN 1 ELSE 0 END) AS found_count,
       SUM(CASE WHEN NOT found THEN 1 ELSE 0 END) AS not_found_count,
       ROUND(SUM(CASE WHEN found THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) AS found_rate_pct
     FROM search_logs
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY part_number_searched
     ORDER BY total_searches DESC
     LIMIT 50`
  );

  await cacheSet(cacheKey, result.rows, ANALYTICS_CACHE_TTL);
  return result.rows;
}

// ============================================================
// Parts Not Found (opportunity to add stock)
// ============================================================

export async function getPartsNotFound(days: number = 30): Promise<unknown[]> {
  const result = await query(
    `SELECT
       part_number_searched,
       COUNT(*) AS search_count,
       COUNT(DISTINCT COALESCE(user_id::text, ip_address)) AS unique_requestors,
       MAX(created_at) AS last_searched
     FROM search_logs
     WHERE found = FALSE
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY part_number_searched
     ORDER BY search_count DESC
     LIMIT 100`
  );
  return result.rows;
}

// ============================================================
// RFQ Trends (daily/weekly/monthly)
// ============================================================

export async function getRfqTrends(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<unknown[]> {
  const cacheKey = `analytics:rfq-trends:${period}`;
  const cached = await cacheGet<unknown[]>(cacheKey);
  if (cached) return cached;

  const truncMap = { daily: 'day', weekly: 'week', monthly: 'month' };
  const trunc = truncMap[period];

  const result = await query(
    `SELECT
       DATE_TRUNC('${trunc}', created_at) AS period,
       COUNT(*) AS rfq_count,
       COALESCE(SUM(grand_total), 0) AS total_value,
       COUNT(CASE WHEN status = 'quoted' OR status = 'closed' THEN 1 END) AS converted
     FROM rfq_sessions
     WHERE status != 'draft'
       AND created_at >= NOW() - INTERVAL '90 days'
     GROUP BY DATE_TRUNC('${trunc}', created_at)
     ORDER BY period DESC
     LIMIT 30`
  );

  await cacheSet(cacheKey, result.rows, ANALYTICS_CACHE_TTL);
  return result.rows;
}

// ============================================================
// Top Customers by RFQ value
// ============================================================

export async function getTopCustomers(limit: number = 10): Promise<unknown[]> {
  const result = await query(
    `SELECT
       u.id,
       u.full_name,
       u.company_name,
       u.email,
       COUNT(r.id) AS rfq_count,
       COALESCE(SUM(r.grand_total), 0) AS total_rfq_value,
       MAX(r.submitted_at) AS last_rfq_at
     FROM users u
     JOIN rfq_sessions r ON r.user_id = u.id
     WHERE r.status != 'draft'
     GROUP BY u.id, u.full_name, u.company_name, u.email
     ORDER BY total_rfq_value DESC
     LIMIT $1`,
    [limit.toString()]
  );
  return result.rows;
}

// ============================================================
// Revenue Pipeline by lead status
// ============================================================

export async function getRevenuePipeline(): Promise<unknown[]> {
  const result = await query(
    `SELECT
       lead_status,
       COUNT(*) AS count,
       COALESCE(SUM(potential_value), 0) AS total_value,
       ROUND(AVG(potential_value), 0) AS avg_value
     FROM leads
     GROUP BY lead_status
     ORDER BY
       CASE lead_status
         WHEN 'new'       THEN 1
         WHEN 'contacted' THEN 2
         WHEN 'qualified' THEN 3
         WHEN 'won'       THEN 4
         WHEN 'lost'      THEN 5
       END`
  );
  return result.rows;
}

// ============================================================
// Top Brands (by search + RFQ)
// ============================================================

export async function getTopBrands(): Promise<unknown[]> {
  const result = await query(
    `SELECT
       COALESCE(brand_name, 'Unknown') AS brand,
       COUNT(*) AS part_count,
       SUM(stock_quantity) AS total_stock,
       COALESCE(AVG(unit_price), 0) AS avg_price
     FROM parts
     WHERE status = 'active'
     GROUP BY brand_name
     ORDER BY part_count DESC
     LIMIT 20`
  );
  return result.rows;
}

// ============================================================
// Recent Activity Feed
// ============================================================

export async function getActivityFeed(limit: number = 50): Promise<unknown[]> {
  const result = await query(
    `SELECT
       a.id,
       a.action_type,
       a.description,
       a.metadata,
       a.created_at,
       u.full_name AS actor_name,
       u.company_name AS actor_company
     FROM activity_feed a
     LEFT JOIN users u ON u.id = a.actor_user_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit.toString()]
  );
  return result.rows;
}

// ============================================================
// Search volume chart data (last 30 days)
// ============================================================

export async function getSearchVolumeChart(): Promise<unknown[]> {
  const result = await query(
    `SELECT
       DATE_TRUNC('day', created_at) AS date,
       COUNT(*) AS total_searches,
       SUM(CASE WHEN found THEN 1 ELSE 0 END) AS found,
       SUM(CASE WHEN NOT found THEN 1 ELSE 0 END) AS not_found
     FROM search_logs
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE_TRUNC('day', created_at)
     ORDER BY date ASC`
  );
  return result.rows;
}
