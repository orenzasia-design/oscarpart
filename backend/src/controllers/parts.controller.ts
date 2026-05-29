import { Request, Response } from 'express';
import {
  searchParts,
  batchLookup,
  adminListParts,
  upsertPart,
  bulkImportParts,
  getTrendingParts,
} from '../services/part-search.service';
import logger from '../config/logger';

// ============================================================
// GET /api/v1/parts/search?q=PART_NUMBER
// Public — role-filtered response
// ============================================================

export async function search(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q || q.length < 2) {
      res.status(422).json({
        success: false,
        error: 'INVALID_QUERY',
        message: 'Masukkan minimal 2 karakter untuk pencarian.',
      });
      return;
    }

    const role      = req.user?.role || 'public';
    const userId    = req.user?.sub || null;
    const sessionId = (req.query.sid as string) || req.headers['x-session-id'] as string || null;
    const ip        = req.ip || null;
    const ua        = req.headers['user-agent'] || null;

    const result = await searchParts(q, role, userId, sessionId, ip, ua);

    // Add registration CTA for unauthenticated users
    const meta: Record<string, unknown> = {};
    if (!req.user) {
      meta.login_required = true;
      meta.message        = 'Login sebagai customer terdaftar untuk melihat stok dan harga.';
    } else if (req.user.role === 'registered' || req.user.status === 'pending') {
      meta.approval_required = true;
      meta.message           = 'Akun Anda sedang dalam proses review. Harga akan tersedia setelah disetujui.';
    }

    res.status(200).json({
      success: true,
      data:    { ...result, meta },
    });
  } catch (err) {
    logger.error('Search error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/parts/batch-lookup
// Requires approved+ — used by RFQ engine
// ============================================================

export async function batchSearch(req: Request, res: Response): Promise<void> {
  try {
    const { part_numbers } = req.body;

    if (!Array.isArray(part_numbers) || part_numbers.length === 0) {
      res.status(422).json({
        success: false,
        error:   'INVALID_INPUT',
        message: 'part_numbers harus berupa array.',
      });
      return;
    }

    if (part_numbers.length > 500) {
      res.status(422).json({
        success: false,
        error:   'TOO_MANY_PARTS',
        message: 'Maksimal 500 part number per request.',
      });
      return;
    }

    const role   = req.user?.role || 'approved';
    const result = await batchLookup(part_numbers, role);

    res.status(200).json({
      success: true,
      data: {
        results:       result,
        total:         result.length,
        matched:       result.filter((r) => r.found).length,
        unmatched:     result.filter((r) => !r.found).length,
      },
    });
  } catch (err) {
    logger.error('Batch lookup error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/parts
// Admin — full paginated list
// ============================================================

export async function adminList(req: Request, res: Response): Promise<void> {
  try {
    const page      = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit     = Math.min(200, parseInt(req.query.limit as string || '50'));
    const search    = req.query.search as string;
    const brand     = req.query.brand as string;
    const status    = req.query.status as string;
    const warehouse = req.query.warehouse as string;

    const { parts, total } = await adminListParts({ page, limit, search, brand, status, warehouse });

    res.status(200).json({
      success: true,
      data: {
        parts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    logger.error('Admin list parts error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PUT /api/v1/admin/parts/:partNumber
// Admin — create or update single part
// ============================================================

export async function adminUpsert(req: Request, res: Response): Promise<void> {
  try {
    const partNumber = decodeURIComponent(req.params.partNumber);
    const part = await upsertPart({ ...req.body, part_number: partNumber });

    res.status(200).json({ success: true, data: part });
  } catch (err) {
    logger.error('Admin upsert part error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/admin/parts/bulk-import
// Admin — import from parsed XLSX rows
// ============================================================

export async function adminBulkImport(req: Request, res: Response): Promise<void> {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(422).json({ success: false, error: 'NO_DATA' });
      return;
    }
    const { imported, errors } = await bulkImportParts(rows);
    res.status(200).json({
      success: true,
      data: { imported, errors, total: rows.length },
    });
  } catch (err) {
    logger.error('Bulk import error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/parts/trending
// ============================================================

export async function adminTrending(req: Request, res: Response): Promise<void> {
  try {
    const days  = parseInt(req.query.days as string || '7');
    const limit = parseInt(req.query.limit as string || '20');
    const parts = await getTrendingParts(days, limit);
    res.status(200).json({ success: true, data: parts });
  } catch (err) {
    logger.error('Trending parts error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export default { search, batchSearch, adminList, adminUpsert, adminBulkImport, adminTrending };
