import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById, createRFQ, createLoggedInRFQ } from '../controllers/rfq.controller';

const rfqRouter = Router();

// POST create RFQ (public, tanpa login)
rfqRouter.post('/', createRFQ);

// POST create RFQ (customer yang sudah login)
rfqRouter.post('/draft', authenticate, requireRole('approved'), createLoggedInRFQ);

// GET my RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), getUserRfqs);

// GET all RFQs (admin only)
rfqRouter.get('/admin/all', authenticate, requireRole('admin'), getAllRfqs);

// GET RFQ by ID (customer own or admin)
rfqRouter.get('/:id', authenticate, getRfqById);

export { rfqRouter };
export const createLoggedInRFQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return;
    }

    // Ambil data user dari database
    const userResult = await query(
      `SELECT full_name, email, whatsapp_number FROM users WHERE id = $1`,
      [userId] as any[]
    );
    if (!userResult.rows.length) {
      res.status(404).json({ success: false, error: 'USER_NOT_FOUND' }); return;
    }
    const user = userResult.rows[0] as any;

    const { notes, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' }); return;
    }

    const rfqNumber = `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const sessionResult = await query(
      `INSERT INTO rfq_sessions (rfq_number, user_id, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'submitted', NOW(), NOW())
       RETURNING id, rfq_number, created_at`,
      [rfqNumber, userId, notes ?? ''] as any[]
    );
    const session = sessionResult.rows[0] as any;

    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (rfq_session_id, part_number, qty_requested, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.id, String(item.part_number ?? ''), Number(item.qty_requested ?? 1), String(item.description ?? ''), 0] as any[]
      );
    }

    // Kirim email konfirmasi
    try {
      const partList = (items as any[]).map((item: any) => ({
        partNumber: String(item.part_number ?? ''),
        description: String(item.description ?? '-'),
        quantity: Number(item.qty_requested ?? 1),
      }));
      await sendRFQConfirmationEmail(
        String(user.email),
        String(user.full_name),
        String(session.rfq_number),
        partList
      );
      logger.info(`Email sent for RFQ ${session.rfq_number}`);
    } catch (emailErr) {
      logger.error(`Email failed: ${emailErr}`);
    }

    // Kirim WhatsApp notif ke admin
    try {
      await sendWhatsAppNotification(
        String(session.rfq_number),
        String(user.full_name),
        String(user.whatsapp_number ?? '-'),
        (items as any[]).length
      );
      logger.info(`WhatsApp sent for RFQ ${session.rfq_number}`);
    } catch (waErr) {
      logger.error(`WhatsApp failed: ${waErr}`);
    }

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        rfq_number: session.rfq_number,
        createdAt: session.created_at,
      },
    });
  } catch (error) {
    logger.error('Error in createLoggedInRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};
