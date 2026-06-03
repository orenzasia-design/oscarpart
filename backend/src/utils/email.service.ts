import { Resend } from 'resend';

const resend = new Resend('re_PHFWPCkY_FLUoA9CMdfLcSMPxqJBf5Deq');

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
          <tr>
            <th style="border:1px solid #ddd; padding:8px">Part Number</th>
            <th style="border:1px solid #ddd; padding:8px">Deskripsi</th>
            <th style="border:1px solid #ddd; padding:8px">Qty</th>
          </tr>
        </thead>
        <tbody>${partRows}</tbody>
      </table>
      <p>Tim kami akan segera memproses dan menghubungi Anda kembali.</p>
      <hr>
      <small>Email ini dikirim otomatis, mohon tidak membalas.</small>
    `;

    const { error } = await resend.emails.send({
      from: 'OscarPart <onboarding@resend.dev>',
      to: customerEmail,
      subject: `Konfirmasi RFQ #${rfqNumber}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return false;
    }

    console.log(`Email sent for RFQ ${rfqNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
