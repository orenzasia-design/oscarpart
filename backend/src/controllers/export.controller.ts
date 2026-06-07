import { Request, Response } from 'express';
import { query } from '../config/database';
import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';

// ============================================================
// Shared: PM status computation (same logic as getUnitAnalytics)
// ============================================================
interface UnitRow {
  id: string;
  unit_name: string;
  model: string;
  serial_number: string | null;
  current_hm: number | null;
  last_pm_hm: number | null;
  last_pm_date: string | null;
  site_location: string | null;
  year_of_manufacture: number | null;
  interval_hm: number;
  // admin extras
  full_name?: string;
  company_name?: string | null;
  phone?: string | null;
}

interface ComputedUnit extends UnitRow {
  hm_since_pm: number;
  hm_to_next_pm: number;
  pm_status: 'ok' | 'due_soon' | 'overdue';
  pm_status_label: string;
}

function computeStatus(u: UnitRow): ComputedUnit {
  const cur = u.current_hm || 0;
  const lastPm = u.last_pm_hm || 0;
  const hmSince = Math.max(0, cur - lastPm);
  const hmToNext = u.interval_hm - hmSince;
  let pm_status: 'ok' | 'due_soon' | 'overdue' = 'ok';
  if (hmToNext <= 0) pm_status = 'overdue';
  else if (hmToNext <= 50) pm_status = 'due_soon';
  const pm_status_label = pm_status === 'overdue' ? 'Lewat PM' : pm_status === 'due_soon' ? 'Segera PM' : 'Normal';
  return { ...u, hm_since_pm: hmSince, hm_to_next_pm: hmToNext, pm_status, pm_status_label };
}

function fmtHM(hm: number | null) {
  if (!hm) return '0 HM';
  return hm.toLocaleString('id-ID') + ' HM';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================
// Shared: build HTML report
// ============================================================
function buildHtml(units: ComputedUnit[], title: string, exportDate: string, isAdmin: boolean): string {
  const summary = {
    total: units.length,
    ok: units.filter(u => u.pm_status === 'ok').length,
    due_soon: units.filter(u => u.pm_status === 'due_soon').length,
    overdue: units.filter(u => u.pm_status === 'overdue').length,
  };

  const adminCols = isAdmin ? `<th>Nama Customer</th><th>Perusahaan</th><th>No. HP</th>` : '';
  const adminRows = (u: ComputedUnit) => isAdmin
    ? `<td>${u.full_name || '—'}</td><td>${u.company_name || '—'}</td><td>${u.phone || '—'}</td>`
    : '';

  const rows = units.map((u, i) => {
    const statusColor = u.pm_status === 'overdue' ? '#dc2626' : u.pm_status === 'due_soon' ? '#d97706' : '#16a34a';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${u.unit_name}</td>
        <td>${u.model}</td>
        <td>${u.serial_number || '—'}</td>
        <td>${fmtHM(u.current_hm)}</td>
        <td>${fmtHM(u.last_pm_hm)}</td>
        <td>${fmtDate(u.last_pm_date)}</td>
        <td>${u.interval_hm.toLocaleString('id-ID')} HM</td>
        <td>${fmtHM(u.hm_since_pm)}</td>
        <td>${u.hm_to_next_pm <= 0 ? '<span style="color:#dc2626">Lewat ' + Math.abs(u.hm_to_next_pm).toLocaleString('id-ID') + ' HM</span>' : fmtHM(u.hm_to_next_pm)}</td>
        <td><span style="color:${statusColor};font-weight:600">${u.pm_status_label}</span></td>
        ${adminRows(u)}
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1f2937; background: #fff; padding: 24px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #2563eb; }
    .meta { text-align: right; color: #6b7280; font-size: 10px; line-height: 1.6; }
    .title { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .summary { display: flex; gap: 12px; margin-bottom: 16px; }
    .card { flex: 1; border-radius: 8px; padding: 10px 14px; }
    .card-total { background: #eff6ff; border: 1px solid #bfdbfe; }
    .card-ok { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .card-soon { background: #fffbeb; border: 1px solid #fde68a; }
    .card-over { background: #fef2f2; border: 1px solid #fecaca; }
    .card-num { font-size: 22px; font-weight: 900; }
    .card-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #2563eb; color: #fff; padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 600; white-space: nowrap; }
    td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">OSCARPART</div>
      <div class="title">${title}</div>
    </div>
    <div class="meta">
      <div>Tanggal Export: ${exportDate}</div>
      <div>Mining Parts Loyalty Engine</div>
    </div>
  </div>

  <div class="summary">
    <div class="card card-total"><div class="card-num" style="color:#2563eb">${summary.total}</div><div class="card-label">Total Unit</div></div>
    <div class="card card-ok"><div class="card-num" style="color:#16a34a">${summary.ok}</div><div class="card-label">Normal</div></div>
    <div class="card card-soon"><div class="card-num" style="color:#d97706">${summary.due_soon}</div><div class="card-label">Segera PM</div></div>
    <div class="card card-over"><div class="card-num" style="color:#dc2626">${summary.overdue}</div><div class="card-label">Lewat PM</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>No</th><th>Nama Unit</th><th>Model</th><th>Serial Number</th>
        <th>HM Saat Ini</th><th>HM PM Terakhir</th><th>Tanggal PM</th>
        <th>Interval PM</th><th>HM Sejak PM</th><th>Sisa ke PM Berikutnya</th>
        <th>Status PM</th>
        ${adminCols}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>Total: ${summary.total} unit | Normal: ${summary.ok} | Segera PM: ${summary.due_soon} | Lewat PM: ${summary.overdue}</span>
    <span>OSCARPART — oscarpart.vercel.app</span>
  </div>
</body>
</html>`;
}

// ============================================================
// Shared: build Excel workbook rows
// ============================================================
function buildExcel(units: ComputedUnit[], title: string, exportDate: string, isAdmin: boolean): Buffer {
  const adminHeaders = isAdmin ? ['Nama Customer', 'Perusahaan', 'No. HP'] : [];
  const headers = [
    'No', 'Nama Unit', 'Model', 'Serial Number',
    'HM Saat Ini', 'HM PM Terakhir', 'Tanggal PM Terakhir',
    'Interval PM (HM)', 'HM Sejak PM', 'Sisa ke PM Berikutnya (HM)',
    'Status PM',
    ...adminHeaders,
  ];

  const dataRows = units.map((u, i) => {
    const base = [
      i + 1,
      u.unit_name,
      u.model,
      u.serial_number || '',
      u.current_hm || 0,
      u.last_pm_hm || 0,
      u.last_pm_date ? new Date(u.last_pm_date).toLocaleDateString('id-ID') : '',
      u.interval_hm,
      u.hm_since_pm,
      u.hm_to_next_pm,
      u.pm_status_label,
    ];
    if (isAdmin) base.push(u.full_name || '', u.company_name || '', u.phone || '');
    return base;
  });

  const summary = [
    [],
    ['Ringkasan'],
    ['Total Unit', units.length],
    ['Normal', units.filter(u => u.pm_status === 'ok').length],
    ['Segera PM', units.filter(u => u.pm_status === 'due_soon').length],
    ['Lewat PM', units.filter(u => u.pm_status === 'overdue').length],
    [],
    ['Tanggal Export', exportDate],
    ['Diekspor dari', 'OSCARPART - Mining Parts Loyalty Engine'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    [title],
    [],
    headers,
    ...dataRows,
    ...summary,
  ]);

  // Style header row (row index 2, 0-based)
  ws['!cols'] = headers.map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan PM');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// ============================================================
// Shared: fetch customer units with PM data
// ============================================================
async function fetchCustomerUnits(userId: string): Promise<ComputedUnit[]> {
  const rows = await query(
    `SELECT cu.id, cu.unit_name, cu.model, cu.serial_number,
            cu.current_hm, cu.last_pm_hm, cu.last_pm_date,
            cu.site_location, cu.year_of_manufacture,
            COALESCE(pb.interval_hm, 250) AS interval_hm
     FROM customer_units cu
     LEFT JOIN LATERAL (
       SELECT interval_hm FROM pm_bundles
       WHERE unit_model = cu.model
       ORDER BY interval_hm ASC LIMIT 1
     ) pb ON true
     WHERE cu.user_id = $1 AND cu.is_active = true
     ORDER BY cu.unit_name ASC`,
    [userId]
  );
  return rows.rows.map(computeStatus);
}

// ============================================================
// Shared: fetch ALL units with customer info (admin)
// ============================================================
async function fetchAdminUnits(): Promise<ComputedUnit[]> {
  const rows = await query(
    `SELECT cu.id, cu.unit_name, cu.model, cu.serial_number,
            cu.current_hm, cu.last_pm_hm, cu.last_pm_date,
            cu.site_location, cu.year_of_manufacture,
            u.full_name, u.company_name, u.phone,
            COALESCE(pb.interval_hm, 250) AS interval_hm
     FROM customer_units cu
     JOIN users u ON u.id = cu.user_id
     LEFT JOIN LATERAL (
       SELECT interval_hm FROM pm_bundles
       WHERE unit_model = cu.model
       ORDER BY interval_hm ASC LIMIT 1
     ) pb ON true
     WHERE cu.is_active = true
     ORDER BY u.full_name ASC, cu.unit_name ASC`
  );
  return rows.rows.map(computeStatus);
}

// ============================================================
// GET /api/v1/units/export/pdf — customer
// ============================================================
export async function exportCustomerPdf(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const units = await fetchCustomerUnits(userId);
    const exportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = buildHtml(units, 'Laporan PM Unit Saya', exportDate, false);

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-pm-oscarpart.pdf"',
    });
    res.send(Buffer.from(pdf));
  } catch (err) {
    console.error('exportCustomerPdf error:', err);
    res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
  }
}

// ============================================================
// GET /api/v1/units/export/excel — customer
// ============================================================
export async function exportCustomerExcel(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const units = await fetchCustomerUnits(userId);
    const exportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const buf = buildExcel(units, 'Laporan PM Unit Saya', exportDate, false);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="laporan-pm-oscarpart.xlsx"',
    });
    res.send(buf);
  } catch (err) {
    console.error('exportCustomerExcel error:', err);
    res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
  }
}

// ============================================================
// GET /api/v1/admin/units/export/pdf — admin
// ============================================================
export async function exportAdminPdf(req: Request, res: Response): Promise<void> {
  try {
    const units = await fetchAdminUnits();
    const exportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = buildHtml(units, 'Laporan PM Semua Unit — Semua Customer', exportDate, true);

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', landscape: true, printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="laporan-pm-semua-unit-oscarpart.pdf"',
    });
    res.send(Buffer.from(pdf));
  } catch (err) {
    console.error('exportAdminPdf error:', err);
    res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
  }
}

// ============================================================
// GET /api/v1/admin/units/export/excel — admin
// ============================================================
export async function exportAdminExcel(req: Request, res: Response): Promise<void> {
  try {
    const units = await fetchAdminUnits();
    const exportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const buf = buildExcel(units, 'Laporan PM Semua Unit — Semua Customer', exportDate, true);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="laporan-pm-semua-unit-oscarpart.xlsx"',
    });
    res.send(buf);
  } catch (err) {
    console.error('exportAdminExcel error:', err);
    res.status(500).json({ success: false, error: 'EXPORT_FAILED' });
  }
}
