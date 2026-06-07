import { Request, Response } from 'express';
import { query } from '../config/database';
import { approveUser, rejectUser } from '../services/auth.service';
import {
  notifyAdminNewRegistration,
  notifyUserApproved,
  notifyUserRejected,
} from '../services/notification.service';
import logger from '../config/logger';

// ============================================================
// GET /api/v1/admin/users
// Query params: status, role, page, limit, search
// ============================================================

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const page   = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20')));
    const offset = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const role   = req.query.role   as string | undefined;
    const search = req.query.search as string | undefined;

    const conditions: string[] = [];
    const params: unknown[]    = [];
    let   paramIdx             = 1;

    if (status) {
      conditions.push(`u.status = $${paramIdx++}`);
      params.push(status);
    }
    if (role) {
      conditions.push(`u.role = $${paramIdx++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(
        `(u.email ILIKE $${paramIdx} OR u.full_name ILIKE $${paramIdx} OR u.company_name ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users u ${where}`,
      params as string[]
    );

    const usersResult = await query(
      `SELECT
        u.id, u.email, u.full_name, u.role, u.status,
        u.company_name, u.business_type, u.contact_person, u.position,
        u.mobile_number, u.whatsapp_number, u.project_location, u.industry, u.website,
        u.approved_at, u.rejection_reason, u.created_at, u.last_login_at,
        a.full_name AS approved_by_name,
        (SELECT COUNT(*) FROM rfq_sessions WHERE user_id = u.id AND status != 'draft')::int AS rfq_count
       FROM users u
       LEFT JOIN users a ON a.id = u.approved_by
       ${where}
       ORDER BY
         CASE u.status
           WHEN 'pending'  THEN 1
           WHEN 'approved' THEN 2
           WHEN 'rejected' THEN 3
           ELSE 4
         END,
         u.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset] as string[]
    );

    const total = parseInt(countResult.rows[0].count);

    // Summary breakdown by status (always fetched without status filter)
    const summaryResult = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM users GROUP BY status`
    );
    const summary: Record<string, number> = {};
    summaryResult.rows.forEach((r) => { summary[r.status] = parseInt(r.count); });

    res.status(200).json({
      success: true,
      data: {
        users:      usersResult.rows,
        summary,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext:    page * limit < total,
          hasPrev:    page > 1,
        },
      },
    });
  } catch (err) {
    logger.error('List users error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/users/pending-count
// Quick count for dashboard badge
// ============================================================

export async function getPendingCount(req: Request, res: Response): Promise<void> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE status = 'pending'`
    );
    res.status(200).json({
      success: true,
      data:    { pending: parseInt(result.rows[0].count) },
    });
  } catch (err) {
    logger.error('Pending count error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/admin/users/:id
// ============================================================

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT
        u.id, u.email, u.full_name, u.role, u.status,
        u.company_name, u.business_type, u.contact_person, u.position,
        u.mobile_number, u.whatsapp_number, u.project_location, u.industry, u.website,
        u.approved_at, u.rejection_reason, u.created_at, u.last_login_at,
        a.full_name AS approved_by_name,
        (SELECT COUNT(*) FROM rfq_sessions WHERE user_id = u.id AND status != 'draft') AS rfq_count
       FROM users u
       LEFT JOIN users a ON a.id = u.approved_by
       WHERE u.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    logger.error('Get user error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/admin/users/:id/approve
// ============================================================

export async function approve(req: Request, res: Response): Promise<void> {
  try {
    const user = await approveUser(req.params.id, req.user!.sub);

    // Send approval email (fire-and-forget — never block the response)
    notifyUserApproved({
      id:           user.id,
      email:        user.email,
      full_name:    user.full_name,
      company_name: user.company_name,
    }).catch((err: Error) => logger.error('Approval email failed:', err));

    // Add to activity feed
    await query(
      `INSERT INTO activity_feed (actor_user_id, action_type, description, metadata)
       VALUES ($1, 'user_approve', $2, $3)`,
      [
        req.user!.sub,
        `Akun ${user.company_name || user.full_name} telah disetujui`,
        JSON.stringify({ userId: user.id, company: user.company_name }),
      ]
    );

    res.status(200).json({
      success: true,
      message: `Akun ${user.full_name} berhasil disetujui.`,
      data:    user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'USER_NOT_FOUND_OR_NOT_PENDING') {
      res.status(404).json({
        success: false,
        error:   'USER_NOT_FOUND_OR_NOT_PENDING',
        message: 'User tidak ditemukan atau bukan dalam status pending.',
      });
      return;
    }
    logger.error('Approve user error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/admin/users/:id/reject
// ============================================================

export async function reject(req: Request, res: Response): Promise<void> {
  try {
    const { reason } = req.body;
    const user = await rejectUser(req.params.id, req.user!.sub, reason);

    // Send rejection email (fire-and-forget)
    notifyUserRejected({
      id:               user.id,
      email:            user.email,
      full_name:        user.full_name,
      rejection_reason: reason,
    }).catch((err: Error) => logger.error('Rejection email failed:', err));

    // Add to activity feed
    await query(
      `INSERT INTO activity_feed (actor_user_id, action_type, description, metadata)
       VALUES ($1, 'user_reject', $2, $3)`,
      [
        req.user!.sub,
        `Pendaftaran ${user.company_name || user.full_name} ditolak`,
        JSON.stringify({ userId: user.id, reason }),
      ]
    );

    res.status(200).json({
      success: true,
      message: `Pendaftaran ${user.full_name} telah ditolak.`,
      data:    user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === 'USER_NOT_FOUND_OR_NOT_PENDING') {
      res.status(404).json({
        success: false,
        error:   'USER_NOT_FOUND_OR_NOT_PENDING',
        message: 'User tidak ditemukan atau bukan dalam status pending.',
      });
      return;
    }
    logger.error('Reject user error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/admin/users/:id/role
// ============================================================

export async function updateRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body;
    const validRoles = ['registered', 'approved', 'admin'];

    // Superadmin cannot be assigned via API
    if (!validRoles.includes(role)) {
      res.status(422).json({
        success: false,
        error:   'INVALID_ROLE',
        message: `Role harus salah satu dari: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Prevent downgrading other superadmins
    const targetUser = await query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [req.params.id]
    );
    if (targetUser.rows[0]?.role === 'superadmin') {
      res.status(403).json({
        success: false,
        error:   'CANNOT_MODIFY_SUPERADMIN',
        message: 'Role superadmin tidak dapat diubah.',
      });
      return;
    }

    await query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, req.params.id]
    );

    res.status(200).json({ success: true, message: 'Role berhasil diperbarui.' });
  } catch (err) {
    logger.error('Update role error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// PATCH /api/v1/admin/users/:id/suspend
// ============================================================

export async function suspendUser(req: Request, res: Response): Promise<void> {
  try {
    // Prevent self-suspension
    if (req.params.id === req.user!.sub) {
      res.status(400).json({ success: false, error: 'CANNOT_SUSPEND_SELF' });
      return;
    }

    const target = await query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [req.params.id]
    );

    if (!target.rows[0]) {
      res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
      return;
    }

    if (target.rows[0].role === 'superadmin') {
      res.status(403).json({ success: false, error: 'CANNOT_SUSPEND_SUPERADMIN' });
      return;
    }

    await query(
      `UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // Revoke all refresh tokens
    await query(
      `UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW()
       WHERE user_id = $1 AND revoked = FALSE`,
      [req.params.id]
    );

    res.status(200).json({ success: true, message: 'Akun berhasil disuspend.' });
  } catch (err) {
    logger.error('Suspend user error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export default { listUsers, getPendingCount, getUserById, approve, reject, updateRole, suspendUser };

