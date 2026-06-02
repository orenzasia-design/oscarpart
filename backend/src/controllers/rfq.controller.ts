import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import { sendRFQConfirmationEmail } from '../utils/email.service';

// ============================================================
// GET /api/v1/rfq/my - Ambil RFQ milik customer yang login
// ============================================================
export const getUserRfqs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    }

    const result = await query(
      `SELECT id, session_number, created_at, status, notes 
       FROM rfq_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error in getUserRfqs:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

// ============================================================
// GET /api/v1/rfq/admin/all - Ambil semua RFQ (admin only)
// ============================================================
export const getAllRfqs = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }

    const result = await query(
      `SELECT s.id, s.session_number, s.created_at, s.status, s.notes, 
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

// ============================================================
// GET /api/v1/rfq/:id - Ambil detail RFQ (termasuk items)
// ============================================================
export const getRfqById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub;
    const userRole = (req as any).user?.role;

    const sessionResult = await query(
      `SELECT * FROM rfq_sessions WHERE id = $1`,
      [id]
    );
    if (sessionResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' });
    }

    const session = sessionResult.rows[0];

    if (userRole !== 'admin' && userRole !== 'superadmin' && session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }

    const itemsResult = await query(
      `SELECT * FROM rfq_items WHERE session_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        session,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    logger.error('Error in getRfqById:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

// ============================================================
// POST /api/v1/rfq - Membuat RFQ baru (customer login, role approved)
// ============================================================
export const createRFQ = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    }

    const { notes, items } = req.body;

    // Validasi items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' });
    }

    // Generate nomor session unik (contoh: RFQ-20260602-001)
    const sessionNumber = `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert ke tabel rfq_sessions
    const sessionResult = await query(
      `INSERT INTO rfq_sessions (session_number, user_id, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'submitted', NOW(), NOW())
       RETURNING id, session_number, created_at`,
      [sessionNumber, userId, notes || '']
    );

    const session = sessionResult.rows[0];

    // Insert items ke rfq_items
    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (session_id, part_number, quantity, description)
         VALUES ($1, $2, $3, $4)`,
        [session.id, item.partNumber, item.quantity, item.description || '']
      );
    }

    // Ambil data user untuk keperluan email
    const userResult = await query(
      `SELECT email, full_name FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      logger.warn(`User ${userId} not found for email notification`);
    } else {
      const user = userResult.rows[0];
      const partList = items.map((item: any) => ({
        partNumber: item.partNumber,
        description: item.description || '-',
        quantity: item.quantity
      }));

      // Kirim email konfirmasi (jangan blok response jika gagal)
      try {
        await sendRFQConfirmationEmail(
          user.email,
          user.full_name || 'Customer',
          session.session_number,
          partList
        );
        logger.info(`Email sent for RFQ ${session.session_number} to ${user.email}`);
      } catch (emailErr) {
        logger.error(`Failed to send email for RFQ ${session.session_number}:`, emailErr);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        sessionNumber: session.session_number,
        createdAt: session.created_at
      }
    });
  } catch (error) {
    logger.error('Error in createRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};