import nodemailer from "nodemailer";

// Email is sent over SMTP, which works with Gmail, Resend, Brevo and most providers.
// Set these in .env:
//   SMTP_HOST   e.g. smtp.gmail.com   (Resend: smtp.resend.com)
//   SMTP_PORT   465 (SSL) or 587      (default 465)
//   SMTP_USER   Gmail address          (Resend: "resend")
//   SMTP_PASS   Gmail app password     (Resend: your API key)
//   MAIL_FROM   e.g. "JubJub <you@gmail.com>"  (default: SMTP_USER)
// Without SMTP_HOST, emails aren't sent: they're printed in the server console
// instead, so the reset flow can still be tested locally.

const isConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    console.log(`\n[mailer] SMTP not configured - email not sent. It would have gone to ${to}:`);
    console.log(`Subject: ${subject}\n${text}\n`);
    return;
  }

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};
