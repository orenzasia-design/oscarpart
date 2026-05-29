import puppeteer from 'puppeteer';
import { query } from '../config/database';
import logger from '../config/logger';
import type { RfqSession } from './rfq.service';

// ============================================================
// Currency formatter
// ============================================================

function formatIDR(amount: number | null): string {
  if (amount === null || amount === undefined) return 'Rp -';
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ============================================================
// Build PDF HTML
// ============================================================

function buildPdfHtml(rfq: RfqSession, companySettings: Record<string, string>): string {
  const validityDays  = parseInt(companySettings.rfq_validity_days || '7');
  const submittedDate = rfq.submitted_at ? new Date(rfq.submitted_at) : new Date();
  const validUntil    = new Date(submittedDate.getTime() + validityDays * 86400000);

  const matchedItems   = rfq.items.filter((i) => i.match_status === 'matched');
  const unmatchedItems = rfq.items.filter((i) => i.match_status !== 'matched');

  const watermarkText = `${rfq.company_name || 'CONFIDENTIAL'} • ${formatDate(rfq.submitted_at || new Date().toISOString())} • ${rfq.rfq_number}`;

  const itemRows = matchedItems.map((item, idx) => `
    <tr class="${idx % 2 === 0 ? 'row-even' : 'row-odd'}">
      <td class="center">${idx + 1}</td>
      <td class="bold">${item.part_number}</td>
      <td>${item.description || '-'}</td>
      <td>${item.brand || '-'}</td>
      <td class="center">${item.unit_type || 'PCS'}</td>
      <td class="center">${item.stock_available !== null ? (item.stock_available > 0 ? `<span class="badge-stock">Ada</span>` : `<span class="badge-nostock">Habis</span>`) : '-'}</td>
      <td class="right">${item.qty_requested}</td>
      <td class="right">${formatIDR(item.unit_price_at_time)}</td>
      <td class="right bold">${formatIDR(item.line_total)}</td>
    </tr>`).join('');

  const unmatchedRows = unmatchedItems.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td class="bold">${item.part_number}</td>
      <td>${item.description || '-'}</td>
      <td>${item.brand || '-'}</td>
      <td class="center">${item.unit_type || '-'}</td>
      <td class="right">${item.qty_requested}</td>
      <td class="center"><span class="badge-nostock">Perlu Konfirmasi</span></td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Arial', sans-serif;
    font-size: 11px;
    color: #222;
    position: relative;
  }
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 18px;
    color: rgba(26,58,92,0.07);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 2px;
    font-weight: bold;
    width: 120%;
    text-align: center;
  }
  .page { padding: 20mm 18mm; position: relative; z-index: 1; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 16px; }
  .company-info h1 { font-size: 22px; color: #1a3a5c; letter-spacing: 1px; }
  .company-info p  { font-size: 10px; color: #555; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 18px; color: #1a3a5c; text-transform: uppercase; letter-spacing: 2px; }
  .doc-title .rfq-num { font-size: 13px; font-weight: bold; color: #c0392b; margin-top: 4px; }
  .doc-title .dates  { font-size: 10px; color: #555; margin-top: 4px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
  .info-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px 12px; }
  .info-box h4 { font-size: 10px; text-transform: uppercase; color: #1a3a5c; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-bottom: 6px; letter-spacing: .5px; }
  .info-box p  { margin: 3px 0; font-size: 10.5px; }
  .info-box strong { color: #333; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10px; }
  th { background: #1a3a5c; color: #fff; padding: 7px 6px; text-align: left; font-size: 10px; }
  td { padding: 6px; border-bottom: 1px solid #eee; vertical-align: middle; }
  .row-even { background: #fff; }
  .row-odd  { background: #f8fafc; }
  .center { text-align: center; }
  .right  { text-align: right; }
  .bold   { font-weight: bold; }
  .badge-stock   { background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 10px; font-size: 9px; }
  .badge-nostock { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 10px; font-size: 9px; }
  .financial-box { margin: 16px 0; display: flex; justify-content: flex-end; }
  .financial-table { width: 280px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
  .financial-table td { padding: 7px 12px; border-bottom: 1px solid #eee; }
  .financial-table .total-row { background: #1a3a5c; color: #fff; font-weight: bold; font-size: 12px; }
  .section-title { font-size: 12px; font-weight: bold; color: #1a3a5c; margin: 16px 0 6px; border-left: 3px solid #1a3a5c; padding-left: 8px; }
  .unmatched-note { background: #fff8e1; border: 1px solid #f0c040; border-radius: 4px; padding: 8px 12px; margin: 8px 0; font-size: 10px; color: #7d5a00; }
  .terms { font-size: 9.5px; color: #555; margin: 16px 0; padding: 10px 12px; background: #f8f9fa; border-radius: 4px; }
  .terms h4 { font-size: 10px; color: #333; margin-bottom: 4px; }
  .terms ol { padding-left: 14px; }
  .terms li { margin: 2px 0; }
  .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
  .sig-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px 12px; min-height: 80px; }
  .sig-box p { font-size: 10px; color: #555; }
  .sig-box .sig-name { margin-top: 50px; font-weight: bold; font-size: 11px; border-top: 1px solid #333; padding-top: 4px; }
  .page-num { position: fixed; bottom: 10mm; right: 18mm; font-size: 9px; color: #999; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="watermark">${watermarkText} • ${watermarkText}</div>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="company-info">
      <h1>${companySettings.company_name || 'OSCARPART'}</h1>
      <p>${companySettings.company_tagline || 'Mining Parts & Equipment Specialist'}</p>
      <p>${companySettings.company_address || ''}</p>
      <p>📞 ${companySettings.company_phone || ''} &nbsp;|&nbsp; ✉ ${companySettings.company_email || ''}</p>
    </div>
    <div class="doc-title">
      <h2>Penawaran Harga</h2>
      <div class="rfq-num">${rfq.rfq_number}</div>
      <div class="dates">
        Tanggal: ${formatDate(rfq.submitted_at || new Date().toISOString())}<br>
        Berlaku s/d: ${formatDate(validUntil.toISOString())} (${validityDays} hari)
      </div>
    </div>
  </div>

  <!-- CUSTOMER + PROJECT INFO -->
  <div class="info-grid">
    <div class="info-box">
      <h4>Kepada Yth.</h4>
      <p><strong>${rfq.company_name || '-'}</strong></p>
      <p>${rfq.contact_person || '-'} &mdash; ${rfq.position || '-'}</p>
      <p>📧 ${rfq.email || '-'}</p>
      <p>📱 ${rfq.whatsapp || '-'}</p>
    </div>
    <div class="info-box">
      <h4>Detail Project</h4>
      <p><strong>Project:</strong> ${rfq.project_name || '-'}</p>
      <p><strong>Lokasi Pengiriman:</strong> ${rfq.delivery_location || '-'}</p>
      ${rfq.notes ? `<p><strong>Catatan:</strong> ${rfq.notes}</p>` : ''}
    </div>
  </div>

  <!-- MATCHED ITEMS TABLE -->
  ${matchedItems.length > 0 ? `
  <div class="section-title">Daftar Part &amp; Penawaran Harga</div>
  <table>
    <thead>
      <tr>
        <th class="center" style="width:30px">No</th>
        <th style="width:120px">Part Number</th>
        <th>Deskripsi</th>
        <th style="width:90px">Brand</th>
        <th class="center" style="width:45px">Unit</th>
        <th class="center" style="width:55px">Stok</th>
        <th class="right"  style="width:40px">Qty</th>
        <th class="right"  style="width:90px">Harga Satuan</th>
        <th class="right"  style="width:100px">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>` : ''}

  <!-- UNMATCHED ITEMS -->
  ${unmatchedItems.length > 0 ? `
  <div class="section-title">Part Memerlukan Konfirmasi Stok</div>
  <div class="unmatched-note">
    ⚠ Part berikut tidak ditemukan dalam sistem kami saat ini. Tim kami akan menghubungi Anda untuk konfirmasi ketersediaan dan harga.
  </div>
  <table>
    <thead>
      <tr>
        <th class="center" style="width:30px">No</th>
        <th style="width:120px">Part Number</th>
        <th>Deskripsi</th>
        <th style="width:90px">Brand</th>
        <th class="center" style="width:45px">Unit</th>
        <th class="right"  style="width:40px">Qty</th>
        <th class="center" style="width:120px">Status</th>
      </tr>
    </thead>
    <tbody>${unmatchedRows}</tbody>
  </table>` : ''}

  <!-- FINANCIAL SUMMARY -->
  ${rfq.subtotal !== null ? `
  <div class="financial-box">
    <table class="financial-table">
      <tr><td>Subtotal</td><td class="right">${formatIDR(rfq.subtotal)}</td></tr>
      <tr><td>PPN ${rfq.tax_rate}%</td><td class="right">${formatIDR(rfq.tax_amount)}</td></tr>
      <tr class="total-row"><td>GRAND TOTAL</td><td class="right">${formatIDR(rfq.grand_total)}</td></tr>
    </table>
  </div>` : ''}

  <!-- TERMS -->
  <div class="terms">
    <h4>Syarat &amp; Ketentuan:</h4>
    <ol>
      <li>Harga berlaku selama <strong>${validityDays} hari</strong> sejak tanggal penawaran.</li>
      <li>Harga belum termasuk biaya pengiriman, kecuali disebutkan lain.</li>
      <li>Pembayaran: sesuai kesepakatan bersama.</li>
      <li>Part yang tidak tercantum harga akan dikonfirmasi terpisah oleh tim sales kami.</li>
      <li>Spesifikasi dan ketersediaan barang dapat berubah sewaktu-waktu.</li>
    </ol>
  </div>

  <!-- SIGNATURE -->
  <div class="signature">
    <div class="sig-box">
      <p>Hormat kami,</p>
      <p><strong>${companySettings.company_name || 'OSCARPART'}</strong></p>
      <div class="sig-name">Sales Representative</div>
    </div>
    <div class="sig-box">
      <p>Disetujui oleh,</p>
      <p>${rfq.company_name || ''}</p>
      <div class="sig-name">${rfq.contact_person || '________________________________'}</div>
    </div>
  </div>

  <div class="page-num">Dokumen ini dibuat secara otomatis oleh sistem OSCARPART</div>
</div>
</body>
</html>`;
}

// ============================================================
// Generate PDF buffer using Puppeteer
// ============================================================

export async function generateRfqPdf(rfqId: string): Promise<Buffer> {
  // Load RFQ with items
  const { getRfqById } = await import('./rfq.service');
  const rfq = await getRfqById(rfqId);

  // Load company settings
  const settingsRes = await query<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN (
      'company_name','company_tagline','company_address',
      'company_phone','company_email','rfq_validity_days'
    )`
  );
  const settings: Record<string, string> = {};
  settingsRes.rows.forEach((r) => { settings[r.key] = r.value; });

  const html = buildPdfHtml(rfq, settings);

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  let pdfBuffer: Buffer;

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format:           'A4',
      printBackground:  true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    pdfBuffer = Buffer.from(pdf);
  } finally {
    await browser.close();
  }

  // Update rfq_sessions with pdf_generated_at
  await query(
    `UPDATE rfq_sessions SET pdf_generated_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [rfqId]
  );

  logger.info(`PDF generated for RFQ ${rfq.rfq_number}`, { rfqId, size: pdfBuffer.length });
  return pdfBuffer;
}
