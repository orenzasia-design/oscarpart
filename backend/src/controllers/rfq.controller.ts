import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

// Get RFQ for current user (customer)
export const getUserRfqs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    }

    const result = await query(
      `SELECT id, session_number, created_at, status, notes 
       FROM rfg_sessions 
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

// Get all RFQ for admin
export const getAllRfqs = async (req: Request, res: Response) => {
  try {
    // Optional: check if user is admin/superadmin
    const userRole = (req as any).user?.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }

    const result = await query(
      `SELECT s.id, s.session_number, s.created_at, s.status, s.notes, 
              u.email, u.full_name, u.company_name
       FROM rfg_sessions s
       LEFT JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('Error in getAllRfqs:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
};

// Get single RFQ details (including items)
export const getRfqById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.sub;
    const userRole = (req as any).user?.role;

    // Get session
    const sessionResult = await query(
      `SELECT * FROM rfg_sessions WHERE id = $1`,
      [id]
    );
    if (sessionResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'RFQ_NOT_FOUND' });
    }

    const session = sessionResult.rows[0];

    // Check authorization: user can see only their own, admin can see all
    if (userRole !== 'admin' && userRole !== 'superadmin' && session.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }

    // Get items
    const itemsResult = await query(
      `SELECT * FROM rfg_items WHERE session_id = $1`,
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