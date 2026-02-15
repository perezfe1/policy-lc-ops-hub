import { cn } from "@/lib/utils";

const COLOR_MAP: Record<string, string> = {
  // Event statuses
  DRAFT: "bg-gray-100 text-gray-700",
  PLANNING: "bg-amber-50 text-amber-700 border border-amber-200",
  READY: "bg-blue-50 text-blue-700 border border-blue-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  ARCHIVED: "bg-gray-100 text-gray-500",
  // Catering statuses
  AWAITING_APPROVAL: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  CHANGES_REQUESTED: "bg-orange-50 text-orange-700 border border-orange-200",
  // Payment statuses
  PENDING: "bg-gray-100 text-gray-600",
  REQUESTED: "bg-amber-50 text-amber-700 border border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  // Room
  CONFIRMED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border border-red-200",
  // Flyer
  NOT_STARTED: "bg-gray-100 text-gray-600",
  DONE: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const LABEL_MAP: Record<string, string> = {
  DRAFT: "Draft",
  PLANNING: "Planning",
  READY: "Ready",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
  PENDING: "Pending",
  REQUESTED: "Requested",
  PAID: "Paid",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  NOT_STARTED: "Not Started",
  DONE: "Done",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("badge", COLOR_MAP[status] || "bg-gray-100 text-gray-600", className)}>
      {LABEL_MAP[status] || status}
    </span>
  );
}
