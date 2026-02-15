"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  status: string;
  location: string | null;
  time: string | null;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  events,
  year,
  month,
}: {
  events: CalEvent[];
  year: number;
  month: number;
}) {
  const router = useRouter();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function getEventsForDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day;
    });
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => router.push(`/calendar?year=${prevYear}&month=${prevMonth}`)}
          className="btn-secondary btn-sm"
        >
          ← Prev
        </button>
        <h2 className="text-lg font-display font-semibold text-gray-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={() => router.push(`/calendar?year=${nextYear}&month=${nextMonth}`)}
          className="btn-secondary btn-sm"
        >
          Next →
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={i}
              className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${
                day ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              {day && (
                <>
                  <div
                    className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-yale-blue text-white" : "text-gray-500"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.map((evt) => (
                      <Link
                        key={evt.id}
                        href={`/events/${evt.id}`}
                        className="block text-[11px] px-1.5 py-0.5 rounded bg-yale-blue/10 text-yale-blue hover:bg-yale-blue/20 truncate"
                        title={`${evt.title}${evt.time ? ` · ${evt.time}` : ""}`}
                      >
                        {evt.title}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
