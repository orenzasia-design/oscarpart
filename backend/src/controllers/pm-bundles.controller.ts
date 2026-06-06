import { Request, Response } from 'express';
import { db } from '../config/database';

// GET /api/v1/pm-bundles/models
export const getPmModels = async (_req: Request, res: Response) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT unit_model FROM pm_bundles WHERE is_active = true ORDER BY unit_model`
    );
    res.json({ success: true, data: result.rows.map((r: any) => r.unit_model) });
  } catch (error) {
    console.error('getPmModels error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/pm-bundles?unit_model=SKT90S
export const getPmBundles = async (req: Request, res: Response) => {
  try {
    const { unit_model } = req.query;
    let query = `
      SELECT b.id, b.unit_model, b.interval_hm, b.bundle_name, b.description, b.is_active,
             COUNT(i.id)::int AS total_items
      FROM pm_bundles b
      LEFT JOIN pm_bundle_items i ON i.bundle_id = b.id
      WHERE b.is_active = true
    `;
    const params: any[] = [];
    if (unit_model) { params.push(unit_model); query += ` AND b.unit_model = $${params.length}`; }
    query += ` GROUP BY b.id ORDER BY b.unit_model, b.interval_hm`;
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getPmBundles error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /api/v1/pm-bundles/:id
export const getPmBundleDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bundleResult = await db.query(
      `SELECT * FROM pm_bundles WHERE id =  AND is_active = true`, [id]
    );
    if (bundleResult.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Bundle not found' });
    const itemsResult = await db.query(
      `SELECT * FROM pm_bundle_items WHERE bundle_id =  ORDER BY item_no`, [id]
    );
    res.json({ success: true, data: { bundle: bundleResult.rows[0], items: itemsResult.rows } });
  } catch (error) {
    console.error('getPmBundleDetail error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
