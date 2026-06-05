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
