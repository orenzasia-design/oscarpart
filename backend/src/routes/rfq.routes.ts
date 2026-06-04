import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById, createRFQ, createLoggedInRFQ, updateDraftItems, submitDraftRFQ } from '../controllers/rfq.controller';

const rfqRouter = Router();

// POST create RFQ (public, tanpa login)
rfqRouter.post('/', createRFQ);

// POST create RFQ draft (customer login)
rfqRouter.post('/draft', authenticate, requireRole('approved'), createLoggedInRFQ);

// POST update items di draft
rfqRouter.post('/:id/items', authenticate, requireRole('approved'), updateDraftItems);

// POST submit draft jadi RFQ final
rfqRouter.post('/:id/submit', authenticate, requireRole('approved'), submitDraftRFQ);

// GET my RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), getUserRfqs);

// GET all RFQs (admin only)
rfqRouter.get('/admin/all', authenticate, requireRole('admin'), getAllRfqs);

// GET RFQ by ID
rfqRouter.get('/:id', authenticate, getRfqById);

export { rfqRouter };
export const updateDraftItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' }); return;
    }

    // Hapus items lama, ganti dengan yang baru
    await query(`DELETE FROM rfq_items WHERE rfq_session_id = $1`, [id] as any[]);

    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (rfq_session_id, part_number, qty_requested, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, String(item.part_number ?? ''), Number(item.qty_requested ?? 1), String(item.description ?? ''), 0] as any[]
      );
    }

    res.json({ success: true, message: 'Items updated' });
  } catch (error) {
    logger.error('Error in updateDraftItems:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const submitDraftRFQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub as string | undefined;

    // Ambil data session
    const sessionResult = await query(
      `SELECT * FROM rfq_sessions WHERE id = $1 AND user_id = $2`,
      [id, userId] as any[]
    );
    if (!sessionResult.rows.length) {
      res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' }); return;
    }
    const session = sessionResult.rows[0] as any;

    if (session.status === 'submitted') {
      res.status(400).json({ success: false, error: 'RFQ_ALREADY_SUBMITTED' }); return;
    }

    // Ambil data user
    const userResult = await query(
      `SELECT full_name, email, whatsapp_number FROM users WHERE id = $1`,
      [userId] as any[]
    );
    const user = userResult.rows[0] as any;

    // Ambil items
    const itemsResult = await query(
      `SELECT * FROM rfq_items WHERE rfq_session_id = $1`,
      [id] as any[]
    );
    const items = itemsResult.rows;

    // Update status jadi submitted
    await query(
      `UPDATE rfq_sessions SET status = 'submitted', updated_at = NOW() WHERE id = $1`,
      [id] as any[]
    );

    // Kirim email
    try {
      const partList = items.map((item: any) => ({
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
    } catch (emailErr) {
      logger.error(`Email failed: ${emailErr}`);
    }

    // Kirim WhatsApp notif ke admin
    try {
      await sendWhatsAppNotification(
        String(session.rfq_number),
        String(user.full_name),
        String(user.whatsapp_number ?? '-'),
        items.length
      );
    } catch (waErr) {
      logger.error(`WhatsApp failed: ${waErr}`);
    }

    // Buat WhatsApp URL untuk customer
    const itemList = items.map((i: any) => `- ${i.part_number} (qty: ${i.qty_requested})`).join('\n');
    const waMessage = encodeURIComponent(
      `Halo OSCARPART, saya ingin konfirmasi RFQ:\n\nNo. RFQ: ${session.rfq_number}\n\nDaftar Part:\n${itemList}\n\nMohon diproses. Terima kasih.`
    );
    const whatsappUrl = `https://wa.me/6288802032033?text=${waMessage}`;

    res.json({
      success: true,
      data: {
        rfq: { rfq_
