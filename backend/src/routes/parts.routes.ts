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
import { db } from '../config/database'; // ✅ import database connection
import logger from '../config/logger';   // ✅ untuk logging

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

// ── PUBLIC: SANY Ready Stock untuk Homepage ───────────────────
// GET /api/v1/parts/sany-ready-stock
// Menampilkan 30 part SANY dengan stock > 0, urut harga tertinggi
// DEBUG: cek struktur tabel parts
router.get('/debug-table', async (req, res) => {
  try {
    // Cek apakah tabel parts ada
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'parts'
      );
    `);
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return res.json({ success: false, message: 'Tabel parts tidak ditemukan' });
    }
    
    // Ambil daftar kolom
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parts'
      ORDER BY ordinal_position;
    `);
    
    // Ambil 1 sample data
    const sample = await db.query(`SELECT * FROM parts LIMIT 1`);
    
    res.json({
      success: true,
      tableExists,
      columns: columns.rows,
      sampleData: sample.rows[0] || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});
router.get('/sany-ready-stock', async (req, res) => {
  try {
    // Gunakan tabel 'parts' (lowercase) sesuai dengan yang ada di database
    // Kolom: part_number, brand, unit_type, description, stock_quantity, price
    const query = `
      SELECT part_number, brand, unit_type, description, stock_quantity, price
      FROM parts
      WHERE brand = 'SANY' AND stock_quantity > 0
      ORDER BY price DESC
      LIMIT 30
    `;
    
    const result = await db.query(query);
    
    // Log success (optional, untuk monitoring)
    logger.info(`SANY ready stock endpoint called - returned ${result.rows.length} parts`);
    
    res.json({ 
      success: true, 
      data: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    logger.error('Error in /sany-ready-stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching SANY ready stock' 
    });
  }
});

export default router;