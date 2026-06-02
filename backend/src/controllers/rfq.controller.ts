import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import { sendRFQConfirmationEmail } from '../utils/email.service';

export const getUserRfqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
    const result = await query(
      `SELECT id, session_number, created_at, status, notes FROM rfq_sessions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
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
      `SELECT s.id, s.session_number, s.created_at, s.status, s.notes, u.email, u.full_name, u.company_name FROM rfq_sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`
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
    const sessionResult = await query(`SELECT * FROM rfq_sessions WHERE id = $1`, [id]);
    if (!sessionResult.rows.length) {
      res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' }); return;
    }
    const session = sessionResult.rows[0];
    if (userRole !== 'admin' && userRole !== 'superadmin' && session.user_id !== userId) {
      res.status(403).json({ success: false, error: 'FORBIDDEN' }); return;
    }
    const itemsResult = await query(`SELECT * FROM rfq_items WHERE session_id = $1`, [id]);
    res.json({ success: true, data: { session, items: itemsResult.rows } });
  } catch (error) {
    logger.error('Error in getRfqById:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

export const createRFQ = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) { res.status(401).json({ success: false, error: 'UNAUTHORIZED' }); return; }
    const { notes, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' }); return;
    }
    const sessionNumber = `RFQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sessionResult = await query(
      `INSERT INTO rfq_sessions (session_number, user_id, notes, status, created_at, updated_at) VALUES ($1, $2, $3, 'submitted', NOW(), NOW()) RETURNING id, session_number, created_at`,
      [sessionNumber, userId, notes ?? '']
    );
    const session = sessionResult.rows[0];
    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (session_id, part_number, quantity, description) VALUES ($1, $2, $3, $4)`,
        [session.id, String(item.partNumber ?? ''), Number(item.quantity ?? 1), String(item.description ?? '')]
      );
    }
    const userResult = await query(`SELECT email, full_name FROM users WHERE id = $1`, [userId]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      const partList = (items as any[]).map((item) => ({
        partNumber: String(item.partNumber ?? ''),
        description: String(item.description ?? '-'),
        quantity: Number(item.quantity ?? 1),
      }));
      try {
        await sendRFQConfirmationEmail(
          String(user.email ?? ''),
          String(user.full_name ?? 'Customer'),
          String(session.session_number ?? ''),
          partList
        );
        logger.info(`Email sent for RFQ ${session.session_number}`);
      } catch (emailErr) {
        logger.error(`Email failed: ${emailErr}`);
      }
    }
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        sessionNumber: session.session_number,
        createdAt: session.created_at,
      },
    });
  } catch (error) {
    logger.error('Error in createRFQ:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};
