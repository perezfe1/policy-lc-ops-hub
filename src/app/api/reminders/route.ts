import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This route is designed to be called by a cron job (e.g., Vercel Cron, daily)
// It checks for tasks assigned > 7 days ago that haven't been accepted or completed,
// and sends reminder emails to the assigned LC Leads.

export async function GET(request: Request) {
  // Optional: verify cron secret
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let reminders = 0;

  // Check catering tasks
  const cateringTasks = await prisma.cateringApproval.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      status: { notIn: ["APPROVED", "REJECTED"] },
    },
    include: {
      assignee: { select: { email: true, name: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of cateringTasks) {
    if (!task.assignee) continue;
    await prisma.emailLog.create({
      data: {
        eventId: task.event.id,
        recipientId: task.assigneeId!,
        toEmail: task.assignee.email,
        subject: `Reminder: Catering task for "${task.event.title}" needs your attention`,
        reason: "TASK_REMINDER",
        status: "SENT",
      },
    });
    await prisma.cateringApproval.update({
      where: { id: task.id },
      data: { reminderSentAt: new Date() },
    });
    reminders++;
    console.log(`📧 Reminder sent to ${task.assignee.email} for catering: ${task.event.title}`);
  }

  // Check room tasks
  const roomTasks = await prisma.roomReservation.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      status: { notIn: ["CONFIRMED", "CANCELLED"] },
    },
    include: {
      assignee: { select: { email: true, name: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of roomTasks) {
    if (!task.assignee) continue;
    await prisma.emailLog.create({
      data: {
        eventId: task.event.id,
        recipientId: task.assigneeId!,
        toEmail: task.assignee.email,
        subject: `Reminder: Room reservation for "${task.event.title}" needs your attention`,
        reason: "TASK_REMINDER",
        status: "SENT",
      },
    });
    await prisma.roomReservation.update({
      where: { id: task.id },
      data: { reminderSentAt: new Date() },
    });
    reminders++;
    console.log(`📧 Reminder sent to ${task.assignee.email} for room: ${task.event.title}`);
  }

  // Check flyer tasks
  const flyerTasks = await prisma.flyerTask.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      designStatus: { not: "DONE" },
    },
    include: {
      assignee: { select: { email: true, name: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of flyerTasks) {
    if (!task.assignee) continue;
    await prisma.emailLog.create({
      data: {
        eventId: task.event.id,
        recipientId: task.assigneeId!,
        toEmail: task.assignee.email,
        subject: `Reminder: Flyer task for "${task.event.title}" needs your attention`,
        reason: "TASK_REMINDER",
        status: "SENT",
      },
    });
    await prisma.flyerTask.update({
      where: { id: task.id },
      data: { reminderSentAt: new Date() },
    });
    reminders++;
    console.log(`📧 Reminder sent to ${task.assignee.email} for flyer: ${task.event.title}`);
  }

  return NextResponse.json({
    ok: true,
    reminders,
    message: `Sent ${reminders} reminder(s)`,
  });
}
