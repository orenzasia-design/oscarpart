/**
 * SSE Routes — GET /api/v1/events
 * Authenticated endpoint; streams real-time events to connected clients.
 */
import { Router, Request, Response } from 'express';
import { authenticate }              from '../middleware/auth.middleware';
import { registerClient, unregisterClient } from '../services/sse.service';
import logger from '../config/logger';

const router = Router();

router.get('/', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as { id: string; role: string };
  if (!user?.id) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    return;
  }

  const clientId = registerClient(user.id, user.role, res);

  // On client disconnect
  req.on('close', () => {
    unregisterClient(clientId);
  });

  // Keep request open — do NOT call res.end() here
});

export default router;
