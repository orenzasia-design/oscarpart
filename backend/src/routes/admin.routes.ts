import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  validateApproval,
  validateRejection,
  handleValidationErrors,
} from '../middleware/validation.middleware';
import {
  listUsers,
  getPendingCount,
  getUserById,
  approve,
  reject,
  updateRole,
  suspendUser,
} from '../controllers/admin-users.controller';
import { body, param } from 'express-validator';
import { getAllRfqs, getRfqById } from '../controllers/rfq.controller';
const router = Router();

// All admin routes require authentication + minimum 'admin' role
router.use(authenticate, requireRole('admin'));

// ── User Management ──────────────────────────────────────────

// GET  /api/v1/admin/users
router.get('/users', listUsers);

// GET  /api/v1/admin/users/pending-count
router.get('/users/pending-count', getPendingCount);

// GET  /api/v1/admin/users/:id
router.get('/users/:id', validateApproval, handleValidationErrors, getUserById);

// PATCH /api/v1/admin/users/:id/approve
router.patch(
  '/users/:id/approve',
  validateApproval,
  handleValidationErrors,
  approve
);

// PATCH /api/v1/admin/users/:id/reject
router.patch(
  '/users/:id/reject',
  validateRejection,
  handleValidationErrors,
  reject
);

// PATCH /api/v1/admin/users/:id/role
router.patch(
  '/users/:id/role',
  [
    param('id').isUUID(),
    body('role').isIn(['registered', 'approved', 'admin']).withMessage('Role tidak valid.'),
    handleValidationErrors,
  ],
  updateRole
);

// PATCH /api/v1/admin/users/:id/suspend
router.patch(
  '/users/:id/suspend',
  validateApproval,
  handleValidationErrors,
  suspendUser
);
// ── RFQ Management ───────────────────────────────────────────
router.get('/rfq', getAllRfqs);
router.get('/rfq/:id', getRfqById);
export default router;
