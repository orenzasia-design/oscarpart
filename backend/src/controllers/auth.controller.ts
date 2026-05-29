import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
} from '../services/auth.service';
import { notifyAdminNewRegistration } from '../services/notification.service';
import logger from '../config/logger';

// ============================================================
// POST /api/v1/auth/register
// ============================================================

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { user, message } = await registerUser(req.body);

    // Notify admin of new registration (fire-and-forget)
    notifyAdminNewRegistration({
      id:           user.id,
      full_name:    user.full_name,
      email:        user.email,
      company_name: user.company_name,
      position:     user.position,
      industry:     user.industry,
      created_at:   user.created_at,
    }).catch((err: Error) => logger.error('Admin registration notify failed:', err));

    res.status(201).json({
      success: true,
      message,
      data: {
        id:           user.id,
        email:        user.email,
        full_name:    user.full_name,
        status:       user.status,
        company_name: user.company_name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'EMAIL_EXISTS') {
      res.status(409).json({
        success: false,
        error:   'EMAIL_EXISTS',
        message: 'Email sudah terdaftar. Gunakan email lain atau login.',
      });
      return;
    }

    logger.error('Register error:', err);
    res.status(500).json({
      success: false,
      error:   'INTERNAL_ERROR',
      message: 'Terjadi kesalahan. Silakan coba lagi.',
    });
  }
}

// ============================================================
// POST /api/v1/auth/login
// ============================================================

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const ip        = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    const { user, tokens } = await loginUser(email, password, ip, userAgent);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
      path:     '/api/v1/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        user: {
          id:           user.id,
          email:        user.email,
          full_name:    user.full_name,
          role:         user.role,
          status:       user.status,
          company_name: user.company_name,
          last_login_at: user.last_login_at,
        },
        accessToken: tokens.accessToken,
        expiresIn:   tokens.expiresIn,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    const errorMap: Record<string, { status: number; code: string; msg: string }> = {
      INVALID_CREDENTIALS: { status: 401, code: 'INVALID_CREDENTIALS', msg: 'Email atau password tidak valid.' },
      ACCOUNT_SUSPENDED:   { status: 403, code: 'ACCOUNT_SUSPENDED',   msg: 'Akun Anda telah disuspend.' },
      ACCOUNT_REJECTED:    { status: 403, code: 'ACCOUNT_REJECTED',    msg: 'Akun Anda ditolak. Hubungi admin untuk informasi lebih lanjut.' },
    };

    const mapped = errorMap[message];
    if (mapped) {
      res.status(mapped.status).json({
        success: false,
        error:   mapped.code,
        message: mapped.msg,
      });
      return;
    }

    logger.error('Login error:', err);
    res.status(500).json({
      success: false,
      error:   'INTERNAL_ERROR',
      message: 'Terjadi kesalahan. Silakan coba lagi.',
    });
  }
}

// ============================================================
// POST /api/v1/auth/refresh
// ============================================================

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // Refresh token from HTTP-only cookie OR request body (for mobile clients)
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error:   'NO_REFRESH_TOKEN',
        message: 'Refresh token tidak ditemukan. Silakan login kembali.',
      });
      return;
    }

    const ip        = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    const tokens = await refreshTokens(refreshToken, ip, userAgent);

    // Rotate cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   30 * 24 * 60 * 60 * 1000,
      path:     '/api/v1/auth',
    });

    res.status(200).json({
      success:     true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn:   tokens.expiresIn,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    const errorMap: Record<string, string> = {
      INVALID_REFRESH_TOKEN: 'Token tidak valid. Silakan login kembali.',
      TOKEN_REVOKED:         'Sesi telah berakhir. Silakan login kembali.',
      TOKEN_EXPIRED:         'Sesi telah berakhir. Silakan login kembali.',
      USER_NOT_FOUND:        'Akun tidak ditemukan.',
      ACCOUNT_SUSPENDED:     'Akun Anda telah disuspend.',
    };

    const msg = errorMap[message];
    if (msg) {
      res.clearCookie('refreshToken', { path: '/api/v1/auth' });
      res.status(401).json({
        success: false,
        error:   message,
        message: msg,
      });
      return;
    }

    logger.error('Refresh token error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// POST /api/v1/auth/logout
// ============================================================

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    await logoutUser(userId, refreshToken);

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });

    res.status(200).json({
      success: true,
      message: 'Logout berhasil.',
    });
  } catch (err) {
    logger.error('Logout error:', err);
    // Always succeed on logout — clear cookie regardless
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ success: true, message: 'Logout berhasil.' });
  }
}

// ============================================================
// GET /api/v1/auth/me
// ============================================================

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const { query: dbQuery } = await import('../config/database');
    const result = await dbQuery(
      `SELECT
        id, email, full_name, role, status,
        company_name, business_type, contact_person, position,
        mobile_number, whatsapp_number, project_location, industry, website,
        approved_at, created_at, last_login_at
       FROM users WHERE id = $1`,
      [req.user!.sub]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
      return;
    }

    res.status(200).json({
      success: true,
      data:    result.rows[0],
    });
  } catch (err) {
    logger.error('Get me error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export default { register, login, refresh, logout, getMe };
