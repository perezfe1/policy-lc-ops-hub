import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency, daysUntil } from "@/lib/utils";
import { BudgetEditor } from "@/components/BudgetEditor";
import { AcademicYearSwitcher } from "@/components/AcademicYearSwitcher";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();

  // Academic year context
  const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
  const allYears = await prisma.academicYear.findMany({ orderBy: { startYear: "desc" } });

  // Filter events by current academic year if set
  const yearFilter = currentYear ? { academicYearId: currentYear.id } : {};

  // Upcoming events (next 30 days)
  const upcomingEvents = await prisma.event.findMany({
    where: {
      deletedAt: null,
      status: { not: "ARCHIVED" },
      date: { gte: now, lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      ...yearFilter,
    },
    include: { catering: true, room: true, flyer: true, expenses: true },
    orderBy: { date: "asc" },
    take: 10,
  });

  // Events needing attention
  const pendingApprovals = await prisma.cateringApproval.findMany({
    where: { status: "AWAITING_APPROVAL", event: { ...yearFilter, deletedAt: null } },
    include: { event: true },
  });

  const pendingPayments = await prisma.cateringApproval.findMany({
    where: { paymentStatus: "REQUESTED", status: "APPROVED", event: { ...yearFilter, deletedAt: null } },
    include: { event: true },
  });

  const pendingRooms = await prisma.roomReservation.findMany({
    where: { status: "PENDING", event: { ...yearFilter, deletedAt: null } },
    include: { event: true },
  });

  // Unaccepted task assignments
  const unacceptedTasks = await prisma.cateringApproval.count({
    where: { assigneeId: { not: null }, acceptedAt: null, event: { ...yearFilter, deletedAt: null } },
  }) + await prisma.roomReservation.count({
    where: { assigneeId: { not: null }, acceptedAt: null, event: { ...yearFilter, deletedAt: null } },
  }) + await prisma.flyerTask.count({
    where: { assigneeId: { not: null }, acceptedAt: null, event: { ...yearFilter, deletedAt: null } },
  });

  // Stats
  const totalEvents = await prisma.event.count({ where: { deletedAt: null, status: { not: "ARCHIVED" }, ...yearFilter } });

  // Budget calculations — sum of per-event budgets and expenses
  const eventBudgets = await prisma.event.aggregate({
    where: { deletedAt: null, ...yearFilter },
    _sum: { budgetAmount: true },
  });
  const totalExpenses = await prisma.expense.aggregate({
    where: { event: { ...yearFilter, deletedAt: null } },
    _sum: { amount: true },
  });
  const totalPaid = await prisma.expense.aggregate({
    where: { isPaid: true, event: { ...yearFilter, deletedAt: null } },
    _sum: { amount: true },
  });

  const yearlyBudget = currentYear?.budget || null;
  const totalSpent = totalExpenses._sum.amount || 0;
  const totalAllocated = eventBudgets._sum.budgetAmount || 0;
  const budgetRemaining = yearlyBudget ? yearlyBudget - totalSpent : null;

  const userRole = (session.user as any).role;
  const isFinance = userRole === "FINANCE" || userRole === "ADMIN";
  const isPaymentAdmin = userRole === "PAYMENT_ADMIN" || userRole === "ADMIN";
  const isAdmin = userRole === "ADMIN";

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Welcome back, {(session.user as any).name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening with your events.</p>
        </div>
        <div className="flex items-center gap-3">
          <AcademicYearSwitcher years={allYears} currentYearId={currentYear?.id || null} />
          <Link href="/events/new" className="btn-primary">
            + New Event
          </Link>
        </div>
      </div>

      {/* Budget Overview Card */}
      {currentYear && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{currentYear.label} Budget</h2>
            {isAdmin && <Link href="/settings" className="text-xs text-yale-accent hover:underline">⚙️ Settings</Link>}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1">Yearly Budget</span>
              {isAdmin ? (
                <BudgetEditor yearId={currentYear.id} currentBudget={yearlyBudget} />
              ) : (
                <span className="text-2xl font-display font-bold text-gray-900">
                  {yearlyBudget ? formatCurrency(yearlyBudget) : "Not set"}
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1">Allocated to Events</span>
              <span className="text-2xl font-display font-bold text-gray-900">{formatCurrency(totalAllocated)}</span>
              {yearlyBudget && totalAllocated > 0 && (
                <div className="mt-1">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-yale-blue rounded-full h-1.5 transition-all"
                      style={{ width: `${Math.min(100, (totalAllocated / yearlyBudget) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{Math.round((totalAllocated / yearlyBudget) * 100)}% allocated</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1">Total Spent</span>
              <span className="text-2xl font-display font-bold text-gray-900">{formatCurrency(totalSpent)}</span>
              <span className="block text-xs text-gray-400">{formatCurrency(totalPaid._sum.amount || 0)} paid</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-1">Remaining</span>
              <span className={`text-2xl font-display font-bold ${
                budgetRemaining === null ? "text-gray-400" : budgetRemaining < 0 ? "text-red-600" : "text-green-600"
              }`}>
                {budgetRemaining !== null ? formatCurrency(budgetRemaining) : "—"}
              </span>
              {budgetRemaining !== null && budgetRemaining < 0 && (
                <span className="block text-xs text-red-500 font-medium">Over budget!</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Events" value={totalEvents} />
        <StatCard label="Pending Approvals" value={pendingApprovals.length} highlight={pendingApprovals.length > 0} />
        <StatCard label="Pending Payments" value={pendingPayments.length} highlight={pendingPayments.length > 0} />
        <StatCard label="Unaccepted Tasks" value={unacceptedTasks} highlight={unacceptedTasks > 0} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="section-title">Upcoming Events</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingEvents.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  No upcoming events.{" "}
                  <Link href="/events/new" className="text-yale-accent hover:underline">
                    Create one →
                  </Link>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const days = daysUntil(event.date);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {event.title}
                          </span>
                          <StatusBadge status={event.status} />
                          {event.isVirtual && <span className="text-xs">💻</span>}
                          {event.isHybrid && <span className="text-xs">🔀</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDate(event.date)} {event.time && `· ${event.time}`}
                          {event.location && ` · ${event.location}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        {event.catering && (
                          <span className="text-xs" title="Catering">
                            🍽️ <StatusBadge status={event.catering.status} className="text-[10px]" />
                          </span>
                        )}
                        <span
                          className={`text-xs font-medium ${
                            days <= 3 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-gray-400"
                          }`}
                        >
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          {/* Approvals */}
          {isFinance && pendingApprovals.length > 0 && (
            <ActionCard
              title="🔔 Approvals Needed"
              count={pendingApprovals.length}
              color="amber"
              items={pendingApprovals.map((a) => ({
                id: a.id,
                eventId: a.eventId,
                title: a.event.title,
                detail: `${a.vendor || "No vendor"} · ${formatCurrency(a.estimatedCost || 0)}`,
              }))}
            />
          )}

          {/* Payments */}
          {(isPaymentAdmin || isFinance) && pendingPayments.length > 0 && (
            <ActionCard
              title="💳 Payments Requested"
              count={pendingPayments.length}
              color="blue"
              items={pendingPayments.map((a) => ({
                id: a.id,
                eventId: a.eventId,
                title: a.event.title,
                detail: `${a.vendor || "No vendor"} · ${formatCurrency(a.actualCost || a.estimatedCost || 0)}`,
              }))}
            />
          )}

          {/* Pending Rooms */}
          {pendingRooms.length > 0 && (
            <ActionCard
              title="🏫 Rooms to Confirm"
              count={pendingRooms.length}
              color="indigo"
              items={pendingRooms.map((r) => ({
                id: r.id,
                eventId: r.eventId,
                title: r.event.title,
                detail: `${r.roomName || "Room TBD"}`,
              }))}
            />
          )}

          {/* Quick Export */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📤 Quick Export</h3>
            <div className="space-y-2">
              <a href="/api/exports?type=events" className="btn-secondary w-full text-center block text-xs">
                Export All Events (CSV)
              </a>
              <a href="/api/exports?type=expenses" className="btn-secondary w-full text-center block text-xs">
                Export All Expenses (CSV)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "ring-2 ring-amber-300" : ""}`}>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-2xl font-display font-bold mt-1 ${highlight ? "text-amber-600" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  count,
  color,
  items,
}: {
  title: string;
  count: number;
  color: "amber" | "blue" | "indigo";
  items: { id: string; eventId: string; title: string; detail: string }[];
}) {
  const colors = {
    amber: { header: "text-amber-700", hover: "hover:bg-amber-50/50" },
    blue: { header: "text-blue-700", hover: "hover:bg-blue-50/50" },
    indigo: { header: "text-indigo-700", hover: "hover:bg-indigo-50/50" },
  };
  const c = colors[color];

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className={`text-sm font-semibold ${c.header}`}>
          {title} ({count})
        </h3>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/events/${item.eventId}`}
            className={`block px-5 py-3 ${c.hover} transition-colors`}
          >
            <span className="text-sm font-medium text-gray-900">{item.title}</span>
            <span className="block text-xs text-gray-500">{item.detail}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
