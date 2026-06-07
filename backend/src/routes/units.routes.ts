import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getMyUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getUnitModels,
  recordPmDone,
  getUnitAnalytics,
} from '../controllers/units.controller';
import {
  exportCustomerPdf,
  exportCustomerExcel,
} from '../controllers/export.controller';

const unitsRouter = Router();

// GET daftar model preset (tidak perlu login)
unitsRouter.get('/models', getUnitModels);

// Semua route di bawah wajib login (min: approved)
unitsRouter.use(authenticate, requireRole('approved'));

// GET semua unit milik user yang sedang login
unitsRouter.get('/my', getMyUnits);

// GET analytics PM & HM per unit
unitsRouter.get('/analytics', getUnitAnalytics);

// GET export PDF/Excel laporan PM (customer)
unitsRouter.get('/export/pdf', exportCustomerPdf);
unitsRouter.get('/export/excel', exportCustomerExcel);

// POST daftarkan unit baru
unitsRouter.post('/', createUnit);

// PATCH update data unit (termasuk HM)
unitsRouter.patch('/:id', updateUnit);

// PATCH catat PM selesai
unitsRouter.patch('/:id/pm', recordPmDone);

// DELETE hapus unit (soft delete)
unitsRouter.delete('/:id', deleteUnit);

export { unitsRouter };
