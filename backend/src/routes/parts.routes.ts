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

const router = Router();

// ── Public / Tiered Search ────────────────────────────────────

// GET /api/v1/parts/search?q=
// Rate limit differs: public=30/min, authenticated=60/min
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

// POST /api/v1/parts/batch-lookup (approved+ only — RFQ engine)
router.post('/batch-lookup', authenticate, requireRole('approved'), batchSearch);

// ── Admin Parts Management ────────────────────────────────────

// GET /api/v1/parts/admin/list
router.get(
  '/admin/list',
  authenticate,
  requireRole('admin'),
  adminList
);

// GET /api/v1/parts/admin/trending
router.get(
  '/admin/trending',
  authenticate,
  requireRole('admin'),
  adminTrending
);

// PUT /api/v1/parts/admin/:partNumber
router.put(
  '/admin/:partNumber',
  authenticate,
  requireRole('admin'),
  adminUpsert
);

// POST /api/v1/parts/admin/bulk-import
router.post(
  '/admin/bulk-import',
  authenticate,
  requireRole('admin'),
  adminBulkImport
);
// GET /api/v1/parts/sany-ready-stock
router.get('/sany-ready-stock', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT part_number, brand, unit_type, description, stock_quantity, price
      FROM "Part"
      WHERE brand = 'SANY' AND stock_quantity > 0
      ORDER BY price DESC
      LIMIT 30
    `;
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;
