import { Router } from 'express';
import { getMonthlyReport, getReportSummary } from '../controllers/monthly-report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/summary', getReportSummary);   // GET /api/v1/monthly-report/summary
router.get('/',        getMonthlyReport);   // GET /api/v1/monthly-report?month=2026-06

export default router;
