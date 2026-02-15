"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function EventsViewToggle({ current }: { current: string }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      <Link
        href="/events?view=kanban"
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          current === "kanban"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Kanban
      </Link>
      <Link
        href="/events?view=table"
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
          current === "table"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        Table
      </Link>
    </div>
  );
}
