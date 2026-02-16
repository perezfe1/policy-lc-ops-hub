export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPaymentRequest } from "@/lib/email";
import crypto from "crypto";

// Handle one-click email actions (approve/reject via token link)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // Look up the action token
  const actionToken = await prisma.actionToken.findUnique({
    where: { token },
    include: { user: true, event: true },
  });

  if (!actionToken) {
    return htmlResponse("Invalid Link", "This action link is invalid or has already been used.", appUrl);
  }

  if (actionToken.usedAt) {
    return htmlResponse("Already Used", "This action has already been processed.", appUrl);
  }

  if (actionToken.expiresAt < new Date()) {
    return htmlResponse("Link Expired", "This action link has expired. Please log in to the app to take action.", appUrl);
  }

  // Mark token as used
  await prisma.actionToken.update({
    where: { id: actionToken.id },
    data: { usedAt: new Date() },
  });

  const eventId = actionToken.eventId;
  const eventTitle = actionToken.event.title;

  try {
    if (actionToken.type === "APPROVE") {
      await prisma.cateringApproval.update({
        where: { eventId },
        data: {
          status: "APPROVED",
          decidedAt: new Date(),
          decidedById: actionToken.userId,
        },
      });

      // Auto-trigger payment request to Cristina
      await sendPaymentRequest(eventId, eventTitle);

      return htmlResponse(
        "✅ Approved!",
        `Catering for <strong>${eventTitle}</strong> has been approved. A payment request has been automatically sent to the payment admin.`,
        appUrl,
        eventId,
      );
    }

    if (actionToken.type === "REJECT") {
      await prisma.cateringApproval.update({
        where: { eventId },
        data: {
          status: "REJECTED",
          decidedAt: new Date(),
          decidedById: actionToken.userId,
        },
      });

      return htmlResponse(
        "❌ Rejected",
        `Catering for <strong>${eventTitle}</strong> has been rejected. The event champion will be notified.`,
        appUrl,
        eventId,
      );
    }

    if (actionToken.type === "CHANGES_REQUESTED") {
      await prisma.cateringApproval.update({
        where: { eventId },
        data: {
          status: "CHANGES_REQUESTED",
          decidedAt: new Date(),
          decidedById: actionToken.userId,
          revisionCount: { increment: 1 },
        },
      });

      return htmlResponse(
        "🔄 Changes Requested",
        `You've requested changes for <strong>${eventTitle}</strong>. The event champion will revise and resubmit.`,
        appUrl,
        eventId,
      );
    }
  } catch (error) {
    console.error("[ACTION] Error processing token:", error);
    return htmlResponse("Error", "Something went wrong processing this action. Please try again in the app.", appUrl);
  }

  return htmlResponse("Unknown Action", "This action type is not recognized.", appUrl);
}

function htmlResponse(title: string, message: string, appUrl: string, eventId?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title} — Policy LC Ops Hub</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
        .card { background: white; border-radius: 16px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { font-size: 28px; margin: 0 0 16px; color: #111827; }
        p { color: #4b5563; line-height: 1.6; margin: 0 0 24px; }
        a.btn { display: inline-block; background: #00356b; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .footer { color: #9ca3af; font-size: 13px; margin-top: 32px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
        ${eventId ? `<a class="btn" href="${appUrl}/events/${eventId}">View Event →</a>` : `<a class="btn" href="${appUrl}">Go to Dashboard →</a>`}
        <p class="footer">Policy Learning Community · Yale School of the Environment</p>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
