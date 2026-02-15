import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "events";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  if (type === "events") {
    const events = await prisma.event.findMany({
      where: {
        deletedAt: null,
        ...(from || to ? { date: dateFilter } : {}),
      },
      include: {
        expenses: true,
        catering: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    const rows = events.map((e) => ({
      Title: e.title,
      Date: new Date(e.date).toLocaleDateString(),
      Time: e.time || "",
      Location: e.location || "",
      Status: e.status,
      Tags: e.tags,
      Semester: e.semester || "",
      Speaker: e.speakerName || "",
      Headcount: e.headcount || "",
      "Total Budget": e.expenses.reduce((s, x) => s + x.amount, 0).toFixed(2),
      "Catering Status": e.catering?.status || "N/A",
      "Do Again?": e.doAgain === true ? "Yes" : e.doAgain === false ? "No" : "",
      "Re-invite Speaker?": e.reinviteSpeaker === true ? "Yes" : e.reinviteSpeaker === false ? "No" : "",
      "Created By": e.createdBy.name,
    }));

    return csvResponse(rows, "events-export.csv");
  }

  if (type === "expenses") {
    const expenses = await prisma.expense.findMany({
      where: from || to ? { event: { date: dateFilter } } : {},
      include: { event: { select: { title: true, date: true } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = expenses.map((e) => ({
      Event: e.event.title,
      "Event Date": new Date(e.event.date).toLocaleDateString(),
      Description: e.description,
      Amount: e.amount.toFixed(2),
      Category: e.category,
      Vendor: e.vendor || "",
      Paid: e.isPaid ? "Yes" : "No",
      "Paid Date": e.paidDate ? new Date(e.paidDate).toLocaleDateString() : "",
    }));

    return csvResponse(rows, "expenses-export.csv");
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

function csvResponse(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) {
    return new NextResponse("No data found", { status: 200 });
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h] ?? "");
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
