import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarGrid } from "@/components/CalendarGrid";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const year = parseInt(searchParams.year || String(now.getFullYear()));
  const month = parseInt(searchParams.month || String(now.getMonth()));

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: { not: "ARCHIVED" },
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { id: true, title: true, date: true, status: true, location: true, time: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Calendar</h1>
        <Link href="/events/new" className="btn-primary">
          + New Event
        </Link>
      </div>
      <CalendarGrid
        events={events.map((e) => ({ ...e, date: e.date.toISOString() }))}
        year={year}
        month={month}
      />
    </div>
  );
}
