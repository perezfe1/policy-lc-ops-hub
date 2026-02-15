// ── Role Enum ──
export const ROLES = ["ADMIN", "LC_LEAD", "MEMBER", "FINANCE", "PAYMENT_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  LC_LEAD: "Policy LC Lead",
  MEMBER: "Member",
  FINANCE: "Finance Approver",
  PAYMENT_ADMIN: "Payment Admin",
};

// ── Event Status ──
export const EVENT_STATUSES = ["DRAFT", "PLANNING", "READY", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PLANNING: "Planning",
  READY: "Ready",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PLANNING: "bg-yellow-100 text-yellow-800",
  READY: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-200 text-gray-500",
};

// ── Catering Approval Status ──
export const CATERING_STATUSES = ["DRAFT", "AWAITING_APPROVAL", "APPROVED", "REJECTED", "CHANGES_REQUESTED"] as const;
export type CateringStatus = (typeof CATERING_STATUSES)[number];

export const CATERING_STATUS_LABELS: Record<CateringStatus, string> = {
  DRAFT: "Draft",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
};

// ── Payment Status ──
export const PAYMENT_STATUSES = ["PENDING", "REQUESTED", "PAID"] as const;

// ── Task Acceptance Status ──
export const TASK_STATUSES = ["PENDING", "ACCEPTED", "CONFIRMED", "CANCELLED"] as const;

// ── Room Reservation Status ──
export const ROOM_STATUSES = ["PENDING", "ACCEPTED", "CONFIRMED", "CANCELLED"] as const;

// ── Flyer Design Status ──
export const FLYER_DESIGN_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;

// ── Tags ──
export const TAGS = ["LOCAL", "NATIONAL", "INTERNATIONAL"] as const;
export type Tag = (typeof TAGS)[number];

// ── Event Format ──
export const EVENT_FORMATS = ["IN_PERSON", "VIRTUAL", "HYBRID"] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

// ── Expense Categories ──
export const EXPENSE_CATEGORIES = ["CATERING", "SUPPLIES", "SPEAKER_FEE", "TRAVEL", "VENUE", "PRINTING", "OTHER"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  CATERING: "Catering",
  SUPPLIES: "Supplies",
  SPEAKER_FEE: "Speaker Fee",
  TRAVEL: "Travel",
  VENUE: "Venue",
  PRINTING: "Printing",
  OTHER: "Other",
};

// ── Email Reasons ──
export const EMAIL_REASONS = [
  "APPROVAL_REQUEST", "PAYMENT_REQUEST", "OVERDUE_TASK",
  "DAY_OF_REMINDER", "DIGEST", "MANUAL",
  "TASK_ASSIGNMENT", "TASK_REMINDER",
] as const;

// ── Day-Of Predefined Checklist ──
export const DEFAULT_CHECKLIST_ITEMS = [
  "Confirm room/venue is unlocked and set up",
  "Test A/V equipment (mic, projector, screen)",
  "Set up catering / food display",
  "Print and post directional signage",
  "Prepare sign-in sheet or QR code",
  "Greet and brief speaker",
  "Assign door greeter / welcome person",
  "Take event photos",
  "Collect attendee headcount",
  "Clean up after event",
];

// ── Allowed attachment types ──
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
