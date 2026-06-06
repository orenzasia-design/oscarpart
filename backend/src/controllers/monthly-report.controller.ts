/**
 * monthly-report.controller.ts
 * Laporan Bulanan PM & HM untuk customer
 * 
 * GET /api/v1/monthly-report?month=2026-06
 * GET /api/v1/monthly-report/summary
 */

import { Request, Response } from 'express';
import { query } from '../config/database';

// ============================================================
// GET /api/v1/monthly-report?month=YYYY-MM
// Laporan HM semua unit user + due PM di bulan tersebut
// ============================================================
export async function getMonthlyReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const monthParam = req.query.month as string;

    // Default: bulan ini
    const now = new Date();
    const year  = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam.split('-')[1]) : now.getMonth() + 1;

    // 1. Semua unit aktif milik user
    const unitsResult = await query(
      `SELECT id, unit_name, model, serial_number, current_hm, hm_updated_at, site_location
       FROM customer_units
       WHERE user_id = $1 AND is_active = true
       ORDER BY unit_name`,
      [userId]
    );
    const units = unitsResult.rows;

    // 2. Untuk tiap unit, cari PM yang due (HM interval cocok)
    const reportRows = await Promise.all(units.map(async (unit) => {
      const currentHm = unit.current_hm ?? 0;

      // Cari semua bundle PM yang tersedia untuk model ini
      const bundlesResult = await query(
        `SELECT pb.id, pb.interval_hm, pb.bundle_name,
                COUNT(bi.id) AS total_items,
                COUNT(bi.part_number) AS items_with_pn
         FROM pm_bundles pb
         LEFT JOIN pm_bundle_items bi ON bi.bundle_id = pb.id
         WHERE pb.unit_model = $1
         GROUP BY pb.id, pb.interval_hm, pb.bundle_name
         ORDER BY pb.interval_hm`,
        [unit.model]
      );

      // Hitung status PM setiap interval
      const pmStatus = bundlesResult.rows.map((bundle: any) => {
        const interval = bundle.interval_hm;
        // HM terakhir PM = sisa pembagian HM sekarang terhadap interval
        const lastPmHm = Math.floor(currentHm / interval) * interval;
        const nextPmHm = lastPmHm + interval;
        const hmSinceLastPm = currentHm - lastPmHm;
        const hmToNextPm = nextPmHm - currentHm;

        // Status
        let status: 'overdue' | 'due_soon' | 'ok';
        if (hmSinceLastPm === 0 && currentHm === 0) {
          status = 'ok'; // unit baru
        } else if (hmToNextPm <= 0) {
          status = 'overdue';   // sudah lewat
        } else if (hmToNextPm <= 50) {
          status = 'due_soon';  // <50 HM lagi
        } else {
          status = 'ok';
        }

        return {
          bundle_id:    bundle.id,
          bundle_name:  bundle.bundle_name,
          interval_hm:  interval,
          last_pm_hm:   lastPmHm,
          next_pm_hm:   nextPmHm,
          hm_to_next:   hmToNextPm,
          total_items:  parseInt(bundle.total_items),
          items_with_pn: parseInt(bundle.items_with_pn),
          status,
        };
      });

      const overdueCount  = pmStatus.filter(p => p.status === 'overdue').length;
      const dueSoonCount  = pmStatus.filter(p => p.status === 'due_soon').length;

      return {
        unit_id:        unit.id,
        unit_name:      unit.unit_name,
        model:          unit.model,
        serial_number:  unit.serial_number,
        current_hm:     currentHm,
        hm_updated_at:  unit.hm_updated_at,
        site_location:  unit.site_location,
        pm_status:      pmStatus,
        overdue_count:  overdueCount,
        due_soon_count: dueSoonCount,
        has_pm_data:    pmStatus.length > 0,
      };
    }));

    res.json({
      success: true,
      data: {
        period: { year, month, label: `${year}-${String(month).padStart(2, '0')}` },
        generated_at: new Date().toISOString(),
        total_units: units.length,
        units_overdue:  reportRows.filter(r => r.overdue_count > 0).length,
        units_due_soon: reportRows.filter(r => r.due_soon_count > 0).length,
        report: reportRows,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}

// ============================================================
// GET /api/v1/monthly-report/summary
// Ringkasan cepat untuk dashboard
// ============================================================
export async function getReportSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    const unitsResult = await query(
      `SELECT id, unit_name, model, current_hm FROM customer_units
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    );
    const units = unitsResult.rows;

    let totalOverdue  = 0;
    let totalDueSoon  = 0;
    let totalOk       = 0;

    for (const unit of units) {
      const currentHm = unit.current_hm ?? 0;
      const bundlesResult = await query(
        `SELECT interval_hm FROM pm_bundles WHERE unit_model = $1`,
        [unit.model]
      );
      for (const b of bundlesResult.rows) {
        const interval   = b.interval_hm;
        const lastPmHm   = Math.floor(currentHm / interval) * interval;
        const hmToNext   = (lastPmHm + interval) - currentHm;
        if (hmToNext <= 0)   totalOverdue++;
        else if (hmToNext <= 50) totalDueSoon++;
        else                 totalOk++;
      }
    }

    res.json({
      success: true,
      data: {
        total_units:  units.length,
        pm_overdue:   totalOverdue,
        pm_due_soon:  totalDueSoon,
        pm_ok:        totalOk,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
}
