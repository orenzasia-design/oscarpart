// ============================================================
// rfq.routes.ts
// ============================================================
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUserRfqs, getAllRfqs, getRfqById } from '../controllers/rfq.controller';

const rfqRouter = Router();

rfqRouter.use(authenticate);
rfqRouter.get('/my', requireRole('approved'), getUserRfqs);
rfqRouter.get('/admin/all', requireRole('admin'), getAllRfqs);
rfqRouter.get('/:id', getRfqById);

export { rfqRouter };

// ============================================================
// leads.routes.ts
// ============================================================
import { Router as LeadRouter } from 'express';
import { list, getOne as getOneLead, update, stats } from '../controllers/leads.controller';
import { authenticate as authLead, requireRole as requireLead } from '../middleware/auth.middleware';

const leadsRouter = LeadRouter();
leadsRouter.use(authLead, requireLead('admin'));

leadsRouter.get('/',        list);
leadsRouter.get('/stats',   stats);
leadsRouter.get('/:id',     getOneLead);
leadsRouter.patch('/:id',   update);

export { leadsRouter };

// ============================================================
// analytics.routes.ts
// ============================================================
import { Router as AnalyticsRouter } from 'express';
import analyticsCtrl from '../controllers/analytics.controller';
import { authenticate as authAnalytics, requireRole as requireAnalytics } from '../middleware/auth.middleware';

const analyticsRouter = AnalyticsRouter();
analyticsRouter.use(authAnalytics, requireAnalytics('admin'));

analyticsRouter.get('/kpis',            analyticsCtrl.kpis);
analyticsRouter.get('/search-trends',   analyticsCtrl.searchTrends);
analyticsRouter.get('/parts-not-found', analyticsCtrl.partsNotFound);
analyticsRouter.get('/rfq-trends',      analyticsCtrl.rfqTrends);
analyticsRouter.get('/top-customers',   analyticsCtrl.topCustomers);
analyticsRouter.get('/pipeline',        analyticsCtrl.revenuePipeline);
analyticsRouter.get('/top-brands',      analyticsCtrl.topBrands);
analyticsRouter.get('/activity-feed',   analyticsCtrl.activityFeed);
analyticsRouter.get('/search-volume',   analyticsCtrl.searchVolume);

export { analyticsRouter };

// ============================================================
// pdf.routes.ts
// ============================================================
import { Router as PdfRouter } from 'express';
import { generateRfqPdf } from '../services/pdf.service';
import logger from '../config/logger';
import { authenticate as authPdf, requireRole as requirePdf } from '../middleware/auth.middleware';

const pdfRouter = PdfRouter();
pdfRouter.use(authPdf, requirePdf('admin'));

pdfRouter.get('/rfq/:rfqId', async (req, res) => {
  try {
    const buffer = await generateRfqPdf(req.params.rfqId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OSCARPART-${req.params.rfqId}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'RFQ_NOT_FOUND') { res.status(404).json({ success: false, error: msg }); return; }
    logger.error('PDF generate error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export { pdfRouter };

// ============================================================
// settings.routes.ts
// ============================================================
import { Router as SettingsRouter } from 'express';
import { query as dbQuery } from '../config/database';
import { authenticate as authSettings, requireRole as requireSettings } from '../middleware/auth.middleware';

const settingsRouter = SettingsRouter();
settingsRouter.use(authSettings, requireSettings('superadmin'));

settingsRouter.get('/', async (_req, res) => {
  const result = await dbQuery('SELECT key, value, value_type, description FROM settings ORDER BY key');
  res.json({ success: true, data: result.rows });
});

settingsRouter.patch('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await dbQuery(
      `UPDATE settings SET value = $1, updated_by = $2, updated_at = NOW() WHERE key = $3`,
      [value, req.user!.sub, req.params.key]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export { settingsRouter };

// ============================================================
// Patch RFQ status (admin)
// ============================================================
import { Router as StatusRouter } from 'express';
import { authenticate as authStatus, requireRole as requireStatus } from '../middleware/auth.middleware';

const rfqStatusRouter = StatusRouter();
rfqStatusRouter.use(authStatus, requireStatus('admin'));

rfqStatusRouter.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['submitted','processing','quoted','closed','cancelled'];
  if (!valid.includes(status)) {
    res.status(422).json({ success: false, error: 'INVALID_STATUS' });
    return;
  }
  try {
    const { query: statusQuery } = await import('../config/database');
    await statusQuery(
      `UPDATE rfq_sessions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

export { rfqStatusRouter };