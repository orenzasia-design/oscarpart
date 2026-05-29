import { query } from '../config/database';
import logger from '../config/logger';

export interface Lead {
  id: string;
  rfq_session_id: string | null;
  user_id: string | null;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  whatsapp: string | null;
  project_name: string | null;
  industry: string | null;
  lead_source: string;
  lead_status: string;
  potential_value: number | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  notes: string | null;
  contacted_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listLeads(options: {
  page: number;
  limit: number;
  status?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ leads: Lead[]; total: number }> {
  const { page, limit, status, source, assignedTo, search, dateFrom, dateTo } = options;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status)     { conditions.push(`l.lead_status = $${idx++}`);   params.push(status); }
  if (source)     { conditions.push(`l.lead_source = $${idx++}`);   params.push(source); }
  if (assignedTo) { conditions.push(`l.assigned_to = $${idx++}`);   params.push(assignedTo); }
  if (dateFrom)   { conditions.push(`l.created_at >= $${idx++}`);   params.push(dateFrom); }
  if (dateTo)     { conditions.push(`l.created_at <= $${idx++}`);   params.push(dateTo); }
  if (search) {
    conditions.push(`(l.company_name ILIKE $${idx} OR l.contact_person ILIKE $${idx} OR l.email ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRes, leadsRes] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) FROM leads l ${where}`, params as string[]),
    query<Lead>(
      `SELECT
         l.*,
         u.full_name AS assigned_to_name,
         r.rfq_number
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_to
       LEFT JOIN rfq_sessions r ON r.id = l.rfq_session_id
       ${where}
       ORDER BY
         CASE l.lead_status
           WHEN 'new'       THEN 1
           WHEN 'contacted' THEN 2
           WHEN 'qualified' THEN 3
           WHEN 'won'       THEN 4
           ELSE 5
         END,
         l.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset] as string[]
    ),
  ]);

  return { leads: leadsRes.rows, total: parseInt(countRes.rows[0].count) };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const result = await query<Lead>(
    `SELECT l.*, u.full_name AS assigned_to_name, r.rfq_number
     FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     LEFT JOIN rfq_sessions r ON r.id = l.rfq_session_id
     WHERE l.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function updateLead(
  id: string,
  adminId: string,
  updates: {
    lead_status?: string;
    assigned_to?: string;
    notes?: string;
    potential_value?: number;
    contacted_at?: string;
    closed_at?: string;
  }
): Promise<Lead> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  const allowed = ['lead_status', 'assigned_to', 'notes', 'potential_value', 'contacted_at', 'closed_at'];
  for (const key of allowed) {
    if (updates[key as keyof typeof updates] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      params.push(updates[key as keyof typeof updates]);
    }
  }

  if (fields.length === 0) throw new Error('NO_UPDATES');

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<Lead>(
    `UPDATE leads SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params as string[]
  );

  if (result.rowCount === 0) throw new Error('LEAD_NOT_FOUND');

  // Audit log
  await query(
    `INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'lead_update', 'leads', $2, $3)`,
    [adminId, id, JSON.stringify(updates)]
  );

  return result.rows[0];
}

export async function getLeadStats(): Promise<Record<string, unknown>> {
  const result = await query(
    `SELECT
       lead_status,
       COUNT(*) AS count,
       COALESCE(SUM(potential_value), 0) AS pipeline_value
     FROM leads
     GROUP BY lead_status`
  );

  const stats: Record<string, unknown> = {};
  (result.rows as Array<{ lead_status: string; count: string; pipeline_value: string }>)
    .forEach((r) => {
    stats[r.lead_status] = {
      count:          parseInt(r.count),
      pipeline_value: parseFloat(r.pipeline_value),
    };
  });

  const totalPipeline = await query<{ total: string }>(
    `SELECT COALESCE(SUM(potential_value), 0) AS total
     FROM leads WHERE lead_status NOT IN ('won','lost')`
  );

  return {
    by_status:        stats,
    active_pipeline:  parseFloat(totalPipeline.rows[0].total),
  };
}
