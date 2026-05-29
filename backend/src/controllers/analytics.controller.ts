import { Request, Response } from 'express';
import {
  getDashboardKpis,
  getSearchTrends,
  getPartsNotFound,
  getRfqTrends,
  getTopCustomers,
  getRevenuePipeline,
  getTopBrands,
  getActivityFeed,
  getSearchVolumeChart,
} from '../services/analytics.service';
import logger from '../config/logger';

const handler = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await fn(req, res);
      if (!res.headersSent) {
        res.status(200).json({ success: true, data });
      }
    } catch (err) {
      logger.error('Analytics error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
      }
    }
  };

export const kpis            = handler(() => getDashboardKpis());
export const searchTrends    = handler((req) => getSearchTrends(parseInt(req.query.days as string || '30')));
export const partsNotFound   = handler((req) => getPartsNotFound(parseInt(req.query.days as string || '30')));
export const rfqTrends       = handler((req) => getRfqTrends((req.query.period as 'daily'|'weekly'|'monthly') || 'daily'));
export const topCustomers    = handler((req) => getTopCustomers(parseInt(req.query.limit as string || '10')));
export const revenuePipeline = handler(() => getRevenuePipeline());
export const topBrands       = handler(() => getTopBrands());
export const activityFeed    = handler((req) => getActivityFeed(parseInt(req.query.limit as string || '50')));
export const searchVolume    = handler(() => getSearchVolumeChart());

export default { kpis, searchTrends, partsNotFound, rfqTrends, topCustomers, revenuePipeline, topBrands, activityFeed, searchVolume };
