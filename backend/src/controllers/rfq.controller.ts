/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import { sendRFQConfirmationEmail } from '../utils/email.service';

async function sendWhatsAppNotification(rfqNumber: string, customerName: string, customerPhone: string, itemCount: number): Promise<void> {
  const token = process.env.FONNTE_TOKEN;
  const adminNumber = process.env.FONNTE_ADMIN_NUMBER;
  if (!token || !adminNumber) {
    logger.warn('Fonnte credentials not set, skipping WhatsApp notification');
    return;
  }
  const message = `🔔 *RFQ BARU MASUK*\n\n*Nomor RFQ:* ${rfqNumber}\n*Customer:* ${customerName}\n*No. HP:* ${customerPhone}\n*Jumlah Item:* ${itemCount} item\n\nSegera cek admin panel:\nhttps://oscarpart.vercel.app/admin/rfq`;
  const formData = new URLSearchParams();
  formData.append('target', adminNumber);
  formData.append('message', message);
  formData.append('countryCode', '62');
  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token },
    body: formData,
  });
  const result = await response.json() as any;
  logger.info(`WhatsApp notification sent: ${JSON.stringify(result)}`);
}

export const getUserRfqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
    const result = await query(
      `SELECT s.id, s.rfq_number, s.created_at, s.submitted_at, s.status, s.notes,
              s.project_name, s.contact_person, s.grand_total, s.subtotal, s.tax_amount,
              (SELECT COUNT(*) FROM rfq_items i WHERE i.rfq_session_id = s.id)::int AS item_count
       FROM rfq_sessions s
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId] as any[]
    );
    res.json({ success: true, data: { rfqs: result.rows } });
  } catch (error) {
    logger.error('Error in getUserRfqs:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const getAllRfqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role as string | undefined;
    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      res.status(403).json({ success: false, error: 'FORBIDDEN' }); return;
    }
    const result = await query(
      `SELECT s.id, s.rfq_number, s.created_at, s.status, s.notes,
              s.contact_person, s.project_name,
              s.subtotal, s.tax_amount, s.grand_total,
              (SELECT COUNT(*) FROM rfq_items i WHERE i.rfq_session_id = s.id) AS item_count,
              u.email, u.full_name, u.company_name
       FROM rfq_sessions s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error in getAllRfqs:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const getRfqById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub as string | undefined;
    const userRole = (req as any).user?.role as string | undefined;
    const sessionResult = await query(
      `SELECT * FROM rfq_sessions WHERE id = $1`,
      [id] as any[]
    );
    if (!sessionResult.rows.length) {
      res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' }); return;
    }
    const session = sessionResult.rows[0] as any;
    if (userRole !== 'admin' && userRole !== 'superadmin' && session.user_id !== userId) {
      res.status(403).json({ success: false, error: 'FORBIDDEN' }); return;
    }
    const itemsResult = await query(
      `SELECT * FROM rfq_items WHERE rfq_session_id = $1`,
      [id] as any[]
    );
    res.json({ success: true, data: { session, items: itemsResult.rows } });
  } catch (error) {
    logger.error('Error in getRfqById:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const createRFQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customer_name, customer_email, customer_phone, notes, items } = req.body;
    if (!customer_name || !customer_email || !customer_phone) {
      res.status(400).json({ success: false, error: 'CUSTOMER_INFO_REQUIRED' }); return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' }); return;
    }
    const rfqNumber = `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sessionResult = await query(
      `INSERT INTO rfq_sessions (rfq_number, user_id, notes, status, created_at, updated_at)
       VALUES ($1, NULL, $2, 'submitted', NOW(), NOW())
       RETURNING id, rfq_number, created_at`,
      [rfqNumber, notes ?? ''] as any[]
    );
    const session = sessionResult.rows[0] as any;
    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (rfq_session_id, part_number, qty_requested, description, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [session.id, String(item.part_number ?? ''), Number(item.qty_requested ?? 1), String(item.description ?? ''), 0] as any[]
      );
    }
    try {
      const partList = (items as any[]).map((item: any) => ({
        partNumber: String(item.part_number ?? ''),
        description: String(item.description ?? '-'),
        quantity: Number(item.qty_requested ?? 1),
      }));
      await sendRFQConfirmationEmail(String(customer_email), String(customer_name), String(session.rfq_number), partList);
      logger.info(`Email sent for RFQ ${session.rfq_number}`);
    } catch (emailErr) {
      logger.error(`Email failed: ${emailErr}`);
    }
    try {
      await sendWhatsAppNotification(String(session.rfq_number), String(customer_name), String(customer_phone), (items as any[]).length);
      logger.info(`WhatsApp sent for RFQ ${session.rfq_number}`);
    } catch (waErr) {
      logger.error(`WhatsApp failed: ${waErr}`);
    }
    res.status(201).json({
      success: true,
      data: { sessionId: session.id, rfq_number: session.rfq_number, createdAt: session.created_at },
    });
  } catch (error) {
    logger.error('Error in createRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const createLoggedInRFQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
    const userResult = await query(`SELECT full_name, email, whatsapp_number FROM users WHERE id = $1`, [userId] as any[]);
    if (!userResult.rows.length) { res.status(404).json({ success: false, error: 'USER_NOT_FOUND' }); return; }
    const user = userResult.rows[0] as any;
    const { notes, items } = req.body;
    // items is optional on draft creation — can be added later via /rfq/:id/items
    const rfqNumber = `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sessionResult = await query(
      `INSERT INTO rfq_sessions (rfq_number, user_id, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', NOW(), NOW())
       RETURNING id, rfq_number, created_at`,
      [rfqNumber, userId, notes ?? ''] as any[]
    );
    const session = sessionResult.rows[0] as any;
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO rfq_items (rfq_session_id, part_number, qty_requested, description, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [session.id, String(item.part_number ?? ''), Number(item.qty_requested ?? 1), String(item.description ?? ''), 0] as any[]
        );
      }
    }
    res.status(201).json({
      success: true,
      data: { id: session.id, rfq_number: session.rfq_number, createdAt: session.created_at },
    });
  } catch (error) {
    logger.error('Error in createLoggedInRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const updateDraftItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' }); return;
    }
    await query(`DELETE FROM rfq_items WHERE rfq_session_id = $1`, [id] as any[]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const pn = String(item.part_number ?? '');
      // Lookup price from parts table if not provided
      let unitPrice = item.unit_price_at_time ?? null;
      if (!unitPrice) {
        const partRow = await query(`SELECT unit_price FROM parts WHERE part_number = $1 LIMIT 1`, [pn] as any[]);
        if (partRow.rows.length) unitPrice = partRow.rows[0].unit_price ?? null;
      }
      const qty = Number(item.qty_requested ?? 1);
      const lineTotal = unitPrice ? unitPrice * qty : null;
      await query(
        `INSERT INTO rfq_items (rfq_session_id, part_number, qty_requested, description, unit_price_at_time, line_total, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, pn, qty, String(item.description ?? ''), unitPrice, lineTotal, i] as any[]
      );
    }
    // Update session subtotal/tax/grand_total
    await query(
      `UPDATE rfq_sessions SET
        subtotal   = (SELECT COALESCE(SUM(line_total), 0) FROM rfq_items WHERE rfq_session_id = $1),
        tax_amount = (SELECT COALESCE(SUM(line_total), 0) FROM rfq_items WHERE rfq_session_id = $1) * 0.11,
        grand_total= (SELECT COALESCE(SUM(line_total), 0) FROM rfq_items WHERE rfq_session_id = $1) * 1.11,
        updated_at = NOW()
       WHERE id = $1`,
      [id] as any[]
    );
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
    const sessionResult = await query(
      `SELECT * FROM rfq_sessions WHERE id = $1 AND user_id = $2`,
      [id, userId] as any[]
    );
    if (!sessionResult.rows.length) { res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' }); return; }
    const session = sessionResult.rows[0] as any;
    if (session.status === 'submitted') { res.status(400).json({ success: false, error: 'RFQ_ALREADY_SUBMITTED' }); return; }
    const userResult = await query(`SELECT full_name, email, whatsapp_number FROM users WHERE id = $1`, [userId] as any[]);
    const user = userResult.rows[0] as any;
    const itemsResult = await query(`SELECT * FROM rfq_items WHERE rfq_session_id = $1`, [id] as any[]);
    const items = itemsResult.rows;
    await query(`UPDATE rfq_sessions SET status = 'submitted', updated_at = NOW() WHERE id = $1`, [id] as any[]);
    try {
      const partList = items.map((item: any) => ({
        partNumber: String(item.part_number ?? ''),
        description: String(item.description ?? '-'),
        quantity: Number(item.qty_requested ?? 1),
      }));
      await sendRFQConfirmationEmail(String(user.email), String(user.full_name), String(session.rfq_number), partList);
    } catch (emailErr) { logger.error(`Email failed: ${emailErr}`); }
    try {
      await sendWhatsAppNotification(String(session.rfq_number), String(user.full_name), String(user.whatsapp_number ?? '-'), items.length);
    } catch (waErr) { logger.error(`WhatsApp failed: ${waErr}`); }
    const itemList = items.map((i: any) => `- ${i.part_number} (qty: ${i.qty_requested})`).join('\n');
    const waMessage = encodeURIComponent(`Halo OSCARPART, saya ingin konfirmasi RFQ:\n\nNo. RFQ: ${session.rfq_number}\n\nDaftar Part:\n${itemList}\n\nMohon diproses. Terima kasih.`);
    const whatsappUrl = `https://wa.me/6288802032033?text=${waMessage}`;
    res.json({ success: true, data: { rfq: { rfq_number: session.rfq_number }, whatsapp_url: whatsappUrl } });
  } catch (error) {
    logger.error('Error in submitDraftRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

/**
 * POST /api/v1/rfq/from-pm-bundle
 * Create RFQ draft langsung dari PM Bundle items
 * Body: { bundle_id, unit_id?, project_name?, notes? }
 */
export const createRfqFromPmBundle = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }

    const { bundle_id, unit_id, project_name, notes } = req.body;
    if (!bundle_id) { res.status(400).json({ success: false, error: 'bundle_id required' }); return; }

    // Get bundle info
    const bundleResult = await query(
      `SELECT pb.*, COUNT(bi.id) as item_count
       FROM pm_bundles pb
       LEFT JOIN pm_bundle_items bi ON bi.bundle_id = pb.id AND bi.part_number IS NOT NULL
       WHERE pb.id = $1
       GROUP BY pb.id`,
      [bundle_id] as any[]
    );
    if (!bundleResult.rows.length) {
      res.status(404).json({ success: false, error: 'PM Bundle not found' }); return;
    }
    const bundle = bundleResult.rows[0] as any;

    // Get bundle items with part numbers only
    const itemsResult = await query(
      `SELECT * FROM pm_bundle_items WHERE bundle_id = $1 AND part_number IS NOT NULL ORDER BY item_no`,
      [bundle_id] as any[]
    );
    if (!itemsResult.rows.length) {
      res.status(400).json({ success: false, error: 'No items with part numbers in this bundle' }); return;
    }

    // Get unit info if provided
    let unitInfo: any = null;
    if (unit_id) {
      const ur = await query(`SELECT * FROM units WHERE id = $1 AND user_id = $2`, [unit_id, userId] as any[]);
      if (ur.rows.length) unitInfo = ur.rows[0];
    }

    // Get user info
    const userResult = await query(`SELECT full_name, company_name, phone FROM users WHERE id = $1`, [userId] as any[]);
    const user = userResult.rows[0] as any;

    // Generate RFQ number
    const rfqNumber = \`RFQ-PM-\${Date.now().toString(36).toUpperCase()}\`;

    // Create RFQ session (draft)
    const autoProjectName = project_name
      || (unitInfo ? \`PM \${bundle.interval_hm.toLocaleString()} HM — \${unitInfo.unit_name}\` : \`PM \${bundle.interval_hm.toLocaleString()} HM — \${bundle.unit_model}\`);

    const sessionResult = await query(
      `INSERT INTO rfq_sessions
         (user_id, rfq_number, status, contact_person, project_name, notes)
       VALUES ($1, $2, 'draft', $3, $4, $5)
       RETURNING id, rfq_number`,
      [userId, rfqNumber, user?.full_name ?? '', autoProjectName,
       notes ?? \`Auto-generated dari PM Bundle: \${bundle.bundle_name}\`] as any[]
    );
    const session = sessionResult.rows[0] as any;

    // Insert items
    const items = itemsResult.rows as any[];
    for (const item of items) {
      await query(
        `INSERT INTO rfq_items
           (rfq_session_id, part_number, description, qty, unit, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [session.id, item.part_number, item.component_name,
         item.qty ?? 1, item.unit ?? 'pcs', item.spec ?? null] as any[]
      );
    }

    logger.info(\`RFQ \${rfqNumber} created from PM Bundle \${bundle_id} by user \${userId} — \${items.length} items\`);

    res.json({
      success: true,
      data: {
        rfq_id:     session.id,
        rfq_number: session.rfq_number,
        item_count: items.length,
        bundle_name: bundle.bundle_name,
        unit_model:  bundle.unit_model,
        interval_hm: bundle.interval_hm,
      }
    });
  } catch (error) {
    logger.error('Error in createRfqFromPmBundle:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

