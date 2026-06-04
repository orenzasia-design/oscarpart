import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, withTransaction } from '../config/database';
import { cacheSet, cacheDelete, cacheGet } from '../config/redis';
import logger from '../config/logger';

// ============================================================
// Types
// ============================================================

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'public' | 'registered' | 'approved' | 'admin' | 'superadmin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  company_name: string | null;
  business_type: string | null;
  contact_person: string | null;
  position: string | null;
  mobile_number: string | null;
  whatsapp_number: string | null;
  project_location: string | null;
  industry: string | null;
  website: string | null;
  approved_at: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  company_name: string;
  business_type: string;
  contact_person: string;
  position: string;
  mobile_number: string;
  whatsapp_number: string;
  project_location: string;
  industry: string;
  website?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: string;
  status: string;
  iat?: number;
  exp?: number;
}

// ============================================================
// Constants
// ============================================================

const BCRYPT_ROUNDS    = parseInt(process.env.BCRYPT_ROUNDS || '12');
// 🔧 TEMPORARY HARDCODE - Hapus setelah environment variable beres
const HARDCODED_ACCESS_SECRET  = 'tempHardcodeAccessSecret123!@#';
const HARDCODED_REFRESH_SECRET = 'tempHardcodeRefreshSecret456$%^';
const getAccessSecret  = () => process.env.JWT_SECRET || HARDCODED_ACCESS_SECRET;
const getRefreshSecret = () => process.env.JWT_SECRET || HARDCODED_REFRESH_SECRET;
// ============================================================

const ACCESS_EXPIRY    = process.env.JWT_ACCESS_EXPIRY  || '24h';
const REFRESH_EXPIRY   = process.env.JWT_REFRESH_EXPIRY || '30d';
const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

const TOKEN_BLACKLIST_PREFIX = 'blacklist:';
const USER_CACHE_PREFIX      = 'user:';
const USER_CACHE_TTL         = 300; // 5 minutes

// ============================================================
// Password Utilities
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8)          errors.push('Minimal 8 karakter');
  if (!/[A-Z]/.test(password))      errors.push('Minimal 1 huruf kapital');
  if (!/[a-z]/.test(password))      errors.push('Minimal 1 huruf kecil');
  if (!/[0-9]/.test(password))      errors.push('Minimal 1 angka');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Minimal 1 karakter khusus (!@#$% dll)');
  return { valid: errors.length === 0, errors };
}

// ============================================================
// JWT Token Utilities
// ============================================================

export function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    sub:    user.id,
    email:  user.email,
    role:   user.role,
    status: user.status,
  };
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRY,
    issuer:    'oscarpart-api',
    audience:  'oscarpart-client',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret(), {
    issuer:   'oscarpart-api',
    audience: 'oscarpart-client',
  }) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================
// Auth Service Methods
// ============================================================

export async function registerUser(
  input: RegisterInput
): Promise<{ user: User; message: string }> {
  // Check email uniqueness
  const existing = await query(
    'SELECT id FROM users WHERE email = $1',
    [input.email.toLowerCase()]
  );
  if (existing.rowCount > 0) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);

  const result = await query<User>(
    `INSERT INTO users (
      email, password_hash, full_name,
      company_name, business_type, contact_person, position,
      mobile_number, whatsapp_number, project_location, industry, website,
      role, status
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      'registered', 'pending'
    )
    RETURNING
      id, email, full_name, role, status,
      company_name, business_type, contact_person, position,
      mobile_number, whatsapp_number, project_location, industry, website,
      created_at`,
    [
      input.email.toLowerCase(),
      passwordHash,
      input.full_name,
      input.company_name,
      input.business_type,
      input.contact_person,
      input.position,
      input.mobile_number,
      input.whatsapp_number,
      input.project_location,
      input.industry,
      input.website || null,
    ]
  );

  const user = result.rows[0];

  // Log activity
  await logActivity(user.id, 'user_register', 'users', user.id, {
    email: user.email,
    company: user.company_name,
  });

  return {
    user,
    message: 'Registrasi berhasil. Akun Anda sedang dalam proses review oleh tim OSCARPART.',
  };
}

export async function loginUser(
  email: string,
  password: string,
  ip: string,
  userAgent: string
): Promise<{ user: User; tokens: TokenPair }> {
  // Get user with password hash
  const result = await query<User & { password_hash: string }>(
    `SELECT
      id, email, password_hash, full_name, role, status,
      company_name, business_type, contact_person, position,
      mobile_number, whatsapp_number, project_location, industry, website,
      approved_at, created_at, last_login_at
    FROM users
    WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (result.rowCount === 0) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const userRow = result.rows[0];

  // Verify password
  const passwordValid = await verifyPassword(password, userRow.password_hash);
  if (!passwordValid) {
    await logActivity(null, 'login_failed', 'users', userRow.id, {
      email, ip, reason: 'invalid_password',
    });
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check account status
  if (userRow.status === 'suspended') throw new Error('ACCOUNT_SUSPENDED');
  if (userRow.status === 'rejected')  throw new Error('ACCOUNT_REJECTED');

  // Generate tokens
  const tokens = await createTokenPair(userRow as unknown as User, ip, userAgent);

  // Update last login
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [userRow.id]
  );

  // Log activity
  await logActivity(userRow.id, 'login', 'users', userRow.id, { ip });

  // Return without password hash
  const { password_hash: _, ...user } = userRow;

  return { user: user as unknown as User, tokens };
}

export async function refreshTokens(
  refreshToken: string,
  ip: string,
  userAgent: string
): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);

  const result = await query<{
    id: string;
    user_id: string;
    expires_at: string;
    revoked: boolean;
  }>(
    `SELECT id, user_id, expires_at, revoked
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );

  if (result.rowCount === 0) throw new Error('INVALID_REFRESH_TOKEN');

  const tokenRow = result.rows[0];

  if (tokenRow.revoked) throw new Error('TOKEN_REVOKED');
  if (new Date(tokenRow.expires_at) < new Date()) throw new Error('TOKEN_EXPIRED');

  // Get user
  const userResult = await query<User>(
    `SELECT id, email, full_name, role, status,
            company_name, contact_person, position,
            mobile_number, whatsapp_number, project_location,
            industry, website, approved_at, created_at, last_login_at,
            business_type
     FROM users WHERE id = $1`,
    [tokenRow.user_id]
  );

  if (userResult.rowCount === 0) throw new Error('USER_NOT_FOUND');

  const user = userResult.rows[0];
  if (user.status === 'suspended') throw new Error('ACCOUNT_SUSPENDED');

  // Rotate: revoke old token, issue new pair
  await query(
    'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE id = $1',
    [tokenRow.id]
  );

  return createTokenPair(user, ip, userAgent);
}

export async function logoutUser(
  userId: string,
  refreshToken?: string
): Promise<void> {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await query(
      'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );
  } else {
    // Revoke ALL refresh tokens for this user
    await query(
      'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE user_id = $1 AND revoked = FALSE',
      [userId]
    );
  }

  // Invalidate user cache
  await cacheDelete(`${USER_CACHE_PREFIX}${userId}`);

  await logActivity(userId, 'logout', 'users', userId, {});
}

// ============================================================
// User Approval (Admin)
// ============================================================

export async function approveUser(
  userId: string,
  adminId: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users
     SET status = 'approved', role = 'approved', approved_by = $2, approved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, email, full_name, role, status, company_name, contact_person, approved_at`,
    [userId, adminId]
  );

  if (result.rowCount === 0) {
    throw new Error('USER_NOT_FOUND_OR_NOT_PENDING');
  }

  await cacheDelete(`${USER_CACHE_PREFIX}${userId}`);
  await logActivity(adminId, 'user_approve', 'users', userId, { approved_by: adminId });

  return result.rows[0];
}

export async function rejectUser(
  userId: string,
  adminId: string,
  reason: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users
     SET status = 'rejected', approved_by = $2, rejection_reason = $3, updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, email, full_name, role, status, company_name`,
    [userId, adminId, reason]
  );

  if (result.rowCount === 0) {
    throw new Error('USER_NOT_FOUND_OR_NOT_PENDING');
  }

  await cacheDelete(`${USER_CACHE_PREFIX}${userId}`);
  await logActivity(adminId, 'user_reject', 'users', userId, { reason });

  return result.rows[0];
}

// ============================================================
// Internal helpers
// ============================================================

async function createTokenPair(
  user: User,
  ip: string,
  userAgent: string
): Promise<TokenPair> {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const tokenHash    = hashToken(refreshToken);
  const expiresAt    = new Date(Date.now() + REFRESH_EXPIRY_MS);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, tokenHash, expiresAt.toISOString(), ip, userAgent]
  );

  // Clean up old expired tokens for this user (housekeeping)
  query(
    `DELETE FROM refresh_tokens
     WHERE user_id = $1 AND (expires_at < NOW() OR revoked = TRUE)
       AND created_at < NOW() - INTERVAL '60 days'`,
    [user.id]
  ).catch(() => {}); // fire-and-forget

  const decoded = jwt.decode(accessToken) as { exp?: number };
  const expiresIn = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;

  return { accessToken, refreshToken, expiresIn };
}

async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, JSON.stringify(metadata)]
    );
  } catch (err) {
    logger.error('Failed to write audit log', { action, err });
  }
}

export default {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  approveUser,
  rejectUser,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateAccessToken,
  verifyAccessToken,
};
