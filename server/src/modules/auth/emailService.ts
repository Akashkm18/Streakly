import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000,
    });
  }
  return transporter;
}

async function trySendViaResend(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.SMTP_FROM.includes('@') ? env.SMTP_FROM : 'Streakly <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (res.ok) {
      console.log(`[EmailService] Email sent to ${to} via Resend HTTP API`);
      return true;
    }
    const errText = await res.text();
    console.warn(`[EmailService] Resend API returned ${res.status}: ${errText}`);
    return false;
  } catch (err) {
    console.warn(`[EmailService] Resend API fetch failed: ${(err as Error).message}`);
    return false;
  }
}

async function trySendViaBrevo(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<boolean> {
  if (!env.BREVO_API_KEY) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Streakly',
          email: env.SMTP_USER && env.SMTP_USER.includes('@') ? env.SMTP_USER : 'akashguddekowthi@gmail.com',
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });
    if (res.ok) {
      console.log(`[EmailService] Email sent to ${to} via Brevo HTTP API (Port 443)`);
      return true;
    }
    const errText = await res.text();
    console.warn(`[EmailService] Brevo API returned ${res.status}: ${errText}`);
    return false;
  } catch (err) {
    console.warn(`[EmailService] Brevo API fetch failed: ${(err as Error).message}`);
    return false;
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const mailOptions = {
    from: env.SMTP_FROM,
    to: email,
    subject: `Your Streakly Verification Code: ${otp}`,
    text: `Your Streakly password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
            .container { max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
            .code-box { background-color: #27272a; border-radius: 12px; padding: 20px; text-align: center; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #818cf8; margin: 24px 0; font-family: monospace; }
            .note { font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-top: 24px; }
            .footer { font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚡ Streakly</div>
            <h2 style="margin: 0 0 12px; font-size: 20px; color: #fafafa;">Password Reset Code</h2>
            <p style="margin: 0; font-size: 14px; color: #a1a1aa;">
              Use the 6-digit verification code below to reset your password. This code will expire in <strong>10 minutes</strong>.
            </p>
            <div class="code-box">${otp}</div>
            <p class="note">
              Never share this code with anyone. Streakly team members will never ask for your verification code. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Streakly. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  // 1. Try Brevo HTTP API over port 443 (free, sends to any email, unblocked on Render)
  if (env.BREVO_API_KEY) {
    const brevoSuccess = await trySendViaBrevo(email, mailOptions.subject, mailOptions.text, mailOptions.html);
    if (brevoSuccess) return true;
  }

  // 2. Try Resend HTTP API over port 443
  if (env.RESEND_API_KEY) {
    const resendSuccess = await trySendViaResend(email, mailOptions.subject, mailOptions.text, mailOptions.html);
    if (resendSuccess) return true;
  }

  // 3. Try SMTP via Nodemailer (with 4s connection timeout)
  try {
    const t = getTransporter();
    await t.sendMail(mailOptions);
    console.log(`[EmailService] OTP email successfully sent to ${email} via SMTP`);
    return true;
  } catch (err) {
    console.warn(`[EmailService] SMTP send failed (${(err as Error).message}). Simulating email delivery to console:`);
    console.log(`=========================================`);
    console.log(`[SIMULATED EMAIL] To: ${email}`);
    console.log(`[SIMULATED EMAIL] OTP Code: ${otp}`);
    console.log(`=========================================`);
    return false;
  }
}

export async function sendPasswordResetSuccessEmail(email: string): Promise<boolean> {
  const mailOptions = {
    from: env.SMTP_FROM,
    to: email,
    subject: `Your Streakly password was reset successfully`,
    text: `Your Streakly account password has been changed. If you did not make this change, please contact support immediately.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
            .container { max-width: 480px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; margin-bottom: 24px; }
            .footer { font-size: 12px; color: #71717a; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚡ Streakly</div>
            <h2 style="margin: 0 0 12px; font-size: 20px; color: #fafafa;">Password Changed Successfully</h2>
            <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">
              The password for your Streakly account has been successfully updated. All other active sessions have been signed out for your security.
            </p>
            <p style="margin-top: 16px; font-size: 13px; color: #ef4444;">
              If you did not make this change, please reset your password immediately and contact support.
            </p>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Streakly. All rights reserved.
            </div>
          </div>
        </body>
      </html>
    `,
  };

  if (env.BREVO_API_KEY) {
    const brevoSuccess = await trySendViaBrevo(email, mailOptions.subject, mailOptions.text, mailOptions.html);
    if (brevoSuccess) return true;
  }

  if (env.RESEND_API_KEY) {
    const resendSuccess = await trySendViaResend(email, mailOptions.subject, mailOptions.text, mailOptions.html);
    if (resendSuccess) return true;
  }

  try {
    const t = getTransporter();
    await t.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.warn(`[EmailService] Password changed notice email failed to send: ${(err as Error).message}`);
    return false;
  }
}
