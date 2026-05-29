import { Request, Response } from 'express';
import { listLeads, getLeadById, updateLead, getLeadStats } from '../services/lead.service';
import logger from '../config/logger';

export async function list(req: Request, res: Response): Promise<void> {
  try {
    const page       = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit      = Math.min(100, parseInt(req.query.limit as string || '20'));
    const status     = req.query.status     as string;
    const source     = req.query.source     as string;
    const assignedTo = req.query.assigned_to as string;
    const search     = req.query.search     as string;
    const dateFrom   = req.query.date_from  as string;
    const dateTo     = req.query.date_to    as string;

    const { leads, total } = await listLeads({ page, limit, status, source, assignedTo, search, dateFrom, dateTo });

    res.status(200).json({
      success: true,
      data: {
        leads,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (err) {
    logger.error('List leads error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export async function getOne(req: Request, res: Response): Promise<void> {
  try {
    const lead = await getLeadById(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'LEAD_NOT_FOUND' });
      return;
    }
    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    logger.error('Get lead error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const lead = await updateLead(req.params.id, req.user!.sub, req.body);
    res.status(200).json({ success: true, data: lead });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'LEAD_NOT_FOUND') { res.status(404).json({ success: false, error: msg }); return; }
    if (msg === 'NO_UPDATES')     { res.status(422).json({ success: false, error: msg }); return; }
    logger.error('Update lead error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export async function stats(req: Request, res: Response): Promise<void> {
  try {
    const data = await getLeadStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('Lead stats error:', err);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

export default { list, getOne, update, stats };
