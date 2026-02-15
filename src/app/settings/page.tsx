import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { AcademicYearForm } from "@/components/AcademicYearForm";
import { AcademicYearRow } from "@/components/AcademicYearRow";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") redirect("/");

  const years = await prisma.academicYear.findMany({
    orderBy: { startYear: "desc" },
    include: {
      _count: { select: { events: true } },
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage academic years, budgets, and system configuration.</p>

      {/* Academic Years */}
      <section className="card mb-8">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">Academic Years</h2>
        </div>
        <div className="p-5 space-y-4">
          {years.length === 0 ? (
            <p className="text-sm text-gray-400">No academic years configured.</p>
          ) : (
            <div className="space-y-3">
              {years.map((year) => (
                <AcademicYearRow
                  key={year.id}
                  year={{
                    id: year.id,
                    label: year.label,
                    startMonth: year.startMonth,
                    startYear: year.startYear,
                    endMonth: year.endMonth,
                    endYear: year.endYear,
                    isCurrent: year.isCurrent,
                    budget: year.budget,
                    eventCount: year._count.events,
                  }}
                  months={MONTHS}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create New Academic Year */}
      <section className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">Create Academic Year</h2>
        </div>
        <div className="p-5">
          <AcademicYearForm months={MONTHS} />
        </div>
      </section>
    </div>
  );
}
