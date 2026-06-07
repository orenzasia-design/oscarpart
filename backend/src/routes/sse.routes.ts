/**
 * SSE Routes — GET /api/v1/events
 * Authenticated endpoint; streams real-time events to connected clients.
 *
 * NOTE: Browser EventSource does not support custom headers.
 * Token is passed as a query param ?token=<accessToken> and injected
 * into Authorization header before hitting the authenticate middleware.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate }                              from '../middleware/auth.middleware';
import { registerClient, unregisterClient }          from '../services/sse.service';
import logger from '../config/logger';

const router = Router();

/** Shim: read ?token query param → Authorization header (SSE workaround) */
function tokenFromQuery(req: Request, _res: Response, next: NextFunction): void {
  const token = req.query.token as string | undefined;
  if (token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

router.get('/', tokenFromQuery, authenticate, (req: Request, res: Response) => {
  const user = req.user as { id?: string; sub?: string; role: string };
  const userId = user?.id ?? user?.sub;

  if (!userId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
    return;
  }

  const clientId = registerClient(userId, user.role, res);

  // On client disconnect (browser tab close, network drop, etc.)
  req.on('close', () => {
    unregisterClient(clientId);
  });

  // Keep request open — do NOT call res.end() here
});

export default router;
