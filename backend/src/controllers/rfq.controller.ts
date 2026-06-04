import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById, createRFQ, createLoggedInRFQ } from '../controllers/rfq.controller';

const rfqRouter = Router();

// POST create RFQ (public, tanpa login)
rfqRouter.post('/', createRFQ);

// POST create RFQ (customer yang sudah login)
rfqRouter.post('/draft', authenticate, requireRole('approved'), createLoggedInRFQ);

// GET my RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), getUserRfqs);

// GET all RFQs (admin only)
rfqRouter.get('/admin/all', authenticate, requireRole('admin'), getAllRfqs);

// GET RFQ by ID (customer own or admin)
rfqRouter.get('/:id', authenticate, getRfqById);

export { rfqRouter };
