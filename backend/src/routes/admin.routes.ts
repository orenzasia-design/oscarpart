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
import { adminGetAllUnits } from '../controllers/units.controller';

const router = Router();

// All admin routes require authentication + minimum 'admin' role
router.use(authenticate, requireRole('admin'));

// -- User Management --
router.get('/users', listUsers);
router.get('/users/pending-count', getPendingCount);
router.get('/users/:id', validateApproval, handleValidationErrors, getUserById);
router.patch('/users/:id/approve', validateApproval, handleValidationErrors, approve);
router.patch('/users/:id/reject', validateRejection, handleValidationErrors, reject);
router.patch(
  '/users/:id/role',
  [
    param('id').isUUID(),
    body('role').isIn(['registered', 'approved', 'admin']).withMessage('Role tidak valid.'),
    handleValidationErrors,
  ],
  updateRole
);
router.patch('/users/:id/suspend', validateApproval, handleValidationErrors, suspendUser);

// -- RFQ Management --
router.get('/rfq', getAllRfqs);
router.get('/rfq/:id', getRfqById);

// -- PM Unit Monitor --
router.get('/units', adminGetAllUnits);

export default router;