import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById, createRFQ } from '../controllers/rfq.controller';

const rfqRouter = Router();

// POST create RFQ (customer yang login & role approved)
rfqRouter.post('/', authenticate, requireRole('approved'), createRFQ);

// GET my RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), getUserRfqs);

// GET all RFQs (admin only)
rfqRouter.get('/admin/all', authenticate, requireRole('admin'), getAllRfqs);

// GET RFQ by ID (customer own or admin)
rfqRouter.get('/:id', authenticate, getRfqById);

export { rfqRouter };