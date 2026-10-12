import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Create a Gmail SMTP transporter using App Password credentials.
 * Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file.
 * Generate an App Password at: https://myaccount.google.com/apppasswords
 */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER?.trim(),
      pass: env.GMAIL_APP_PASSWORD ? env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') : undefined,
    },
  });
}

/**
 * Send the password reset OTP to the user's Gmail.
 */
export async function sendPasswordResetOtp(
  toEmail: string,
  userName: string,
  otp: string
): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    // Development fallback: just log the OTP to console
    logger.warn(`[Email] Gmail not configured. OTP for ${toEmail}: ${otp}`);
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"FarmLink 🌿" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Your FarmLink Password Reset Code',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FarmLink Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <span style="font-size:28px;">🌿</span>
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">FarmLink</span>
              </div>
              <p style="color:#bbf7d0;font-size:13px;margin:6px 0 0;font-weight:500;">Farm-to-Consumer Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Password Reset Request</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Hi <strong style="color:#111827;">${userName}</strong>,<br/>
                We received a request to reset the password for your FarmLink account. Use the code below to continue.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#16a34a;">Your Reset Code</p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#15803d;font-family:'Courier New',monospace;">${otp}</div>
                <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">⏱ Valid for <strong>15 minutes</strong></p>
              </div>

              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 16px;">
                Enter this code on the password reset page to create your new password.
                If you did not request a password reset, please ignore this email — your account is safe.
              </p>

              <div style="background:#fef3c7;border-left:3px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  🔒 <strong>Never share this code</strong> with anyone. FarmLink will never ask for your OTP via call or message.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 FarmLink · Farm-to-Consumer Marketplace</p>
              <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">This is an automated security email. Please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`[Email] Password reset OTP sent successfully to ${toEmail}`);
  } catch (err) {
    logger.error(`[Email] Failed to send OTP to ${toEmail}:`, err);
    // Don't throw — we still saved the OTP in DB. Log the error and continue.
    // In production, integrate a retry queue here.
    throw new Error('Failed to send email. Please try again or contact support.');
  }
}

/**
 * Send a registration verification OTP email.
 */
export async function sendVerificationOtp(
  toEmail: string,
  userName: string,
  otp: string
): Promise<void> {
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    logger.warn(`[Email] Gmail not configured. Verification OTP for ${toEmail}: ${otp}`);
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"FarmLink 🌿" <${env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your FarmLink account',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify FarmLink Account</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <span style="font-size:28px;">🌿</span>
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">FarmLink</span>
              </div>
              <p style="color:#bbf7d0;font-size:13px;margin:6px 0 0;font-weight:500;">Farm-to-Consumer Marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome to FarmLink! 🎉</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Hi <strong style="color:#111827;">${userName}</strong>,<br/>
                You're almost there! Use the code below to verify your email address and activate your account.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#16a34a;">Verification Code</p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#15803d;font-family:'Courier New',monospace;">${otp}</div>
                <p style="margin:10px 0 0;font-size:12px;color:#6b7280;">⏱ Valid for <strong>15 minutes</strong></p>
              </div>

              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 16px;">
                If you didn't create a FarmLink account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© 2025 FarmLink · Farm-to-Consumer Marketplace</p>
              <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">This is an automated security email. Please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`[Email] Verification OTP sent successfully to ${toEmail}`);
  } catch (err) {
    logger.error(`[Email] Failed to send verification OTP to ${toEmail}:`, err);
    throw new Error('Failed to send verification email. Please try again.');
  }
}
