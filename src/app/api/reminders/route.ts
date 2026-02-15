export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTaskReminder } from "@/lib/email";

// Called by cron (e.g. Vercel Cron, daily) to remind unaccepted tasks after 7 days

export async function GET(request: Request) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let reminders = 0;

  // Catering tasks
  const cateringTasks = await prisma.cateringApproval.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      status: { notIn: ["APPROVED", "REJECTED"] },
    },
    include: {
      assignee: { select: { email: true, name: true, id: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of cateringTasks) {
    if (!task.assignee) continue;
    await sendTaskReminder(task.event.id, task.event.title, "Catering", task.assignee.id, task.assignee.email, task.assignee.name);
    await prisma.cateringApproval.update({ where: { id: task.id }, data: { reminderSentAt: new Date() } });
    reminders++;
  }

  // Room tasks
  const roomTasks = await prisma.roomReservation.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      status: { notIn: ["CONFIRMED", "CANCELLED"] },
    },
    include: {
      assignee: { select: { email: true, name: true, id: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of roomTasks) {
    if (!task.assignee) continue;
    await sendTaskReminder(task.event.id, task.event.title, "Room Reservation", task.assignee.id, task.assignee.email, task.assignee.name);
    await prisma.roomReservation.update({ where: { id: task.id }, data: { reminderSentAt: new Date() } });
    reminders++;
  }

  // Flyer tasks
  const flyerTasks = await prisma.flyerTask.findMany({
    where: {
      assigneeId: { not: null },
      acceptedAt: null,
      reminderSentAt: null,
      createdAt: { lt: oneWeekAgo },
      designStatus: { not: "DONE" },
    },
    include: {
      assignee: { select: { email: true, name: true, id: true } },
      event: { select: { title: true, id: true } },
    },
  });

  for (const task of flyerTasks) {
    if (!task.assignee) continue;
    await sendTaskReminder(task.event.id, task.event.title, "Flyer", task.assignee.id, task.assignee.email, task.assignee.name);
    await prisma.flyerTask.update({ where: { id: task.id }, data: { reminderSentAt: new Date() } });
    reminders++;
  }

  return NextResponse.json({ ok: true, reminders, message: `Sent ${reminders} reminder(s)` });
}
