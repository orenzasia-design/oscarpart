import nodemailer from 'nodemailer';
import { broadcastToAdmins, sendToUser } from './sse.service';

import { query } from '../config/database';
import logger from '../config/logger';
import type { RfqSession } from './rfq.service';

// ============================================================
// WhatsApp — Phase 1: wa.me deep link (zero dependency)
// ============================================================

export function buildWhatsAppUrl(rfq: RfqSession): string {
  const waNumber = process.env.WHATSAPP_NUMBER || '62XXXXXXXXXX';

  const matchedCount   = rfq.items?.filter((i) => i.match_status === 'matched').length ?? 0;
  const unmatchedCount = rfq.items?.filter((i) => i.match_status === 'unmatched').length ?? 0;

  const lines = [
    `*RFQ OSCARPART*`,
    ``,
    `📋 *Nomor RFQ:* ${rfq.rfq_number}`,
    `🏢 *Perusahaan:* ${rfq.company_name}`,
    `👤 *Kontak:* ${rfq.contact_person} (${rfq.position})`,
    `📧 *Email:* ${rfq.email}`,
    ``,
    `🔧 *Project:* ${rfq.project_name}`,
    `📍 *Lokasi Pengiriman:* ${rfq.delivery_location}`,
    ``,
    `📦 *Total Item:* ${rfq.items?.length ?? 0} part`,
    `✅ *Part Ditemukan:* ${matchedCount}`,
    `❓ *Part Tidak Ditemukan:* ${unmatchedCount}`,
    rfq.grand_total ? `💰 *Estimasi Total:* Rp ${formatCurrency(rfq.grand_total)}` : '',
    ``,
    rfq.notes ? `📝 *Catatan:* ${rfq.notes}` : '',
    ``,
    `Mohon proses quotation ini. Terima kasih.`,
  ].filter((l) => l !== undefined).join('\n');

  const encoded = encodeURIComponent(lines);
  return `https://wa.me/${waNumber}?text=${encoded}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

// ============================================================
// Email transport
// ============================================================

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (process.env.EMAIL_PROVIDER === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

// ============================================================
// Email templates
// ============================================================

const emailStyles = `
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
    .container { background: #fff; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; }
    .header { background: #1a3a5c; color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p  { margin: 4px 0 0; opacity: .8; font-size: 13px; }
    .body { padding: 24px; color: #333; }
    .info-box { background: #f8f9fa; border-left: 4px solid #1a3a5c; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .btn { display: inline-block; background: #1a3a5c; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f8f9fa; padding: 16px 24px; font-size: 12px; color: #666; text-align: center; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-pending  { background: #fff3cd; color: #856404; }
    .badge-approved { background: #d1e7dd; color: #0f5132; }
  </style>
`;

function wrapEmail(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${emailStyles}</head><body>
  <div class="container">
    <div class="header">
      <h1>OSCARPART</h1>
      <p>Mining Parts & Equipment Specialist</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      Email ini dikirim otomatis oleh sistem OSCARPART. Jangan balas email ini.<br>
      © ${new Date().getFullYear()} OSCARPART. All rights reserved.
    </div>
  </div></body></html>`;
}

// ============================================================
// Send email utility
// ============================================================

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  userId?: string | null;
}): Promise<void> {
  const fromName    = process.env.EMAIL_FROM_NAME    || 'OSCARPART';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@oscarpart.id';

  const notifResult = await query<{ id: string }>(
    `INSERT INTO notifications
       (type, recipient_email, recipient_user_id, subject, body, status)
     VALUES ('email', $1, $2, $3, $4, 'pending')
     RETURNING id`,
    [options.to, options.userId || null, options.subject, options.html]
  );
  const notifId = notifResult.rows[0]?.id;

  try {
    const t = getTransporter();
    await t.sendMail({
      from:    `"${fromName}" <${fromAddress}>`,
      to:      options.to,
      subject: options.subject,
      html:    options.html,
    });

    if (notifId) {
      await query(
        `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [notifId]
      );
    }
  } catch (err) {
    logger.error('Email send failed', { to: options.to, subject: options.subject, err });
    if (notifId) {
      await query(
        `UPDATE notifications SET status = 'failed', error_message = $2, retry_count = retry_count + 1 WHERE id = $1`,
        [notifId, String(err)]
      );
    }
  }
}

// ============================================================
// Notification: new registration (to admin)
// ============================================================

export async function notifyAdminNewRegistration(user: {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  position: string | null;
  industry: string | null;
  created_at: string;
}): Promise<void> {
  const adminEmail  = process.env.EMAIL_ADMIN   || 'admin@oscarpart.id';
  const frontendUrl = process.env.FRONTEND_URL  || 'http://localhost:3000';

  // --- Email ke admin (tidak blokir WA jika gagal) ---
  const html = wrapEmail('Pendaftaran Akun Baru', `
    <p>Ada pendaftaran akun baru yang memerlukan approval:</p>
    <div class="info-box">
      <p><strong>Nama:</strong> ${user.full_name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Perusahaan:</strong> ${user.company_name || '-'}</p>
      <p><strong>Jabatan:</strong> ${user.position || '-'}</p>
      <p><strong>Industri:</strong> ${user.industry || '-'}</p>
      <p><strong>Waktu Daftar:</strong> ${new Date(user.created_at).toLocaleString('id-ID')}</p>
    </div>
    <a href="${frontendUrl}/admin/users/${user.id}" class="btn">Review Pendaftaran</a>
  `);

  sendEmail({
    to:      adminEmail,
    subject: `[OSCARPART] Pendaftaran Baru: ${user.company_name || user.full_name}`,
    html,
  }).catch((err: Error) => logger.error('Admin registration email failed:', err));

  // --- WhatsApp ke admin via Fonnte ---
  try {
    const waMessage =
      `🔔 *REGISTRASI BARU - OSCARPART*\n\n` +
      `👤 *Nama:* ${user.full_name}\n` +
      `📧 *Email:* ${user.email}\n` +
      `🏢 *Perusahaan:* ${user.company_name || '-'}\n` +
      `💼 *Jabatan:* ${user.position || '-'}\n` +
      `🏭 *Industri:* ${user.industry || '-'}\n` +
      `🕐 *Waktu Daftar:* ${new Date(user.created_at).toLocaleString('id-ID')}\n\n` +
      `Silakan review di: ${frontendUrl}/admin/users/${user.id}`;

    const fonnteToken  = process.env.FONNTE_TOKEN  || 'nFpeYZTLcB2yrCd7sghK';
    const fonnteTarget = process.env.FONNTE_ADMIN_NUMBER || '6288802032033';

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnteToken,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        target:  fonnteTarget,
        message: waMessage,
      }),
    });

    const result = await response.json() as { status: boolean; reason?: string };
    if (!result.status) {
      logger.warn('Fonnte WA notification failed:', result.reason);
    } else {
      logger.info('Fonnte WA notification sent to admin');
    }
  } catch (err) {
    logger.error('Fonnte WA notification error:', err);
  }
}

// ============================================================
// Notification: approval approved (to user)
// ============================================================

export async function notifyUserApproved(user: {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
}): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const html = wrapEmail('Akun Anda Telah Disetujui! 🎉', `
    <p>Halo <strong>${user.full_name}</strong>,</p>
    <p>Selamat! Akun Anda di OSCARPART telah <span class="badge badge-approved">DISETUJUI</span>.</p>
    <p>Anda sekarang dapat login dan mengakses:</p>
    <ul>
      <li>Pencarian part dengan informasi stok lengkap</li>
      <li>Harga dan ketersediaan real-time</li>
      <li>Submit RFQ (Request for Quotation)</li>
      <li>History transaksi Anda</li>
    </ul>
    <a href="${frontendUrl}/login" class="btn">Login Sekarang</a>
    <p style="font-size:13px;color:#666;">Jika ada pertanyaan, silakan hubungi kami melalui WhatsApp atau email.</p>
  `);

  await sendEmail({
    to:      user.email,
    subject: `[OSCARPART] Akun Anda Telah Disetujui`,
    html,
    userId:  user.id,
  });
}

// ============================================================
// Notification: approval rejected (to user)
// ============================================================

export async function notifyUserRejected(user: {
  id: string;
  email: string;
  full_name: string;
  rejection_reason?: string;
}): Promise<void> {
  const html = wrapEmail('Informasi Status Pendaftaran', `
    <p>Halo <strong>${user.full_name}</strong>,</p>
    <p>Mohon maaf, pendaftaran akun Anda di OSCARPART belum dapat kami setujui saat ini.</p>
    ${user.rejection_reason ? `
    <div class="info-box">
      <p><strong>Alasan:</strong> ${user.rejection_reason}</p>
    </div>` : ''}
    <p>Jika Anda memiliki pertanyaan atau ingin mendaftar ulang dengan informasi yang lebih lengkap, silakan hubungi tim kami.</p>
  `);

  await sendEmail({
    to:      user.email,
    subject: `[OSCARPART] Informasi Status Pendaftaran Akun`,
    html,
    userId:  user.id,
  });
}

// ============================================================
// Notification: RFQ submitted (to admin)
// ============================================================

export async function notifyAdminNewRfq(rfq: RfqSession): Promise<void> {
  const adminEmail  = process.env.EMAIL_ADMIN   || 'admin@oscarpart.id';
  const frontendUrl = process.env.FRONTEND_URL  || 'http://localhost:3000';

  const html = wrapEmail(`RFQ Baru: ${rfq.rfq_number}`, `
    <p>RFQ baru telah dikirim dan memerlukan tindak lanjut:</p>
    <div class="info-box">
      <p><strong>Nomor RFQ:</strong> ${rfq.rfq_number}</p>
      <p><strong>Perusahaan:</strong> ${rfq.company_name}</p>
      <p><strong>Kontak:</strong> ${rfq.contact_person} — ${rfq.email}</p>
      <p><strong>WhatsApp:</strong> ${rfq.whatsapp}</p>
      <p><strong>Project:</strong> ${rfq.project_name}</p>
      <p><strong>Total Item:</strong> ${rfq.items?.length ?? 0}</p>
      ${rfq.grand_total ? `<p><strong>Estimasi Total:</strong> Rp ${formatCurrency(rfq.grand_total)}</p>` : ''}
    </div>
    <a href="${frontendUrl}/admin/rfq/${rfq.rfq_number}" class="btn">Lihat RFQ</a>
  `);

  // ─── SSE broadcast to all admin clients ───────────────────────────────
  broadcastToAdmins('new_rfq', {
    rfq_number:   rfq.rfq_number,
    company_name: rfq.company_name,
    contact:      rfq.contact_person,
    total_items:  rfq.items?.length ?? 0,
    timestamp:    new Date().toISOString(),
  });

  await sendEmail({
    to:      adminEmail,
    subject: `[OSCARPART] RFQ Baru: ${rfq.rfq_number} — ${rfq.company_name}`,
    html,
  });
}

export { sendToUser, broadcastToAdmins };
export default {
  buildWhatsAppUrl,
  notifyAdminNewRegistration,
  notifyUserApproved,
  notifyUserRejected,
  notifyAdminNewRfq,
};
