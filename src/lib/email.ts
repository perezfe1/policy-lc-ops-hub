import { prisma } from "@/lib/db";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  reason: string;
  eventId?: string;
  recipientId?: string;
  dedupeKey?: string;
}

/**
 * Send an email. If no email provider is configured, logs to console.
 * Implements deduplication via dedupeKey.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, html, reason, eventId, recipientId, dedupeKey } = params;

  // Check deduplication
  if (dedupeKey) {
    const existing = await prisma.emailLog.findFirst({
      where: { dedupeKey, sentAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
    if (existing) {
      console.log(`[EMAIL] Dedupe blocked: ${dedupeKey}`);
      return false;
    }
  }

  let status = "SENT";

  try {
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid implementation
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.EMAIL_FROM || "noreply@policylc.yale.edu" },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      if (!res.ok) status = "FAILED";
    } else {
      // Console fallback - no email provider configured
      console.log("\n" + "=".repeat(60));
      console.log("[EMAIL] No provider configured — logging to console");
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Reason: ${reason}`);
      console.log("=".repeat(60) + "\n");
    }
  } catch (err) {
    console.error("[EMAIL] Send failed:", err);
    status = "FAILED";
  }

  // Log to database
  await prisma.emailLog.create({
    data: { toEmail: to, subject, reason, status, eventId, recipientId, dedupeKey },
  });

  return status === "SENT";
}

/**
 * Send catering approval request email to all FINANCE users
 */
export async function sendApprovalRequest(eventId: string, eventTitle: string) {
  const financeUsers = await prisma.user.findMany({
    where: { role: "FINANCE", deletedAt: null },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  for (const user of financeUsers) {
    await sendEmail({
      to: user.email,
      subject: `[Action Required] Catering approval: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #00356b;">Catering Approval Request</h2>
          <p>A catering request for <strong>${eventTitle}</strong> needs your review.</p>
          <p><a href="${appUrl}/events/${eventId}" style="display: inline-block; background: #00356b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review Request →</a></p>
          <p style="color: #6b7280; font-size: 14px;">Policy Learning Community Ops Hub</p>
        </div>
      `,
      reason: "APPROVAL_REQUEST",
      eventId,
      recipientId: user.id,
      dedupeKey: `approval_request:${eventId}:AWAITING_APPROVAL:${user.id}`,
    });
  }
}

/**
 * Send payment request notification
 */
export async function sendPaymentRequest(eventId: string, eventTitle: string) {
  const financeUsers = await prisma.user.findMany({
    where: { role: "FINANCE", deletedAt: null },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  for (const user of financeUsers) {
    await sendEmail({
      to: user.email,
      subject: `[Payment Request] ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #00356b;">Payment Request</h2>
          <p>An approved catering order for <strong>${eventTitle}</strong> is ready for payment.</p>
          <p><a href="${appUrl}/events/${eventId}" style="display: inline-block; background: #00356b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Details →</a></p>
          <p style="color: #6b7280; font-size: 14px;">Policy Learning Community Ops Hub</p>
        </div>
      `,
      reason: "PAYMENT_REQUEST",
      eventId,
      recipientId: user.id,
      dedupeKey: `payment_request:${eventId}:${user.id}`,
    });
  }
}
