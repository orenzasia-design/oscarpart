import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById } from '../controllers/rfq.controller';

const router = express.Router();

// Semua endpoint RFQ memerlukan autentikasi
router.use(authenticate);

// Customer: lihat RFQ sendiri
router.get('/', getUserRfqs);

// Admin: lihat semua RFQ
router.get('/admin/all', getAllRfqs);

// Detail RFQ (by id)
router.get('/:id', getRfqById);

export default router;