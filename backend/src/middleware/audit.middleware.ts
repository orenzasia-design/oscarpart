import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

// Actions to always audit (regardless of method)
const AUDITED_PATHS: { pattern: RegExp; action: string }[] = [
  { pattern: /^\/api\/v1\/auth\/login$/,          action: 'login_attempt' },
  { pattern: /^\/api\/v1\/auth\/logout$/,         action: 'logout' },
  { pattern: /^\/api\/v1\/auth\/register$/,       action: 'register_attempt' },
  { pattern: /^\/api\/v1\/admin\/users\/.+\/approve$/, action: 'user_approve' },
  { pattern: /^\/api\/v1\/admin\/users\/.+\/reject$/,  action: 'user_reject' },
  { pattern: /^\/api\/v1\/rfq\/submit$/,          action: 'rfq_submit' },
  { pattern: /^\/api\/v1\/parts\/search/,         action: 'part_search' },
  { pattern: /^\/api\/v1\/admin\//,               action: 'admin_action' },
];

function matchAction(path: string): string | null {
  for (const rule of AUDITED_PATHS) {
    if (rule.pattern.test(path)) return rule.action;
  }
  return null;
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const action = matchAction(req.path);
  if (!action) {
    next();
    return;
  }

  // Capture response status after it's sent
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const result = originalJson(body);

    // Fire-and-forget audit log write
    setImmediate(async () => {
      try {
        const metadata: Record<string, unknown> = {
          method:     req.method,
          path:       req.path,
          statusCode: res.statusCode,
          success:    res.statusCode < 400,
        };

        // Attach safe request params (never log passwords)
        if (req.body && typeof req.body === 'object') {
          const safeBody: Record<string, unknown> = { ...req.body };
          delete safeBody.password;
          delete safeBody.password_confirm;
          delete safeBody.current_password;
          delete safeBody.new_password;
          if (Object.keys(safeBody).length > 0) {
            metadata.request_body = safeBody;
          }
        }

        if (req.query && Object.keys(req.query).length > 0) {
          metadata.query_params = req.query;
        }

        await query(
          `INSERT INTO audit_log (user_id, action, entity_type, ip_address, user_agent, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user?.sub || null,
            action,
            'api',
            req.ip || null,
            req.headers['user-agent'] || null,
            JSON.stringify(metadata),
          ]
        );
      } catch (err) {
        logger.error('Audit middleware write failed', { err });
      }
    });

    return result;
  };

  next();
}

export default auditMiddleware;
