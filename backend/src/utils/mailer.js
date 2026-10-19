import nodemailer from 'nodemailer';

// No email service was ever set up in this project before, so this needs
// real SMTP credentials from you to actually send anything - there's no
// way to fabricate a working mail server. See the bottom of this file for
// exactly which environment variables to set and where to get them.
//
// Configured via env vars:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional,
//   defaults to SMTP_USER)
//
// If these aren't set, every function here logs a warning and returns
// without sending - exactly like logTraceabilityEvent's fire-and-forget
// pattern elsewhere in this app. A missing/misconfigured mail server
// should never break checkout itself; the order is real either way.

let _transporter = null;
let _configWarningShown = false;

function getTransporter() {
  if (_transporter) return _transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (!_configWarningShown) {
      console.warn(
        '[mailer] SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS are not fully set - ' +
        'order confirmation emails will be skipped (logged only), not sent. ' +
        'See backend/src/utils/mailer.js for setup instructions.'
      );
      _configWarningShown = true;
    }
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transporter;
}

async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[mailer] (not sent - SMTP not configured) Would have emailed "${subject}" to ${to}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}:`, err.message);
    return false;
  }
}

export async function sendOrderConfirmationEmail(order, buyerEmail, buyerName) {
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-');
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0f766e;">Order Confirmed</h2>
      <p>Hi ${buyerName},</p>
      <p>Your order has been placed. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Order Code</td><td style="padding: 6px 0; font-weight: bold;">${order.orderCode}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Item</td><td style="padding: 6px 0;">${order.materialTitle}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Quantity</td><td style="padding: 6px 0;">${order.quantityKg} kg</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Total</td><td style="padding: 6px 0; font-weight: bold;">LKR ${order.totalAmount.toLocaleString()}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Estimated Delivery</td><td style="padding: 6px 0;">${formatDate(order.estimatedDeliveryDate)}</td></tr>
      </table>
      <p>Use your order code <strong>${order.orderCode}</strong> to track this order on TexCycle AI.</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">TexCycle AI - Sri Lanka Textile Waste Marketplace</p>
    </div>
  `;
  return sendMail({ to: buyerEmail, subject: `Order Confirmed - ${order.orderCode}`, html });
}

export async function sendNewOrderSellerEmail(order, sellerEmail, sellerName) {
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #0f766e;">New Order Received</h2>
      <p>Hi ${sellerName},</p>
      <p>You've received a new order for <strong>${order.materialTitle}</strong> (${order.quantityKg}kg).</p>
      <p>Order code: <strong>${order.orderCode}</strong></p>
      <p>Please log in to your seller dashboard to confirm and fulfill this order.</p>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">TexCycle AI - Sri Lanka Textile Waste Marketplace</p>
    </div>
  `;
  return sendMail({ to: sellerEmail, subject: `New Order - ${order.orderCode}`, html });
}

/*
SETUP INSTRUCTIONS - add these to backend/.env:

  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=youraddress@gmail.com
  SMTP_PASS=your-16-character-app-password
  SMTP_FROM=youraddress@gmail.com

Gmail requires an "App Password", not your normal login password (Google
blocks plain-password SMTP login for security):
  1. Enable 2-Step Verification on the Google account:
     https://myaccount.google.com/security
  2. Generate an App Password:
     https://myaccount.google.com/apppasswords
  3. Use that 16-character password as SMTP_PASS above.

Any other SMTP provider (Outlook, a university email, Resend, Mailgun,
SendGrid's SMTP relay, etc.) works the same way - just swap in that
provider's host/port/credentials.
*/
