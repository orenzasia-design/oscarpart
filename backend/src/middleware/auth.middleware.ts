import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../services/auth.service';
import { cacheGet } from '../config/redis';
import logger from '../config/logger';

// ============================================================
// Extend Express Request with user context
// ============================================================

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ============================================================
// Role hierarchy
// ============================================================

const ROLE_LEVELS: Record<string, number> = {
  public:     0,
  registered: 1,
  approved:   2,
  admin:      3,
  superadmin: 4,
};

// ============================================================
// authenticate — verifies JWT, attaches req.user
// ============================================================

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Token autentikasi tidak ditemukan.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Check if account is active (status check — roles can be revoked)
    if (payload.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Akun Anda telah disuspend. Hubungi admin.',
      });
      return;
    }

    req.user = payload;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes('expired')) {
      res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Sesi telah berakhir. Silakan login kembali.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Token tidak valid.',
    });
  }
}

// ============================================================
// optionalAuth — attaches req.user if token present, doesn't fail
// Used for endpoints that work for both public and authenticated users
// ============================================================

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = req.headers.authorization!.split(' ')[1];
    req.user = verifyAccessToken(token);
  } catch {
    // Silently ignore invalid token for optional auth
  }
  next();
}

// ============================================================
// requireRole — RBAC guard
// Usage: requireRole('approved') — allows approved, admin, superadmin
//        requireRole('admin')    — allows admin, superadmin
//        requireRole('superadmin') — only superadmin
// ============================================================

export function requireRole(minimumRole: keyof typeof ROLE_LEVELS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Login diperlukan.',
      });
      return;
    }

    const userLevel = ROLE_LEVELS[req.user.role] ?? -1;
    const requiredLevel = ROLE_LEVELS[minimumRole];

    if (userLevel < requiredLevel) {
      logger.warn('Access denied', {
        userId:       req.user.sub,
        userRole:     req.user.role,
        requiredRole: minimumRole,
        path:         req.path,
        ip:           req.ip,
      });

      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Akses tidak diizinkan untuk role Anda.',
      });
      return;
    }

    // Also check account is approved for role 'approved' and above
    if (requiredLevel >= ROLE_LEVELS['approved'] && req.user.status !== 'approved') {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_NOT_APPROVED',
        message: 'Akun Anda belum disetujui. Silakan tunggu konfirmasi dari admin.',
      });
      return;
    }

    next();
  };
}

// ============================================================
// requireSelf — user can only access their own resource
// unless they are admin/superadmin
// ============================================================

export function requireSelf(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const resourceId = req.params[paramName];
    const isAdmin = ROLE_LEVELS[req.user.role] >= ROLE_LEVELS['admin'];

    if (!isAdmin && req.user.sub !== resourceId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Anda hanya dapat mengakses data milik sendiri.',
      });
      return;
    }

    next();
  };
}

export default { authenticate, optionalAuth, requireRole, requireSelf };
