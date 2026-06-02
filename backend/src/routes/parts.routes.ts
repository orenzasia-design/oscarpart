import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.middleware';
import { searchRateLimitPublic, searchRateLimitAuth } from '../middleware/rate-limit.middleware';
import { validatePartSearch, handleValidationErrors } from '../middleware/validation.middleware';
import {
  search,
  batchSearch,
  adminList,
  adminUpsert,
  adminBulkImport,
  adminTrending,
} from '../controllers/parts.controller';
import { db } from '../config/database';
import logger from '../config/logger';

const router = Router();

// ── Public / Tiered Search ────────────────────────────────────
router.get(
  '/search',
  (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      optionalAuth(req, res, () => searchRateLimitAuth(req, res, next));
    } else {
      searchRateLimitPublic(req, res, next);
    }
  },
  optionalAuth,
  validatePartSearch,
  handleValidationErrors,
  search
);

// POST /api/v1/parts/batch-lookup (approved+ only)
router.post('/batch-lookup', authenticate, requireRole('approved'), batchSearch);

// ── Admin Parts Management ────────────────────────────────────
router.get('/admin/list', authenticate, requireRole('admin'), adminList);
router.get('/admin/trending', authenticate, requireRole('admin'), adminTrending);
router.put('/admin/:partNumber', authenticate, requireRole('admin'), adminUpsert);
router.post('/admin/bulk-import', authenticate, requireRole('admin'), adminBulkImport);

// ── PUBLIC: SANY Ready Stock untuk Homepage ───────────────────
// GET /api/v1/parts/sany-ready-stock
// Menampilkan 30 part SANY dengan stock > 0, urut harga tertinggi
router.get('/sany-ready-stock', async (req, res) => {
  try {
    // Kolom sebenarnya: brand_name (bukan brand), unit_price (bukan price)
    const query = `
      SELECT 
        part_number, 
        brand_name as brand, 
        unit_type, 
        description, 
        stock_quantity, 
        unit_price as price
      FROM parts
      WHERE brand_name = 'SANY' AND stock_quantity > 0
      ORDER BY unit_price DESC
      LIMIT 30
    `;
    const result = await db.query(query);
    logger.info(`SANY ready stock: ${result.rows.length} parts found`);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    logger.error('Error in /sany-ready-stock:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching SANY ready stock' });
  }
});

export default router;