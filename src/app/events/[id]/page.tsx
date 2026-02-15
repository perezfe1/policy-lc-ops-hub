import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency, parseTagString } from "@/lib/utils";
import { CateringSection } from "@/components/CateringSection";
import { RoomSection } from "@/components/RoomSection";
import { FlyerSection } from "@/components/FlyerSection";
import { ChecklistSection } from "@/components/ChecklistSection";
import { ExpenseSection } from "@/components/ExpenseSection";
import { EventStatusControl } from "@/components/EventStatusControl";
import { RetrospectiveSection } from "@/components/RetrospectiveSection";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
      catering: { include: { decidedBy: { select: { name: true } }, assignee: { select: { name: true } }, paidBy: { select: { name: true } } } },
      room: { include: { assignee: { select: { name: true } } } },
      flyer: { include: { assignee: { select: { name: true } } } },
      dayOfChecklist: { include: { items: { orderBy: { sortOrder: "asc" } } } },
      expenses: { orderBy: { createdAt: "desc" } },
      emailLogs: { orderBy: { sentAt: "desc" }, take: 10 },
    },
  });

  if (!event || event.deletedAt) notFound();

  // Fetch LC Leads for task assignment
  const lcLeads = await prisma.user.findMany({
    where: { role: "LC_LEAD", deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tags = parseTagString(event.tags);
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  const isFinance = userRole === "FINANCE" || userRole === "ADMIN";
  const isPaymentAdmin = userRole === "PAYMENT_ADMIN" || userRole === "ADMIN";
  const totalSpent = event.expenses.reduce((s, x) => s + x.amount, 0);
  const budgetRemaining = event.budgetAmount ? event.budgetAmount - totalSpent : null;

  // Format label
  const formatLabel = event.isVirtual ? "💻 Virtual" : event.isHybrid ? "🔀 Hybrid" : "🏫 In-Person";

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/events" className="hover:text-yale-accent">Events</Link>
        <span>/</span>
        <span className="text-gray-600">{event.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-gray-900">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>📅 {formatDate(event.date)}</span>
            {event.time && <span>🕐 {event.time}</span>}
            {event.location && <span>📍 {event.location}</span>}
            <span>{formatLabel}</span>
            {event.semester && <span>🎓 {event.semester}</span>}
          </div>
          {(event.isVirtual || event.isHybrid) && event.virtualLink && (
            <div className="mt-1">
              <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="text-sm text-yale-accent hover:underline">
                🔗 {event.virtualLink}
              </a>
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {tags.map((t) => (
                <span key={t} className="badge bg-yale-blue/10 text-yale-blue text-[10px]">{t}</span>
              ))}
            </div>
          )}
          {event.description && (
            <p className="text-sm text-gray-600 mt-3 max-w-xl">{event.description}</p>
          )}
        </div>
        <EventStatusControl eventId={event.id} currentStatus={event.status} />
      </div>

      {/* Speaker info */}
      {event.speakerName && (
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-yale-blue/10 flex items-center justify-center text-lg">🎤</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{event.speakerName}</div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                {event.speakerOrg && <span>{event.speakerOrg}</span>}
                {event.speakerEmail && <span>✉️ {event.speakerEmail}</span>}
                {event.speakerPhone && <span>📞 {event.speakerPhone}</span>}
              </div>
            </div>
          </div>
          {/* Point of Contact */}
          {event.pocName && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Point of Contact</div>
                <div className="text-sm text-gray-900">{event.pocName}</div>
                <div className="text-xs text-gray-500 flex flex-wrap gap-x-3">
                  {event.pocEmail && <span>✉️ {event.pocEmail}</span>}
                  {event.pocPhone && <span>📞 {event.pocPhone}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget summary */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Spent: <span className="font-semibold text-gray-900">{formatCurrency(totalSpent)}</span>
            {event.budgetAmount && (
              <span className="ml-2">
                / {formatCurrency(event.budgetAmount)} budget
                {budgetRemaining !== null && (
                  <span className={`ml-1 font-medium ${budgetRemaining < 0 ? "text-red-600" : "text-green-600"}`}>
                    ({budgetRemaining >= 0 ? formatCurrency(budgetRemaining) + " left" : formatCurrency(Math.abs(budgetRemaining)) + " over"})
                  </span>
                )}
              </span>
            )}
            {event.expenses.length > 0 && (
              <span className="ml-2 text-xs text-gray-400">
                ({event.expenses.filter((e) => e.isPaid).length}/{event.expenses.length} paid)
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            Champion: <span className="font-medium text-gray-600">{event.createdBy.name}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Catering */}
        <CateringSection
          eventId={event.id}
          approval={event.catering}
          isFinance={isFinance}
          isPaymentAdmin={isPaymentAdmin}
          lcLeads={lcLeads}
          currentUserId={userId}
        />

        {/* Room Reservation */}
        <RoomSection eventId={event.id} reservation={event.room} lcLeads={lcLeads} currentUserId={userId} />

        {/* Flyer */}
        <FlyerSection eventId={event.id} flyer={event.flyer} lcLeads={lcLeads} currentUserId={userId} />

        {/* Expenses */}
        <ExpenseSection eventId={event.id} expenses={event.expenses} />

        {/* Day-of Checklist */}
        <ChecklistSection checklist={event.dayOfChecklist} />

        {/* Retrospective */}
        {(event.status === "COMPLETED" || event.status === "ARCHIVED" || event.status === "IN_PROGRESS") && (
          <RetrospectiveSection
            eventId={event.id}
            doAgain={event.doAgain}
            reinviteSpeaker={event.reinviteSpeaker}
            retrospectiveNotes={event.retrospectiveNotes}
            headcount={event.headcount}
            hasSpeaker={!!event.speakerName}
          />
        )}

        {/* Email Log */}
        {event.emailLogs.length > 0 && (
          <details className="card">
            <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-gray-700 hover:bg-gray-50">
              📧 Email Log ({event.emailLogs.length})
            </summary>
            <div className="px-5 pb-4">
              <div className="space-y-2">
                {event.emailLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs py-1.5">
                    <div>
                      <span className="font-medium text-gray-700">{log.toEmail}</span>
                      <span className="text-gray-400 ml-2">{log.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={log.status} />
                      <span className="text-gray-400">{formatDate(log.sentAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
