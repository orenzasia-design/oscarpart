/**
 * Admin routes untuk PM Reminder
 * GET  /api/v1/admin/pm-reminders/logs   — lihat log reminder terakhir
 * POST /api/v1/admin/pm-reminders/run    — trigger manual (testing)
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { runPmReminders } from '../services/pm-reminder.service';
import { query } from '../config/database';
import logger from '../config/logger';

const router = Router();
router.use(authenticate, requireRole('admin'));

// GET /logs — lihat 50 log terakhir
router.get('/logs', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT prl.*, u.unit_name, u.model, pb.bundle_name, pb.interval_hm
      FROM pm_reminder_logs prl
      LEFT JOIN units u ON u.id = prl.unit_id
      LEFT JOIN pm_bundles pb ON pb.id = prl.bundle_id
      ORDER BY prl.sent_at DESC
      LIMIT 50
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('pm-reminder logs error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// POST /run — trigger manual
router.post('/run', async (req: Request, res: Response) => {
  const threshold = parseInt((req.body?.threshold_hm as string) ?? '50');
  logger.info(`Admin triggered PM reminder run (threshold: ${threshold} HM)`);
  const result = await runPmReminders(threshold);
  res.json({ success: true, data: result });
});

export default router;
