/**
 * services/email/templates.ts
 *
 * All HTML email templates for SlotPlay.
 * Returns full HTML string — no external template engine needed.
 * Inlined styles for email client compatibility.
 */

const BASE_STYLES = `
  body{margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;}
  .wrap{max-width:600px;margin:0 auto;padding:32px 16px;}
  .card{background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);}
  .header{background:#16a34a;padding:28px 32px;text-align:center;}
  .header-logo{color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.5px;text-decoration:none;}
  .header-logo span{color:#bbf7d0;}
  .body{padding:32px;}
  .h1{font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;}
  .sub{font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.5;}
  .btn{display:inline-block;background:#16a34a;color:#ffffff!important;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;margin:4px 0;}
  .btn-outline{display:inline-block;border:2px solid #16a34a;color:#16a34a!important;font-weight:700;font-size:15px;padding:12px 26px;border-radius:8px;text-decoration:none;}
  .otp-box{background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;}
  .otp-code{font-size:40px;font-weight:900;letter-spacing:8px;color:#15803d;font-family:'Courier New',monospace;}
  .otp-expiry{font-size:13px;color:#6b7280;margin:8px 0 0;}
  .info-table{width:100%;border-collapse:collapse;margin:20px 0;}
  .info-table td{padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;}
  .info-table td:first-child{color:#6b7280;width:40%;}
  .info-table td:last-child{font-weight:600;color:#111827;}
  .amount-box{background:#f0fdf4;border-radius:8px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin:20px 0;}
  .amount-label{font-size:14px;color:#6b7280;}
  .amount-value{font-size:28px;font-weight:900;color:#16a34a;}
  .divider{height:1px;background:#f3f4f6;margin:24px 0;}
  .footer{text-align:center;padding:24px 16px;color:#9ca3af;font-size:12px;line-height:1.6;}
  .badge{display:inline-block;background:#dcfce7;color:#15803d;font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;}
  .alert-red{background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:4px;margin:16px 0;font-size:14px;color:#991b1b;}
  .alert-yellow{background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:16px 0;font-size:14px;color:#92400e;}
`;

function base(content: string, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SlotPlay</title>
<style>${BASE_STYLES}</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;</div>` : ''}
<div class="wrap">
  <div class="card">
    <div class="header">
      <a href="https://slotplay.in" class="header-logo">Slot<span>Play</span></a>
    </div>
    <div class="body">${content}</div>
  </div>
  <div class="footer">
    <p>SlotPlay Technologies Pvt Ltd · Reserve Your Game</p>
    <p>If you didn't request this email, you can safely ignore it.</p>
  </div>
</div>
</body></html>`;
}

// ── Welcome ───────────────────────────────────────────────────────────────────
export function welcomeTemplate(name: string) {
  return base(`
    <p class="h1">Welcome to SlotPlay, ${name}! 🎉</p>
    <p class="sub">You're all set to start booking sports venues near you. Real-time slots, digital tickets — no more WhatsApp calls.</p>
    <a href="https://slotplay.in/venues" class="btn">Browse turfs now →</a>
    <div class="divider"></div>
    <p style="font-size:14px;color:#6b7280;">Questions? Just reply to this email and we'll help you out.</p>
  `, 'Welcome to SlotPlay — Reserve Your Game');
}

// ── Email Verification ────────────────────────────────────────────────────────
export function verificationTemplate(name: string, otp: string) {
  return base(`
    <p class="h1">Verify your email</p>
    <p class="sub">Hi ${name}, enter this code to verify your SlotPlay account.</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏱ Expires in 10 minutes</div>
    </div>
    <p style="font-size:13px;color:#6b7280;">Never share this code with anyone. SlotPlay will never ask for it.</p>
  `, `Your SlotPlay verification code is ${otp}`);
}

// ── Password Reset ────────────────────────────────────────────────────────────
export function passwordResetTemplate(name: string, otp: string) {
  return base(`
    <p class="h1">Reset your password</p>
    <p class="sub">Hi ${name}, use this code to reset your SlotPlay password.</p>
    <div class="otp-box" style="border-color:#fca5a5;background:#fef2f2;">
      <div class="otp-code" style="color:#dc2626;">${otp}</div>
      <div class="otp-expiry">⏱ Expires in 10 minutes</div>
    </div>
    <div class="alert-red">If you didn't request a password reset, secure your account immediately.</div>
  `, 'Reset your SlotPlay password');
}

// ── Booking Confirmation ──────────────────────────────────────────────────────
export function bookingConfirmationTemplate(
  name: string,
  d: { bookingRef: string; venueName: string; address: string; date: string; startTime: string; endTime: string; amount: number; upiId?: string },
) {
  return base(`
    <p class="h1">Booking confirmed! ✅</p>
    <p class="sub">Hi ${name}, your slot is locked in. Pay via UPI to get your final QR ticket.</p>
    <div class="badge">Ref: ${d.bookingRef}</div>
    <table class="info-table">
      <tr><td>Venue</td><td>${d.venueName}</td></tr>
      <tr><td>Address</td><td>${d.address}</td></tr>
      <tr><td>Date</td><td>${d.date}</td></tr>
      <tr><td>Time</td><td>${d.startTime} – ${d.endTime}</td></tr>
    </table>
    <div class="amount-box">
      <span class="amount-label">Amount due</span>
      <span class="amount-value">₹${d.amount}</span>
    </div>
    ${d.upiId ? `<p style="font-size:14px;color:#374151;"><strong>Pay to:</strong> <code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;">${d.upiId}</code></p>` : ''}
    <a href="https://slotplay.in/bookings" class="btn">View booking →</a>
    <div class="alert-yellow">Upload your payment screenshot on SlotPlay to confirm your booking.</div>
  `, `Booking confirmed for ${d.venueName}`);
}

// ── Payment Submitted (to owner) ──────────────────────────────────────────────
export function paymentSubmittedOwnerTemplate(
  ownerName: string,
  d: { bookingRef: string; userName: string; userEmail: string; venueName: string; amount: number; utrNumber: string },
) {
  return base(`
    <p class="h1">New payment to verify 💰</p>
    <p class="sub">Hi ${ownerName}, a customer has submitted payment for a slot at ${d.venueName}.</p>
    <table class="info-table">
      <tr><td>Customer</td><td>${d.userName} (${d.userEmail})</td></tr>
      <tr><td>Booking ref</td><td>${d.bookingRef}</td></tr>
      <tr><td>UTR Number</td><td><strong>${d.utrNumber}</strong></td></tr>
      <tr><td>Amount</td><td>₹${d.amount}</td></tr>
    </table>
    <a href="https://slotplay.in/owner/verifications" class="btn">Verify payment →</a>
    <p style="font-size:13px;color:#6b7280;">Verify within 24 hours to confirm the customer's booking.</p>
  `, `Payment submitted for ${d.bookingRef} — verify now`);
}

// ── Payment Approved (to user) ────────────────────────────────────────────────
export function paymentApprovedTemplate(
  name: string,
  d: { bookingRef: string; venueName: string; date: string; startTime: string; endTime: string; amount: number },
) {
  return base(`
    <p class="h1">Payment verified — you're in! 🎉</p>
    <p class="sub">Hi ${name}, your payment has been verified. Show your QR ticket at the venue.</p>
    <div class="badge" style="background:#dcfce7;color:#15803d;">✓ CONFIRMED</div>
    <table class="info-table">
      <tr><td>Venue</td><td>${d.venueName}</td></tr>
      <tr><td>Date</td><td>${d.date}</td></tr>
      <tr><td>Time</td><td>${d.startTime} – ${d.endTime}</td></tr>
      <tr><td>Amount paid</td><td>₹${d.amount}</td></tr>
      <tr><td>Ref</td><td>${d.bookingRef}</td></tr>
    </table>
    <a href="https://slotplay.in/bookings" class="btn">Download your ticket →</a>
  `, `Your slot at ${d.venueName} is confirmed!`);
}

// ── Payment Rejected (to user) ────────────────────────────────────────────────
export function paymentRejectedTemplate(
  name: string,
  d: { bookingRef: string; venueName: string; reason?: string },
) {
  return base(`
    <p class="h1">Payment could not be verified ❌</p>
    <p class="sub">Hi ${name}, unfortunately your payment for <strong>${d.venueName}</strong> (ref: ${d.bookingRef}) could not be verified.</p>
    ${d.reason ? `<div class="alert-red"><strong>Reason:</strong> ${d.reason}</div>` : ''}
    <p style="font-size:14px;color:#374151;">Please retry with a clear screenshot and valid UTR number.</p>
    <a href="https://slotplay.in/bookings/${d.bookingRef}" class="btn">Retry payment →</a>
    <div class="divider"></div>
    <p style="font-size:13px;color:#6b7280;">Need help? Reply to this email or contact the venue owner directly.</p>
  `, `Payment verification failed for ${d.bookingRef}`);
}

// ── Booking Cancelled ─────────────────────────────────────────────────────────
export function bookingCancelledTemplate(
  name: string,
  d: { bookingRef: string; venueName: string; date: string },
) {
  return base(`
    <p class="h1">Booking cancelled</p>
    <p class="sub">Hi ${name}, your booking has been cancelled.</p>
    <table class="info-table">
      <tr><td>Venue</td><td>${d.venueName}</td></tr>
      <tr><td>Date</td><td>${d.date}</td></tr>
      <tr><td>Ref</td><td>${d.bookingRef}</td></tr>
    </table>
    <a href="https://slotplay.in/venues" class="btn">Book another slot →</a>
  `, `Booking ${d.bookingRef} cancelled`);
}
