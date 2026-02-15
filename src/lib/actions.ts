"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendApprovalRequest, sendPaymentRequest, sendTaskAssignment, sendTaskReminder } from "@/lib/email";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/constants";

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session;
}

// ─── EVENTS ────────────────────────────────────────

export async function createEvent(formData: FormData) {
  const session = await getSession();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const location = formData.get("location") as string;
  const semester = formData.get("semester") as string;
  const tags = formData.getAll("tags").join(",");
  const budgetAmount = parseFloat(formData.get("budgetAmount") as string) || null;

  // Event format
  const format = formData.get("format") as string || "in_person";
  const isVirtual = format === "virtual";
  const isHybrid = format === "hybrid";
  const isOnCampus = format !== "virtual";
  const virtualLink = formData.get("virtualLink") as string;

  // Speaker
  const speakerName = formData.get("speakerName") as string;
  const speakerEmail = formData.get("speakerEmail") as string;
  const speakerPhone = formData.get("speakerPhone") as string;
  const speakerOrg = formData.get("speakerOrg") as string;

  // Point of Contact
  const pocName = formData.get("pocName") as string;
  const pocEmail = formData.get("pocEmail") as string;
  const pocPhone = formData.get("pocPhone") as string;

  // Catering fields
  const hasCatering = formData.get("hasCatering") === "true";
  const cateringVendor = formData.get("cateringVendor") as string;
  const cateringCost = parseFloat(formData.get("cateringCost") as string) || 0;
  const cateringMenu = formData.get("cateringMenu") as string;
  const cateringDietary = formData.get("cateringDietary") as string;
  const cateringHeadcount = parseInt(formData.get("cateringHeadcount") as string) || 0;
  const ezCaterLink = formData.get("ezCaterLink") as string;

  // Room fields
  const hasRoom = formData.get("hasRoom") === "true";
  const roomName = formData.get("roomName") as string;

  // Flyer fields
  const hasFlyer = formData.get("hasFlyer") === "true";

  // Find current academic year
  const currentAY = await prisma.academicYear.findFirst({ where: { isCurrent: true } });

  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      date: new Date(date),
      time: time || null,
      location: location || null,
      semester: semester || null,
      isOnCampus,
      isVirtual,
      isHybrid,
      virtualLink: virtualLink || null,
      tags,
      budgetAmount,
      speakerName: speakerName || null,
      speakerEmail: speakerEmail || null,
      speakerPhone: speakerPhone || null,
      speakerOrg: speakerOrg || null,
      pocName: pocName || null,
      pocEmail: pocEmail || null,
      pocPhone: pocPhone || null,
      createdById: session.user.id,
      academicYearId: currentAY?.id || null,
      status: "DRAFT",
      ...(hasCatering && {
        catering: {
          create: {
            vendor: cateringVendor || null,
            estimatedCost: cateringCost || null,
            menuDetails: cateringMenu || null,
            dietaryNotes: cateringDietary || null,
            headcount: cateringHeadcount || null,
            ezCaterLink: ezCaterLink || null,
          },
        },
      }),
      ...(hasRoom && {
        room: {
          create: {
            roomName: roomName || null,
            status: "PENDING",
          },
        },
      }),
      ...(hasFlyer && {
        flyer: {
          create: {
            designStatus: "NOT_STARTED",
          },
        },
      }),
      dayOfChecklist: {
        create: {
          items: {
            create: DEFAULT_CHECKLIST_ITEMS.map((label, i) => ({
              label,
              sortOrder: i,
              isCustom: false,
            })),
          },
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}

export async function updateEventStatus(eventId: string, newStatus: string) {
  await getSession();
  await prisma.event.update({ where: { id: eventId }, data: { status: newStatus } });
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

export async function updateEvent(eventId: string, formData: FormData) {
  await getSession();

  const data: Record<string, any> = {};
  const fields = [
    "title", "description", "time", "location", "semester",
    "speakerName", "speakerEmail", "speakerPhone", "speakerOrg",
    "pocName", "pocEmail", "pocPhone", "virtualLink",
  ];
  for (const f of fields) {
    const val = formData.get(f) as string;
    if (val !== null) data[f] = val || null;
  }

  const date = formData.get("date") as string;
  if (date) data.date = new Date(date);

  const format = formData.get("format") as string;
  if (format) {
    data.isVirtual = format === "virtual";
    data.isHybrid = format === "hybrid";
    data.isOnCampus = format !== "virtual";
  }

  const tags = formData.getAll("tags");
  if (tags.length > 0) data.tags = tags.join(",");

  const status = formData.get("status") as string;
  if (status) data.status = status;

  const headcount = formData.get("headcount") as string;
  if (headcount) data.headcount = parseInt(headcount) || null;

  const budgetAmount = formData.get("budgetAmount") as string;
  if (budgetAmount !== null && budgetAmount !== undefined) {
    data.budgetAmount = parseFloat(budgetAmount) || null;
  }

  await prisma.event.update({ where: { id: eventId }, data });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/");
}

export async function updateRetrospective(eventId: string, formData: FormData) {
  await getSession();

  const doAgain = formData.get("doAgain");
  const reinviteSpeaker = formData.get("reinviteSpeaker");
  const retrospectiveNotes = formData.get("retrospectiveNotes") as string;
  const headcount = formData.get("headcount") as string;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      doAgain: doAgain === "true" ? true : doAgain === "false" ? false : null,
      reinviteSpeaker: reinviteSpeaker === "true" ? true : reinviteSpeaker === "false" ? false : null,
      retrospectiveNotes: retrospectiveNotes || null,
      headcount: headcount ? parseInt(headcount) : null,
      status: "COMPLETED",
    },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

export async function archiveEvent(eventId: string) {
  await getSession();
  await prisma.event.update({ where: { id: eventId }, data: { status: "ARCHIVED" } });
  revalidatePath("/events");
  revalidatePath("/archive");
  revalidatePath("/");
}

// ─── CATERING APPROVAL ─────────────────────────────

export async function submitForApproval(eventId: string) {
  const session = await getSession();

  const approval = await prisma.cateringApproval.findUnique({ where: { eventId } });
  if (!approval) throw new Error("No catering request found");

  await prisma.cateringApproval.update({
    where: { eventId },
    data: {
      status: "AWAITING_APPROVAL",
      submittedAt: new Date(),
      revisionCount: { increment: approval.status === "CHANGES_REQUESTED" ? 1 : 0 },
    },
  });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event) await sendApprovalRequest(eventId, event.title);

  revalidatePath(`/events/${eventId}`);
}

export async function decideCatering(eventId: string, formData: FormData) {
  const session = await getSession();
  const decision = formData.get("decision") as string; // APPROVED, REJECTED, CHANGES_REQUESTED
  const changeNotes = formData.get("changeNotes") as string;

  await prisma.cateringApproval.update({
    where: { eventId },
    data: {
      status: decision,
      decidedAt: new Date(),
      decidedById: session.user.id,
      changeNotes: decision === "CHANGES_REQUESTED" ? changeNotes : null,
    },
  });

  revalidatePath(`/events/${eventId}`);
}

export async function updateCateringDetails(eventId: string, formData: FormData) {
  await getSession();

  await prisma.cateringApproval.update({
    where: { eventId },
    data: {
      vendor: (formData.get("vendor") as string) || null,
      estimatedCost: parseFloat(formData.get("estimatedCost") as string) || null,
      actualCost: parseFloat(formData.get("actualCost") as string) || null,
      menuDetails: (formData.get("menuDetails") as string) || null,
      dietaryNotes: (formData.get("dietaryNotes") as string) || null,
      headcount: parseInt(formData.get("headcount") as string) || null,
      ezCaterLink: (formData.get("ezCaterLink") as string) || null,
      invoiceImageUrl: (formData.get("invoiceImageUrl") as string) || null,
      invoiceUrl: (formData.get("invoiceUrl") as string) || null,
    },
  });

  revalidatePath(`/events/${eventId}`);
}

export async function requestPayment(eventId: string) {
  await getSession();

  await prisma.cateringApproval.update({
    where: { eventId },
    data: { paymentStatus: "REQUESTED" },
  });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event) await sendPaymentRequest(eventId, event.title);

  revalidatePath(`/events/${eventId}`);
}

export async function markPaid(eventId: string, formData?: FormData) {
  const session = await getSession();
  const note = formData?.get("paymentNote") as string || "Done";
  await prisma.cateringApproval.update({
    where: { eventId },
    data: {
      paymentStatus: "PAID",
      paidById: session.user.id,
      paidAt: new Date(),
      paymentNote: note,
    },
  });
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

// ─── ROOM RESERVATION ──────────────────────────────

export async function updateRoomReservation(eventId: string, formData: FormData) {
  await getSession();

  const existing = await prisma.roomReservation.findUnique({ where: { eventId } });

  const data = {
    roomName: (formData.get("roomName") as string) || null,
    reservationUrl: (formData.get("reservationUrl") as string) || null,
    confirmationId: (formData.get("confirmationId") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as string) || "PENDING",
    confirmedAt: formData.get("status") === "CONFIRMED" ? new Date() : existing?.confirmedAt || null,
  };

  if (existing) {
    await prisma.roomReservation.update({ where: { eventId }, data });
  } else {
    await prisma.roomReservation.create({ data: { ...data, eventId } });
  }

  revalidatePath(`/events/${eventId}`);
}

// ─── FLYER TASK ────────────────────────────────────

export async function updateFlyerTask(eventId: string, formData: FormData) {
  await getSession();

  const existing = await prisma.flyerTask.findUnique({ where: { eventId } });

  const data = {
    flyerUrl: (formData.get("flyerUrl") as string) || null,
    designStatus: (formData.get("designStatus") as string) || "NOT_STARTED",
    distYaleConnect: formData.get("distYaleConnect") === "true",
    distEmail: formData.get("distEmail") === "true",
    distWhatsApp: formData.get("distWhatsApp") === "true",
    distTeams: formData.get("distTeams") === "true",
    distOther: (formData.get("distOther") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  if (existing) {
    await prisma.flyerTask.update({ where: { eventId }, data });
  } else {
    await prisma.flyerTask.create({ data: { ...data, eventId } });
  }

  revalidatePath(`/events/${eventId}`);
}

// ─── DAY-OF CHECKLIST ──────────────────────────────

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  await getSession();
  const item = await prisma.dayOfChecklistItem.update({
    where: { id: itemId },
    data: { isChecked: checked },
    include: { checklist: true },
  });
  revalidatePath(`/events`);
}

export async function addChecklistItem(checklistId: string, label: string) {
  await getSession();
  const maxOrder = await prisma.dayOfChecklistItem.findFirst({
    where: { checklistId },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.dayOfChecklistItem.create({
    data: {
      checklistId,
      label,
      isCustom: true,
      sortOrder: (maxOrder?.sortOrder || 0) + 1,
    },
  });
  revalidatePath(`/events`);
}

// ─── EXPENSES ──────────────────────────────────────

export async function addExpense(eventId: string, formData: FormData) {
  await getSession();

  await prisma.expense.create({
    data: {
      eventId,
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string) || 0,
      category: (formData.get("category") as string) || "OTHER",
      vendor: (formData.get("vendor") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/events/${eventId}`);
}

export async function deleteExpense(expenseId: string, eventId: string) {
  await getSession();
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/events/${eventId}`);
}

export async function toggleExpensePaid(expenseId: string, eventId: string) {
  await getSession();
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) return;
  await prisma.expense.update({
    where: { id: expenseId },
    data: { isPaid: !expense.isPaid, paidDate: !expense.isPaid ? new Date() : null },
  });
  revalidatePath(`/events/${eventId}`);
}

// ── Task Assignment & Acceptance ──

export async function assignTaskLead(
  eventId: string,
  taskType: "catering" | "room" | "flyer",
  assigneeId: string
) {
  await getSession();

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee || assignee.role !== "LC_LEAD") throw new Error("Can only assign LC Leads");

  if (taskType === "catering") {
    const existing = await prisma.cateringApproval.findUnique({ where: { eventId } });
    if (existing) {
      await prisma.cateringApproval.update({
        where: { eventId },
        data: { assigneeId, acceptedAt: null, reminderSentAt: null },
      });
    } else {
      await prisma.cateringApproval.create({
        data: { eventId, assigneeId },
      });
    }
  } else if (taskType === "room") {
    const existing = await prisma.roomReservation.findUnique({ where: { eventId } });
    if (existing) {
      await prisma.roomReservation.update({
        where: { eventId },
        data: { assigneeId, acceptedAt: null, reminderSentAt: null },
      });
    } else {
      await prisma.roomReservation.create({
        data: { eventId, assigneeId, status: "PENDING" },
      });
    }
  } else if (taskType === "flyer") {
    const existing = await prisma.flyerTask.findUnique({ where: { eventId } });
    if (existing) {
      await prisma.flyerTask.update({
        where: { eventId },
        data: { assigneeId, acceptedAt: null, reminderSentAt: null },
      });
    } else {
      await prisma.flyerTask.create({
        data: { eventId, assigneeId, designStatus: "NOT_STARTED" },
      });
    }
  }

  // Send email notification via Resend
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { title: true } });
  await sendTaskAssignment(
    eventId,
    event?.title || "Untitled Event",
    taskType === "catering" ? "Catering" : taskType === "room" ? "Room Reservation" : "Flyer",
    assigneeId,
    assignee.email,
    assignee.name,
  );

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

export async function acceptTask(
  eventId: string,
  taskType: "catering" | "room" | "flyer"
) {
  const session = await getSession();
  const now = new Date();

  if (taskType === "catering") {
    await prisma.cateringApproval.update({
      where: { eventId },
      data: { acceptedAt: now },
    });
  } else if (taskType === "room") {
    await prisma.roomReservation.update({
      where: { eventId },
      data: { acceptedAt: now, status: "ACCEPTED" },
    });
  } else if (taskType === "flyer") {
    await prisma.flyerTask.update({
      where: { eventId },
      data: { acceptedAt: now },
    });
  }

  revalidatePath(`/events/${eventId}`);
}

// ── Academic Year & Budget ──

export async function updateYearlyBudget(yearId: string, budget: number) {
  await getSession();
  await prisma.academicYear.update({
    where: { id: yearId },
    data: { budget },
  });
  revalidatePath("/");
}

export async function createAcademicYear(formData: FormData) {
  await getSession();
  const label = formData.get("label") as string;
  const startMonth = parseInt(formData.get("startMonth") as string) || 9;
  const startYear = parseInt(formData.get("startYear") as string);
  const budget = parseFloat(formData.get("budget") as string) || null;

  // Calculate end
  const endMonth = startMonth === 1 ? 12 : startMonth - 1;
  const endYear = startMonth === 1 ? startYear : startYear + 1;

  // Unset any existing current
  const makeCurrent = formData.get("isCurrent") === "true";
  if (makeCurrent) {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
  }

  await prisma.academicYear.create({
    data: {
      label: label || `${startYear}-${endYear}`,
      startMonth,
      startYear,
      endMonth,
      endYear,
      budget,
      isCurrent: makeCurrent,
    },
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

export async function switchAcademicYear(yearId: string) {
  await getSession();
  await prisma.academicYear.updateMany({ data: { isCurrent: false } });
  await prisma.academicYear.update({
    where: { id: yearId },
    data: { isCurrent: true },
  });
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/settings");
}

export async function updateAcademicYearSettings(yearId: string, formData: FormData) {
  await getSession();
  const startMonth = parseInt(formData.get("startMonth") as string);
  const budget = parseFloat(formData.get("budget") as string) || null;

  const data: Record<string, any> = {};
  if (startMonth >= 1 && startMonth <= 12) data.startMonth = startMonth;
  if (budget !== null) data.budget = budget;

  await prisma.academicYear.update({ where: { id: yearId }, data });
  revalidatePath("/");
  revalidatePath("/settings");
}
