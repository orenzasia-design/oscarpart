import { Request, Response } from 'express';
import { query } from '../config/database';

// Daftar model unit preset (bisa dipilih atau ketik sendiri)
export const UNIT_MODELS = [
  // Komatsu Dump Truck
  'HD785-7', 'HD785-8', 'HD465-7', 'HD325-7', 'HD255-5',
  // Komatsu Excavator
  'PC2000-8', 'PC1250-8', 'PC800-8', 'PC400-8', 'PC300-8', 'PC200-8', 'PC130-8',
  // Komatsu Dozer
  'D375A-6', 'D275A-5', 'D155A-6', 'D85EX-15', 'D65EX-16', 'D61EX-23',
  // Komatsu Grader
  'GD825A-2', 'GD705A-4', 'GD555-5',
  // Caterpillar Dump Truck
  '797F', '793F', '789D', '785D', '777G',
  // Caterpillar Excavator
  '6090 FS', '395', '390F', '374F', '352F', '336F', '330F', '320F',
  // Caterpillar Dozer
  'D11T', 'D10T2', 'D9T', 'D8T', 'D7E',
  // Hitachi
  'EX5600-6', 'EX3600-6', 'EX1900-6', 'EX1200-6', 'ZX870-5', 'ZX490-5',
  // Liebherr
  'R 9800', 'R 9600', 'R 9400', 'R 9350', 'R 9250',
  // Volvo
  'EC950F', 'EC750E', 'EC480E', 'EC380E',
];

// ============================================================
// GET /api/v1/units/models — daftar model preset
// ============================================================
export async function getUnitModels(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: UNIT_MODELS });
}

// ============================================================
// GET /api/v1/units/my — semua unit milik user yang login
// ============================================================
export async function getMyUnits(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const result = await query(
      `SELECT id, unit_name, model, serial_number, current_hm, hm_updated_at,
              last_pm_hm, last_pm_date, last_pm_notes,
              year_of_manufacture, site_location, notes, is_active, created_at, updated_at
       FROM customer_units
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/units — daftarkan unit baru
// ============================================================
export async function createUnit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { unit_name, model, serial_number, current_hm, year_of_manufacture, site_location, notes } = req.body;

    if (!unit_name || !model) {
      res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'Nama unit dan model wajib diisi.' });
      return;
    }

    const result = await query(
      `INSERT INTO customer_units
         (user_id, unit_name, model, serial_number, current_hm, hm_updated_at, year_of_manufacture, site_location, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, unit_name, model, serial_number, current_hm, hm_updated_at,
                 year_of_manufacture, site_location, notes, is_active, created_at`,
      [
        userId,
        unit_name.trim(),
        model.trim(),
        serial_number?.trim() || null,
        current_hm ? parseFloat(current_hm) : null,
        current_hm ? new Date() : null,
        year_of_manufacture ? parseInt(year_of_manufacture) : null,
        site_location?.trim() || null,
        notes?.trim() || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Unit berhasil didaftarkan.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/units/:id — update data unit (termasuk HM)
// ============================================================
export async function updateUnit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { unit_name, model, serial_number, current_hm, year_of_manufacture, site_location, notes } = req.body;

    // Pastikan unit milik user ini
    const existing = await query(
      `SELECT id, current_hm FROM customer_units WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [id, userId]
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Unit tidak ditemukan.' });
      return;
    }

    const hmChanged = current_hm !== undefined && parseFloat(current_hm) !== existing.rows[0].current_hm;

    const result = await query(
      `UPDATE customer_units SET
         unit_name           = COALESCE($1, unit_name),
         model               = COALESCE($2, model),
         serial_number       = COALESCE($3, serial_number),
         current_hm          = COALESCE($4, current_hm),
         hm_updated_at       = CASE WHEN $5 = true THEN NOW() ELSE hm_updated_at END,
         year_of_manufacture = COALESCE($6, year_of_manufacture),
         site_location       = COALESCE($7, site_location),
         notes               = COALESCE($8, notes),
         updated_at          = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING id, unit_name, model, serial_number, current_hm, hm_updated_at,
                 last_pm_hm, last_pm_date, last_pm_notes,
                 year_of_manufacture, site_location, notes, is_active, created_at, updated_at`,
      [
        unit_name?.trim() || null,
        model?.trim() || null,
        serial_number?.trim() || null,
        current_hm ? parseFloat(current_hm) : null,
        hmChanged,
        year_of_manufacture ? parseInt(year_of_manufacture) : null,
        site_location?.trim() || null,
        notes?.trim() || null,
        id,
        userId,
      ]
    );

    res.json({ success: true, data: result.rows[0], message: 'Unit berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// DELETE /api/v1/units/:id — hapus unit (soft delete)
// ============================================================
export async function deleteUnit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;

    const result = await query(
      `UPDATE customer_units SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_active = true
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, message: 'Unit berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/units — semua unit (admin only)
// ============================================================
export async function adminGetAllUnits(req: Request, res: Response): Promise<void> {
  try {
    const page  = parseInt(req.query.page as string)  || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT cu.id, cu.unit_name, cu.model, cu.serial_number, cu.current_hm,
              cu.hm_updated_at, cu.site_location, cu.is_active, cu.created_at,
              u.full_name, u.company_name, u.email
       FROM customer_units cu
       JOIN users u ON cu.user_id = u.id
       WHERE cu.is_active = true
       ORDER BY cu.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM customer_units WHERE is_active = true`
    );

    res.json({
      success: true,
      data: {
        units: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          page,
          limit,
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/units/:id/pm — catat PM selesai dilakukan
// Body: { last_pm_hm, last_pm_date?, last_pm_notes? }
// ============================================================
export async function recordPmDone(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const { id } = req.params;
    const { last_pm_hm, last_pm_date, last_pm_notes } = req.body;

    if (!last_pm_hm) {
      res.status(422).json({ success: false, error: 'VALIDATION_ERROR', message: 'last_pm_hm wajib diisi.' });
      return;
    }

    const existing = await query(
      `SELECT id FROM customer_units WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [id, userId]
    );
    if (!existing.rows.length) {
      res.status(404).json({ success: false, error: 'NOT_FOUND' });
      return;
    }

    const result = await query(
      `UPDATE customer_units SET
         last_pm_hm    = $1,
         last_pm_date  = COALESCE($2, NOW()),
         last_pm_notes = $3,
         updated_at    = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, unit_name, model, current_hm, last_pm_hm, last_pm_date, last_pm_notes`,
      [parseFloat(last_pm_hm), last_pm_date || null, last_pm_notes || null, id, userId]
    );

    res.json({ success: true, data: result.rows[0], message: 'PM berhasil dicatat.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/units/analytics — ringkasan PM & HM semua unit user
// ============================================================
export async function getUnitAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    // All units with PM data
    const units = await query(
      `SELECT id, unit_name, model, current_hm, last_pm_hm, last_pm_date,
              hm_updated_at, site_location, year_of_manufacture
       FROM customer_units
       WHERE user_id = $1 AND is_active = true
       ORDER BY unit_name ASC`,
      [userId]
    );

    // PM bundle thresholds per model (join pm_bundles)
    const bundles = await query(
      `SELECT DISTINCT ON (unit_model) unit_model, interval_hm
       FROM pm_bundles
       ORDER BY unit_model, interval_hm ASC`
    );
    const intervalMap: Record<string, number> = {};
    bundles.rows.forEach((b: { unit_model: string; interval_hm: number }) => {
      intervalMap[b.unit_model] = b.interval_hm;
    });

    const rows = units.rows.map((u: {
      id: string; unit_name: string; model: string;
      current_hm: number | null; last_pm_hm: number | null;
      last_pm_date: string | null; hm_updated_at: string | null;
      site_location: string | null; year_of_manufacture: number | null;
    }) => {
      const interval = intervalMap[u.model] || 250;
      const currentHm = u.current_hm || 0;
      const lastPmHm  = u.last_pm_hm || 0;
      const hmSincePm = currentHm - lastPmHm;
      const hmToNext  = interval - hmSincePm;
      const pctUsed   = Math.min(100, Math.round((hmSincePm / interval) * 100));
      let status: 'ok' | 'due_soon' | 'overdue' = 'ok';
      if (hmToNext <= 0)  status = 'overdue';
      else if (hmToNext <= 50) status = 'due_soon';
      return {
        id: u.id,
        unit_name: u.unit_name,
        model: u.model,
        current_hm: currentHm,
        last_pm_hm: lastPmHm,
        last_pm_date: u.last_pm_date,
        hm_updated_at: u.hm_updated_at,
        site_location: u.site_location,
        year_of_manufacture: u.year_of_manufacture,
        interval_hm: interval,
        hm_since_pm: Math.max(0, hmSincePm),
        hm_to_next_pm: hmToNext,
        pct_used: pctUsed,
        status,
      };
    });

    const summary = {
      total: rows.length,
      ok:       rows.filter((r: { status: string }) => r.status === 'ok').length,
      due_soon: rows.filter((r: { status: string }) => r.status === 'due_soon').length,
      overdue:  rows.filter((r: { status: string }) => r.status === 'overdue').length,
    };

    res.json({ success: true, data: { summary, units: rows } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/units — semua unit semua customer (admin only)
// Query params: ?status=overdue|due_soon|ok&search=keyword&limit=50&page=1
// ============================================================
export async function adminGetAllUnits(req: Request, res: Response): Promise<void> {
  try {
    const { status, search, limit: lq, page: pq } = req.query as Record<string, string>;
    const limit = Math.min(parseInt(lq || '50'), 100);
    const page  = Math.max(parseInt(pq || '1'), 1);
    const offset = (page - 1) * limit;

    // Build WHERE clauses
    const conditions: string[] = ['cu.is_active = true'];
    const params: unknown[] = [];
    let pi = 1;

    if (search) {
      conditions.push(`(cu.unit_name ILIKE $${pi} OR cu.model ILIKE $${pi} OR u.full_name ILIKE $${pi} OR u.company_name ILIKE $${pi})`);
      params.push(`%${search}%`);
      pi++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const rows = await query(
      `SELECT
         cu.id, cu.unit_name, cu.model, cu.serial_number,
         cu.current_hm, cu.hm_updated_at,
         cu.last_pm_hm, cu.last_pm_date,
         cu.site_location, cu.year_of_manufacture,
         u.id AS user_id, u.full_name, u.company_name, u.phone,
         COALESCE(pb.interval_hm, 250) AS interval_hm
       FROM customer_units cu
       JOIN users u ON u.id = cu.user_id
       LEFT JOIN LATERAL (
         SELECT interval_hm FROM pm_bundles
         WHERE unit_model = cu.model
         ORDER BY interval_hm ASC LIMIT 1
       ) pb ON true
       ${where}
       ORDER BY cu.updated_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    const countRes = await query(
      `SELECT COUNT(*) FROM customer_units cu
       JOIN users u ON u.id = cu.user_id
       ${where}`,
      params
    );

    // Compute PM status for each unit
    const mapped = rows.rows.map((u: {
      id: string; unit_name: string; model: string; serial_number: string | null;
      current_hm: number | null; hm_updated_at: string | null;
      last_pm_hm: number | null; last_pm_date: string | null;
      site_location: string | null; year_of_manufacture: number | null;
      user_id: string; full_name: string; company_name: string | null; phone: string | null;
      interval_hm: number;
    }) => {
      const cur = u.current_hm || 0;
      const lastPm = u.last_pm_hm || 0;
      const hmSince = Math.max(0, cur - lastPm);
      const hmToNext = u.interval_hm - hmSince;
      let pm_status: 'ok' | 'due_soon' | 'overdue' = 'ok';
      if (hmToNext <= 0) pm_status = 'overdue';
      else if (hmToNext <= 50) pm_status = 'due_soon';
      return { ...u, hm_since_pm: hmSince, hm_to_next_pm: hmToNext, pm_status };
    });

    // Filter by status after computing
    const filtered = status ? mapped.filter((u: { pm_status: string }) => u.pm_status === status) : mapped;

    // Summary counts (from full unfiltered set for KPIs)
    const all = mapped;
    const summary = {
      total:    all.length,
      ok:       all.filter((u: { pm_status: string }) => u.pm_status === 'ok').length,
      due_soon: all.filter((u: { pm_status: string }) => u.pm_status === 'due_soon').length,
      overdue:  all.filter((u: { pm_status: string }) => u.pm_status === 'overdue').length,
    };

    res.json({
      success: true,
      data: {
        summary,
        units: filtered,
        pagination: {
          total: parseInt(countRes.rows[0].count),
          page, limit,
          totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
