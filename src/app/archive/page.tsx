import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const events = await prisma.event.findMany({
    where: { status: { in: ["COMPLETED", "ARCHIVED"] }, deletedAt: null },
    include: {
      expenses: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Archive</h1>
          <p className="text-sm text-gray-500 mt-1">Completed and archived events for institutional memory.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/exports?type=events&from=&to=" className="btn-secondary btn-sm">
            📤 Export CSV
          </a>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Event</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Headcount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Budget</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Do Again?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No archived events yet.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium text-gray-900 hover:text-yale-accent"
                    >
                      {event.title}
                    </Link>
                    <div className="text-xs text-gray-400">{event.semester || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(event.date)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{event.headcount || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(event.expenses.reduce((s, x) => s + x.amount, 0))}
                  </td>
                  <td className="px-4 py-3">
                    {event.doAgain === true ? (
                      <span className="text-emerald-600">✅ Yes</span>
                    ) : event.doAgain === false ? (
                      <span className="text-red-500">❌ No</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
