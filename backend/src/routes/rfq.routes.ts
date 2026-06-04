import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById, createRFQ, createLoggedInRFQ, updateDraftItems, submitDraftRFQ } from '../controllers/rfq.controller';

const rfqRouter = Router();

// POST create RFQ (public, tanpa login)
rfqRouter.post('/', createRFQ);

// POST create RFQ draft (customer login)
rfqRouter.post('/draft', authenticate, requireRole('approved'), createLoggedInRFQ);

// POST update items di draft
rfqRouter.post('/:id/items', authenticate, requireRole('approved'), updateDraftItems);

// POST submit draft jadi RFQ final
rfqRouter.post('/:id/submit', authenticate, requireRole('approved'), submitDraftRFQ);

// GET my RFQs
rfqRouter.get('/my', authenticate, requireRole('approved'), getUserRfqs);

// GET all RFQs (admin only)
rfqRouter.get('/admin/all', authenticate, requireRole('admin'), getAllRfqs);

// GET RFQ by ID
rfqRouter.get('/:id', authenticate, getRfqById);

export { rfqRouter };
