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
 * Send an email via Resend. Falls back to console log if no API key.
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
    if (process.env.RESEND_API_KEY) {
      // Resend implementation
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Policy LC Hub <onboarding@resend.dev>",
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[EMAIL] Resend error:", err);
        status = "FAILED";
      } else {
        console.log(`[EMAIL] Sent to ${to}: ${subject}`);
      }
    } else {
      // Console fallback
      console.log("\n" + "=".repeat(60));
      console.log("[EMAIL] No RESEND_API_KEY — logging to console");
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
 * Send task assignment notification to an LC Lead
 */
export async function sendTaskAssignment(
  eventId: string,
  eventTitle: string,
  taskType: string,
  assigneeId: string,
  assigneeEmail: string,
  assigneeName: string,
) {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendEmail({
    to: assigneeEmail,
    subject: `[Assigned] ${taskType} task: ${eventTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00356b; padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0;">New Task Assignment</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Hi ${assigneeName.split(" ")[0]},</p>
          <p>You've been assigned to handle <strong>${taskType}</strong> for:</p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <strong style="font-size: 16px;">${eventTitle}</strong>
          </div>
          <p>Please review the details and accept the task:</p>
          <p><a href="${appUrl}/events/${eventId}" style="display: inline-block; background: #00356b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Task →</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 13px;">Policy Learning Community · Yale School of the Environment</p>
        </div>
      </div>
    `,
    reason: "TASK_ASSIGNMENT",
    eventId,
    recipientId: assigneeId,
    dedupeKey: `task_assign:${eventId}:${taskType}:${assigneeId}`,
  });
}

/**
 * Send catering approval request email to all FINANCE users
 */
export async function sendApprovalRequest(eventId: string, eventTitle: string) {
  const { generateActionToken } = await import("@/lib/tokens");

  const financeUsers = await prisma.user.findMany({
    where: { role: "FINANCE", deletedAt: null },
  });

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Get catering details for the email
  const catering = await prisma.cateringApproval.findUnique({
    where: { eventId },
    select: { vendor: true, estimatedCost: true, menuDetails: true, headcount: true },
  });

  for (const user of financeUsers) {
    // Generate action tokens for this user
    const approveToken = await generateActionToken(eventId, user.id, "APPROVE");
    const rejectToken = await generateActionToken(eventId, user.id, "REJECT");
    const changesToken = await generateActionToken(eventId, user.id, "CHANGES_REQUESTED");

    const approveUrl = `${appUrl}/api/actions?token=${approveToken}`;
    const rejectUrl = `${appUrl}/api/actions?token=${rejectToken}`;
    const changesUrl = `${appUrl}/api/actions?token=${changesToken}`;

    await sendEmail({
      to: user.email,
      subject: `[Action Required] Catering approval: ${eventTitle}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #00356b; padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">🍽️ Catering Approval Request</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi ${user.name.split(" ")[0]},</p>
            <p>A catering request for <strong>${eventTitle}</strong> needs your approval.</p>
            
            ${catering ? `
            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                ${catering.vendor ? `<tr><td style="padding: 4px 0; color: #6b7280;">Vendor</td><td style="padding: 4px 0; font-weight: 600;">${catering.vendor}</td></tr>` : ""}
                ${catering.estimatedCost ? `<tr><td style="padding: 4px 0; color: #6b7280;">Estimated Cost</td><td style="padding: 4px 0; font-weight: 600;">$${catering.estimatedCost.toFixed(2)}</td></tr>` : ""}
                ${catering.headcount ? `<tr><td style="padding: 4px 0; color: #6b7280;">Headcount</td><td style="padding: 4px 0; font-weight: 600;">${catering.headcount} people</td></tr>` : ""}
                ${catering.menuDetails ? `<tr><td style="padding: 4px 0; color: #6b7280;">Menu</td><td style="padding: 4px 0;">${catering.menuDetails}</td></tr>` : ""}
              </table>
            </div>
            ` : ""}

            <p style="font-weight: 600; margin-bottom: 12px;">Take action:</p>
            <div style="margin: 16px 0;">
              <a href="${approveUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 8px;">✅ Approve</a>
              <a href="${changesUrl}" style="display: inline-block; background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 8px;">🔄 Request Changes</a>
              <a href="${rejectUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">❌ Reject</a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">Or <a href="${appUrl}/events/${eventId}" style="color: #00356b;">review in the app →</a></p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 13px;">Policy Learning Community · Yale School of the Environment</p>
            <p style="color: #9ca3af; font-size: 11px;">These action links expire in 72 hours.</p>
          </div>
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
 * Send payment request to PAYMENT_ADMIN users
 */
export async function sendPaymentRequest(eventId: string, eventTitle: string) {
  const paymentAdmins = await prisma.user.findMany({
    where: { role: { in: ["PAYMENT_ADMIN", "FINANCE"] }, deletedAt: null },
  });

  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  for (const user of paymentAdmins) {
    await sendEmail({
      to: user.email,
      subject: `[Payment Required] ${eventTitle}`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #00356b; padding: 24px; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">💳 Payment Request</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi ${user.name.split(" ")[0]},</p>
            <p>An approved catering order for <strong>${eventTitle}</strong> is ready for payment processing.</p>
            <p><a href="${appUrl}/events/${eventId}" style="display: inline-block; background: #00356b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Process Payment →</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #6b7280; font-size: 13px;">Policy Learning Community · Yale School of the Environment</p>
          </div>
        </div>
      `,
      reason: "PAYMENT_REQUEST",
      eventId,
      recipientId: user.id,
      dedupeKey: `payment_request:${eventId}:${user.id}`,
    });
  }
}

/**
 * Send task reminder for unaccepted tasks
 */
export async function sendTaskReminder(
  eventId: string,
  eventTitle: string,
  taskType: string,
  assigneeId: string,
  assigneeEmail: string,
  assigneeName: string,
) {
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  await sendEmail({
    to: assigneeEmail,
    subject: `[Reminder] ${taskType} task still pending: ${eventTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #b45309; padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0;">⏰ Task Reminder</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Hi ${assigneeName.split(" ")[0]},</p>
          <p>You were assigned to handle <strong>${taskType}</strong> for <strong>${eventTitle}</strong> over a week ago, but the task hasn't been accepted yet.</p>
          <p>Please review and accept the task as soon as possible:</p>
          <p><a href="${appUrl}/events/${eventId}" style="display: inline-block; background: #b45309; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Task →</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 13px;">Policy Learning Community · Yale School of the Environment</p>
        </div>
      </div>
    `,
    reason: "TASK_REMINDER",
    eventId,
    recipientId: assigneeId,
    dedupeKey: `task_reminder:${eventId}:${taskType}:${assigneeId}`,
  });
}
