/**
 * PM REMINDER SERVICE
 * Kirim notifikasi email + WhatsApp ke user saat unit mendekati jadwal PM
 *
 * Trigger: dipanggil dari scheduler (cron) setiap hari jam 07:00 WIB
 * Logika:
 *   - Ambil semua unit dengan HM terbaru
 *   - Hitung HM tersisa ke PM berikutnya per bundle
 *   - Jika sisa HM <= threshold (50 HM default) → kirim reminder
 *   - Jika sisa HM <= 0 → kirim alert overdue
 *   - Simpan log ke tabel pm_reminder_logs agar tidak kirim duplikat
 */

import { query } from '../config/database';
import logger from '../config/logger';
import { broadcastToAdmins } from './sse.service';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PmReminderRow {
  unit_id: string;
  unit_name: string;
  model: string;
  current_hm: number;
  user_id: string;
  user_email: string;
  user_name: string;
  whatsapp: string | null;
  bundle_id: number;
  bundle_name: string;
  interval_hm: number;
  last_pm_hm: number;
  next_pm_hm: number;
  hm_to_next: number;
}

// ─── WhatsApp via Fonnte ──────────────────────────────────────────────────────
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const token  = process.env.FONNTE_TOKEN;
  if (!token || !phone) return;
  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone.replace(/\D/g, ''), message }),
    });
    const json = await res.json() as { status: boolean; reason?: string };
    if (!json.status) logger.warn(`Fonnte failed for ${phone}: ${json.reason}`);
  } catch (err) {
    logger.error('Fonnte WA error:', err);
  }
}

// ─── Email helper ─────────────────────────────────────────────────────────────
async function sendReminderEmail(opts: {
  to: string; userId: string; subject: string; html: string;
}): Promise<void> {
  try {
    // Log to notifications table
    await query(
      `INSERT INTO notifications (type, recipient_email, recipient_user_id, subject, body, status)
       VALUES ('email', $1, $2, $3, $4, 'pending')`,
      [opts.to, opts.userId, opts.subject, opts.html]
    );

    const nodemailer = await import('nodemailer');
    const t = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    await t.sendMail({
      from: `"OSCARPART" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@oscarpart.id'}>`,
      to: opts.to, subject: opts.subject, html: opts.html,
    });
    await query(
      `UPDATE notifications SET status = 'sent', sent_at = NOW()
       WHERE recipient_email = $1 AND subject = $2 AND status = 'pending'`,
      [opts.to, opts.subject]
    );
  } catch (err) {
    logger.error(`Email failed to ${opts.to}:`, err);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
function reminderEmailHtml(rows: PmReminderRow[], type: 'due_soon' | 'overdue'): string {
  const unit = rows[0];
  const color = type === 'overdue' ? '#dc2626' : '#d97706';
  const icon  = type === 'overdue' ? '🚨' : '⏰';
  const title = type === 'overdue'
    ? `${icon} PM OVERDUE — ${unit.unit_name}`
    : `${icon} Jadwal PM Mendekat — ${unit.unit_name}`;

  const itemRows = rows.map(r => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${r.bundle_name}</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${r.interval_hm.toLocaleString()} HM</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;">${r.next_pm_hm.toLocaleString()} HM</td>
      <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:bold;color:${color};">
        ${r.hm_to_next <= 0 ? `Lewat ${Math.abs(r.hm_to_next)} HM` : `${r.hm_to_next} HM lagi`}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:20px;">
  <div style="background:#fff;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden;">
    <div style="background:${color};color:#fff;padding:24px;text-align:center;">
      <h1 style="margin:0;font-size:22px;">OSCARPART</h1>
      <p style="margin:4px 0 0;opacity:.9;">PM Reminder System</p>
    </div>
    <div style="padding:24px;color:#333;">
      <h2 style="color:${color};">${title}</h2>
      <p>Halo <strong>${unit.user_name}</strong>,</p>
      <p>${type === 'overdue'
        ? `Unit <strong>${unit.unit_name}</strong> (${unit.model}) sudah <strong style="color:${color};">melewati jadwal PM</strong>. Segera lakukan Preventive Maintenance.`
        : `Unit <strong>${unit.unit_name}</strong> (${unit.model}) mendekati jadwal Preventive Maintenance.`
      }</p>
      <div style="background:#f8f9fa;border-radius:6px;padding:12px 16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Unit:</strong> ${unit.unit_name}</p>
        <p style="margin:4px 0;"><strong>Model:</strong> ${unit.model}</p>
        <p style="margin:4px 0;"><strong>HM Saat Ini:</strong> ${unit.current_hm.toLocaleString()} HM</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Bundle PM</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Interval</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Jadwal PM</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Status</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'https://oscarpart.vercel.app'}/omm-guide"
           style="display:inline-block;background:#1a3a5c;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
          Buka OMM Pocket Guide
        </a>
        &nbsp;
        <a href="${process.env.FRONTEND_URL || 'https://oscarpart.vercel.app'}/monthly-report"
           style="display:inline-block;background:#f8f9fa;color:#1a3a5c;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;border:1px solid #ddd;">
          Lihat Laporan PM
        </a>
      </div>
    </div>
    <div style="background:#f8f9fa;padding:16px 24px;font-size:12px;color:#666;text-align:center;">
      Email ini dikirim otomatis oleh sistem OSCARPART. Jangan balas email ini.<br>
      © ${new Date().getFullYear()} OSCARPART. All rights reserved.
    </div>
  </div></body></html>`;
}

// ─── Check & log dedup ────────────────────────────────────────────────────────
async function alreadySentToday(unitId: string, bundleId: number, type: string): Promise<boolean> {
  try {
    const res = await query(
      `SELECT 1 FROM pm_reminder_logs
       WHERE unit_id = $1 AND bundle_id = $2 AND reminder_type = $3
         AND sent_at > NOW() - INTERVAL '20 hours'`,
      [unitId, bundleId, type]
    );
    return (res.rowCount ?? 0) > 0;
  } catch {
    return false; // if table doesn't exist yet, allow sending
  }
}

async function logReminder(unitId: string, bundleId: number, type: string, hmToNext: number): Promise<void> {
  try {
    await query(
      `INSERT INTO pm_reminder_logs (unit_id, bundle_id, reminder_type, hm_to_next, sent_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (unit_id, bundle_id, reminder_type) DO UPDATE SET sent_at = NOW(), hm_to_next = $4`,
      [unitId, bundleId, type, hmToNext]
    );
  } catch (err) {
    logger.warn('pm_reminder_logs insert failed (table may not exist):', err);
  }
}

// ─── Main function ────────────────────────────────────────────────────────────
export async function runPmReminders(thresholdHm = 50): Promise<{ sent: number; skipped: number }> {
  logger.info('🔔 Running PM reminder check...');
  let sent = 0; let skipped = 0;

  try {
    // Get all units with PM status + user contact
    const result = await query<PmReminderRow>(`
      SELECT
        cu.id          AS unit_id,
        cu.unit_name,
        cu.model,
        cu.current_hm,
        us.id          AS user_id,
        us.email       AS user_email,
        us.full_name   AS user_name,
        us.phone       AS whatsapp,
        pb.id          AS bundle_id,
        pb.bundle_name,
        pb.interval_hm,
        COALESCE(cu.last_pm_hm, 0) AS last_pm_hm,
        (COALESCE(cu.last_pm_hm, 0) + pb.interval_hm) AS next_pm_hm,
        (COALESCE(cu.last_pm_hm, 0) + pb.interval_hm - cu.current_hm) AS hm_to_next
      FROM customer_units cu
      JOIN users us ON cu.user_id = us.id
      JOIN pm_bundles pb ON pb.unit_model = cu.model
      WHERE cu.current_hm > 0
        AND cu.is_active = true
        AND us.status = 'approved'
        AND (COALESCE(cu.last_pm_hm, 0) + pb.interval_hm - cu.current_hm) <= $1
      ORDER BY cu.user_id, cu.id, hm_to_next ASC
    `, [thresholdHm]);

    if (!result.rows.length) {
      logger.info('✅ No PM reminders needed today.');
      return { sent, skipped };
    }

    // Group by user+unit
    const grouped: Record<string, { overdue: PmReminderRow[]; due_soon: PmReminderRow[] }> = {};
    for (const row of result.rows) {
      const key = `${row.user_id}__${row.unit_id}`;
      if (!grouped[key]) grouped[key] = { overdue: [], due_soon: [] };
      if (row.hm_to_next <= 0) grouped[key].overdue.push(row);
      else grouped[key].due_soon.push(row);
    }

    for (const [, { overdue, due_soon }] of Object.entries(grouped)) {
      // Process overdue
      for (const row of overdue) {
        const already = await alreadySentToday(row.unit_id, row.bundle_id, 'overdue');
        if (already) { skipped++; continue; }

        const subject = `🚨 [OSCARPART] PM OVERDUE — ${row.unit_name} (${row.bundle_name})`;
        await sendReminderEmail({
          to: row.user_email, userId: row.user_id, subject,
          html: reminderEmailHtml([row], 'overdue'),
        });

        if (row.whatsapp) {
          await sendWhatsApp(row.whatsapp,
            `🚨 *PM OVERDUE - OSCARPART*\n\nHalo ${row.user_name},\n\nUnit *${row.unit_name}* (${row.model}) sudah melewati jadwal PM!\n\n` +
            `📋 *${row.bundle_name}*\n` +
            `🔢 HM Saat Ini: ${row.current_hm.toLocaleString()}\n` +
            `📅 Jadwal PM: ${row.next_pm_hm.toLocaleString()} HM\n` +
            `⚠️ Status: Lewat ${Math.abs(row.hm_to_next)} HM\n\n` +
            `Segera lakukan PM. Buka OMM Guide di:\n${process.env.FRONTEND_URL || 'https://oscarpart.vercel.app'}/omm-guide`
          );
        }

        // SSE broadcast to admin dashboard
        broadcastToAdmins('pm_overdue', {
          unit_name:   row.unit_name,
          model:       row.model,
          bundle_name: row.bundle_name,
          hm_overdue:  Math.abs(row.hm_to_next),
          user_name:   row.user_name,
          timestamp:   new Date().toISOString(),
        });
        await logReminder(row.unit_id, row.bundle_id, 'overdue', row.hm_to_next);
        sent++;
      }

      // Process due_soon
      for (const row of due_soon) {
        const already = await alreadySentToday(row.unit_id, row.bundle_id, 'due_soon');
        if (already) { skipped++; continue; }

        const subject = `⏰ [OSCARPART] Jadwal PM Mendekat — ${row.unit_name} (${row.hm_to_next} HM lagi)`;
        await sendReminderEmail({
          to: row.user_email, userId: row.user_id, subject,
          html: reminderEmailHtml([row], 'due_soon'),
        });

        if (row.whatsapp) {
          await sendWhatsApp(row.whatsapp,
            `⏰ *PM REMINDER - OSCARPART*\n\nHalo ${row.user_name},\n\nUnit *${row.unit_name}* (${row.model}) mendekati jadwal PM.\n\n` +
            `📋 *${row.bundle_name}*\n` +
            `🔢 HM Saat Ini: ${row.current_hm.toLocaleString()}\n` +
            `📅 PM Berikutnya: ${row.next_pm_hm.toLocaleString()} HM\n` +
            `✅ Sisa: ${row.hm_to_next} HM\n\n` +
            `Lihat jadwal PM lengkap:\n${process.env.FRONTEND_URL || 'https://oscarpart.vercel.app'}/monthly-report`
          );
        }

        await logReminder(row.unit_id, row.bundle_id, 'due_soon', row.hm_to_next);
        sent++;
      }
    }

    logger.info(`✅ PM reminders done — sent: ${sent}, skipped (dedup): ${skipped}`);
    return { sent, skipped };

  } catch (err) {
    logger.error('❌ runPmReminders error:', err);
    return { sent, skipped };
  }
}

export default { runPmReminders };

