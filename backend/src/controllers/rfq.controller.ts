import { Request, Response } from 'express';
import multer from 'multer';
import {
  createDraftRfq,
  resolveRfqItems,
  submitRfq,
  getRfqById,
  adminListRfqs,
} from '../services/rfq.service';
import { parseRfqFile, generateRfqTemplate } from '../services/rfq-parser.service';
import { buildWhatsAppUrl, notifyAdminNewRfq } from '../services/notification.service';
import logger from '../config/logger';
import { query } from '../config/database';

// In-memory multer storage (files processed in-memory, not saved to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     'application/vnd.ms-excel', 'text/csv',
                     'application/csv', 'application/octet-stream'];
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(file.mimetype) || ['xlsx','xls','csv'].includes(ext || '')) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

// ============================================================
// POST /api/v1/rfq/draft
// Create empty draft RFQ
// ============================================================

export async function createDraft(req: Request, res: Response): Promise<void> {
  try {
    const userId       = req.user?.sub || null;
    const sessionToken = req.headers['x-session-id'] as string || null;
    const draft = await createDraftRfq(userId, sessionToken);

    res.status(201).json({ success: true, data: draft });
  } catch (err) {
    logger.error('Create draft error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/rfq/:id/items
// Add/replace items in RFQ
// ============================================================

export async function updateItems(req: Request, res: Response): Promise<void> {
  try {
    const { items } = req.body;
    const role = req.user?.role || 'approved';

    if (!Array.isArray(items) || items.length === 0) {
      res.status(422).json({ success: false, error: 'NO_ITEMS', message: 'Minimal 1 item diperlukan.' });
      return;
    }

    if (items.length > 500) {
      res.status(422).json({ success: false, error: 'TOO_MANY_ITEMS', message: 'Maksimal 500 item.' });
      return;
    }

    const resolved = await resolveRfqItems(req.params.id, items, role);

    const matched   = resolved.filter((i) => i.match_status === 'matched').length;
    const unmatched = resolved.filter((i) => i.match_status === 'unmatched').length;

    res.status(200).json({
      success: true,
      data: {
        items:    resolved,
        matched,
        unmatched,
        total:    resolved.length,
      },
    });
  } catch (err) {
    logger.error('Update items error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/rfq/upload
// Upload XLSX/CSV, parse, create draft, resolve items
// ============================================================

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(422).json({ success: false, error: 'NO_FILE', message: 'File tidak ditemukan.' });
      return;
    }

    const ext = req.file.originalname.split('.').pop()?.toLowerCase() as 'xlsx' | 'xls' | 'csv';
    const parseResult = parseRfqFile(req.file.buffer, ext);

    if (parseResult.valid_rows === 0) {
      res.status(422).json({
        success: false,
        error:   'PARSE_FAILED',
        message: 'Tidak ada data valid yang bisa diproses.',
        errors:  parseResult.errors,
      });
      return;
    }

    // Create draft RFQ
    const userId       = req.user?.sub || null;
    const sessionToken = req.headers['x-session-id'] as string || null;
    const draft = await createDraftRfq(userId, sessionToken);

    // Resolve items against parts DB
    const role = req.user?.role || 'approved';
    const items = parseResult.rows.map((r) => ({
      part_number:   r.part_number,
      description:   r.description,
      brand:         r.brand,
      unit_type:     r.unit_type,
      qty_requested: r.qty_requested,
    }));

    const resolved = await resolveRfqItems(draft.id, items, role);

    // Log upload record
    await query(
      `INSERT INTO rfq_uploads
         (rfq_session_id, original_filename, file_type, file_size_bytes,
          rows_total, rows_matched, rows_unmatched, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')`,
      [
        draft.id,
        req.file.originalname,
        ext,
        req.file.size,
        parseResult.total_rows,
        resolved.filter((r) => r.match_status === 'matched').length,
        resolved.filter((r) => r.match_status === 'unmatched').length,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        rfq_id:     draft.id,
        rfq_number: draft.rfq_number,
        items:      resolved,
        parse: {
          total_rows:  parseResult.total_rows,
          valid_rows:  parseResult.valid_rows,
          matched:     resolved.filter((r) => r.match_status === 'matched').length,
          unmatched:   resolved.filter((r) => r.match_status === 'unmatched').length,
          errors:      parseResult.errors,
        },
      },
    });
  } catch (err) {
    logger.error('Upload file error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/rfq/:id/submit
// ============================================================

export async function submit(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.sub || null;
    const rfq = await submitRfq(req.params.id, req.body, userId);

    // Build WhatsApp URL for frontend redirect
    const whatsappUrl = buildWhatsAppUrl(rfq);

    // Notify admin of new RFQ (fire-and-forget)
    notifyAdminNewRfq(rfq).catch((err: Error) =>
      logger.error('Admin RFQ notify failed:', err)
    );

    res.status(200).json({
      success:      true,
      message:      'RFQ berhasil dikirim.',
      data: {
        rfq,
        whatsapp_url: whatsappUrl,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const errorMap: Record<string, { status: number; msg: string }> = {
      RFQ_NO_ITEMS:         { status: 422, msg: 'RFQ harus memiliki minimal 1 item.' },
      RFQ_NOT_FOUND:        { status: 404, msg: 'RFQ tidak ditemukan.' },
      RFQ_ALREADY_SUBMITTED:{ status: 409, msg: 'RFQ sudah pernah dikirim.' },
    };
    const mapped = errorMap[message];
    if (mapped) {
      res.status(mapped.status).json({ success: false, error: message, message: mapped.msg });
      return;
    }
    logger.error('Submit RFQ error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/rfq/:id
// ============================================================

export async function getOne(req: Request, res: Response): Promise<void> {
  try {
    const rfq = await getRfqById(req.params.id);

    // Ownership check for non-admins
    const role = req.user?.role;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isAdmin && rfq.user_id !== req.user?.sub) {
      res.status(403).json({ success: false, error: 'FORBIDDEN' });
      return;
    }

    res.status(200).json({ success: true, data: rfq });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'RFQ_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' });
      return;
    }
    logger.error('Get RFQ error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/rfq/template
// Download blank RFQ Excel template
// ============================================================

export async function downloadTemplate(_req: Request, res: Response): Promise<void> {
  try {
    const buffer = generateRfqTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="OSCARPART-RFQ-Template.xlsx"');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    logger.error('Template download error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/rfq/my-rfqs (customer history)
// ============================================================

export async function myRfqs(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const page   = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit as string || '10'));
    const offset = (page - 1) * limit;

    const [countRes, rfqsRes] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) FROM rfq_sessions WHERE user_id = $1 AND status != 'draft'`,
        [userId]
      ),
      query(
        `SELECT id, rfq_number, status, company_name, project_name,
                subtotal, tax_amount, grand_total,
                created_at, submitted_at,
                (SELECT COUNT(*) FROM rfq_items WHERE rfq_session_id = rfq_sessions.id) AS item_count
         FROM rfq_sessions
         WHERE user_id = $1 AND status != 'draft'
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
    ]);

    res.status(200).json({
      success: true,
      data: {
        rfqs:       rfqsRes.rows,
        pagination: {
          total:      parseInt(countRes.rows[0].count),
          page,
          limit,
        },
      },
    });
  } catch (err) {
    logger.error('My RFQs error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/rfq
// ============================================================

export async function adminList(req: Request, res: Response): Promise<void> {
  try {
    const page     = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit    = Math.min(100, parseInt(req.query.limit as string || '20'));
    const status   = req.query.status as string;
    const search   = req.query.search as string;
    const dateFrom = req.query.date_from as string;
    const dateTo   = req.query.date_to   as string;

    const { rfqs, total } = await adminListRfqs({ page, limit, status, search, dateFrom, dateTo });

    res.status(200).json({
      success: true,
      data: {
        rfqs,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    logger.error('Admin list RFQ error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export default {
  createDraft,
  updateItems,
  uploadFile,
  uploadMiddleware,
  submit,
  getOne,
  downloadTemplate,
  myRfqs,
  adminList,
};
