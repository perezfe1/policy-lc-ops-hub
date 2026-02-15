import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { EVENT_STATUSES } from "@/lib/constants";
import { EventsViewToggle } from "@/components/EventsViewToggle";
import { KanbanBoard } from "@/components/KanbanBoard";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { view?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const statusFilter = searchParams.status;
  const view = searchParams.view || "kanban"; // Default to kanban

  // Get current academic year for filtering
  const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const yearFilter = currentYear ? { academicYearId: currentYear.id } : {};

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: statusFilter ? statusFilter : { not: "ARCHIVED" },
      ...yearFilter,
    },
    include: {
      createdBy: { select: { name: true } },
      catering: true,
      room: true,
      flyer: true,
      expenses: true,
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Events</h1>
        <div className="flex items-center gap-3">
          <EventsViewToggle current={view} />
          <Link href="/events/new" className="btn-primary">
            + New Event
          </Link>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href={`/events?view=${view}`}
          className={`badge cursor-pointer ${!statusFilter ? "bg-yale-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          All
        </Link>
        {EVENT_STATUSES.filter((s) => s !== "ARCHIVED").map((s) => (
          <Link
            key={s}
            href={`/events?status=${s}&view=${view}`}
            className={`badge cursor-pointer ${statusFilter === s ? "bg-yale-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {view === "table" ? (
        /* ── Table View ── */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Catering</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Spent</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Champion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No events found.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-medium text-gray-900 hover:text-yale-accent"
                        >
                          {event.title}
                        </Link>
                        {event.location && (
                          <div className="text-xs text-gray-400">{event.location}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(event.date)}
                        {event.time && (
                          <span className="text-gray-400 text-xs ml-1">{event.time}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={event.status} />
                      </td>
                      <td className="px-4 py-3">
                        {event.catering ? (
                          <StatusBadge status={event.catering.status} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCurrency(event.expenses.reduce((s, x) => s + x.amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm font-medium">
                        {event.createdBy.name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Kanban View (default) ── */
        <KanbanBoard events={events as any} />
      )}
    </div>
  );
}
