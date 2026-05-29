import { Router } from 'express';
import { register, login, refresh, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  validateRegister,
  validateLogin,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import {
  loginRateLimit,
  registerRateLimit,
  refreshRateLimit,
} from '../middleware/rate-limit.middleware';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  registerRateLimit,
  validateRegister,
  handleValidationErrors,
  register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  loginRateLimit,
  validateLogin,
  handleValidationErrors,
  login
);

// POST /api/v1/auth/refresh
router.post('/refresh', refreshRateLimit, refresh);

// POST /api/v1/auth/logout  (requires valid access token)
router.post('/logout', authenticate, logout);

// GET /api/v1/auth/me  (requires valid access token)
router.get('/me', authenticate, getMe);

export default router;
