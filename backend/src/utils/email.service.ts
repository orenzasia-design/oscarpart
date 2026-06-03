import nodemailer from 'nodemailer';

// Ganti dengan email dan app password Anda
const EMAIL_USER = 'orenzasia@gmail.com';
const EMAIL_PASS = 'obdxnveyoscodywj';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

export async function sendRFQConfirmationEmail(
  customerEmail: string,
  customerName: string,
  rfqNumber: string,
  partList: Array<{ partNumber: string; description: string; quantity: number }>
): Promise<boolean> {
  try {
    const partRows = partList.map(part => `
      <tr>
        <td style="border:1px solid #ddd; padding:8px">${part.partNumber}</td>
        <td style="border:1px solid #ddd; padding:8px">${part.description}</td>
        <td style="border:1px solid #ddd; padding:8px; text-align:center">${part.quantity}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <h2>Terima kasih, ${customerName}!</h2>
      <p>RFQ Anda dengan nomor <strong>${rfqNumber}</strong> telah kami terima.</p>
      <p>Berikut detail part yang Anda minta:</p>
      <table style="border-collapse:collapse; width:100%">
        <thead>
          <tr><th style="border:1px solid #ddd; padding:8px">Part Number</th><th style="border:1px solid #ddd; padding:8px">Deskripsi</th><th style="border:1px solid #ddd; padding:8px">Qty</th></tr>
        </thead>
        <tbody>${partRows}</tbody>
       </table>
      <p>Tim kami akan segera memproses dan menghubungi Anda kembali.</p>
      <hr>
      <small>Email ini dikirim otomatis, mohon tidak membalas.</small>
    `;

    const info = await transporter.sendMail({
      from: `"OscarPart" <${EMAIL_USER}>`,
      to: customerEmail,
      subject: `Konfirmasi RFQ #${rfqNumber}`,
      html: htmlContent,
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
