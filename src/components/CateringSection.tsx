"use client";

import { StatusBadge } from "./StatusBadge";
import { formatCurrency } from "@/lib/utils";
import {
  submitForApproval,
  decideCatering,
  updateCateringDetails,
  requestPayment,
  markPaid,
} from "@/lib/actions";
import { useState } from "react";
import { TaskAssignment } from "./TaskAssignment";

interface CateringApproval {
  id: string;
  status: string;
  vendor: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  menuDetails: string | null;
  dietaryNotes: string | null;
  headcount: number | null;
  ezCaterLink: string | null;
  invoiceImageUrl: string | null;
  revisionCount: number;
  changeNotes: string | null;
  invoiceUrl: string | null;
  paymentStatus: string;
  paymentNote: string | null;
  assigneeId: string | null;
  acceptedAt: Date | string | null;
  decidedBy: { name: string } | null;
  assignee: { name: string } | null;
  paidBy: { name: string } | null;
}

export function CateringSection({
  eventId,
  approval,
  isFinance,
  isPaymentAdmin,
  lcLeads,
  currentUserId,
}: {
  eventId: string;
  approval: CateringApproval | null;
  isFinance: boolean;
  isPaymentAdmin?: boolean;
  lcLeads: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");

  if (!approval) return null;

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🍽️</span>
          <h3 className="section-title">Catering</h3>
          <StatusBadge status={approval.status} />
          {approval.revisionCount > 0 && (
            <span className="text-xs text-gray-400">Rev. {approval.revisionCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {approval.paymentStatus !== "PENDING" && (
            <span className="text-xs text-gray-500">
              Payment: <StatusBadge status={approval.paymentStatus} />
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Assignment */}
        <div className="pb-3 border-b border-gray-100">
          <span className="text-xs text-gray-500 block mb-1">Assigned LC Lead</span>
          <TaskAssignment
            eventId={eventId}
            taskType="catering"
            assignee={approval.assignee ? { id: approval.assigneeId || undefined, name: approval.assignee.name } : null}
            acceptedAt={approval.acceptedAt}
            currentUserId={currentUserId}
            lcLeads={lcLeads}
          />
        </div>

        {/* Details */}
        {!editing ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <Field label="Vendor" value={approval.vendor} />
            <Field label="Est. Cost" value={approval.estimatedCost ? formatCurrency(approval.estimatedCost) : null} />
            <Field label="Actual Cost" value={approval.actualCost ? formatCurrency(approval.actualCost) : null} />
            <Field label="Headcount" value={approval.headcount?.toString()} />
            <Field label="Menu" value={approval.menuDetails} className="col-span-2" />
            <Field label="Dietary Notes" value={approval.dietaryNotes} />
            {approval.ezCaterLink && (
              <div>
                <span className="text-xs text-gray-500">ezCater Order</span>
                <a href={approval.ezCaterLink} target="_blank" rel="noopener" className="block text-sm text-yale-accent hover:underline">
                  View on ezCater →
                </a>
              </div>
            )}
            {approval.invoiceImageUrl && (
              <div>
                <span className="text-xs text-gray-500">Invoice Image</span>
                <a href={approval.invoiceImageUrl} target="_blank" rel="noopener" className="block text-sm text-yale-accent hover:underline">
                  View Invoice →
                </a>
              </div>
            )}
            {approval.invoiceUrl && (
              <div>
                <span className="text-xs text-gray-500">Invoice URL</span>
                <a href={approval.invoiceUrl} target="_blank" rel="noopener" className="block text-sm text-yale-accent hover:underline">
                  View →
                </a>
              </div>
            )}
          </div>
        ) : (
          <form
            action={async (fd) => {
              await updateCateringDetails(eventId, fd);
              setEditing(false);
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Vendor</label>
                <input name="vendor" className="input" defaultValue={approval.vendor || ""} />
              </div>
              <div>
                <label className="label">Estimated Cost</label>
                <input name="estimatedCost" type="number" step="0.01" className="input" defaultValue={approval.estimatedCost || ""} />
              </div>
              <div>
                <label className="label">Actual Cost</label>
                <input name="actualCost" type="number" step="0.01" className="input" defaultValue={approval.actualCost || ""} />
              </div>
              <div>
                <label className="label">Headcount</label>
                <input name="headcount" type="number" className="input" defaultValue={approval.headcount || ""} />
              </div>
            </div>
            <div>
              <label className="label">ezCater Link</label>
              <input name="ezCaterLink" type="url" className="input" defaultValue={approval.ezCaterLink || ""} placeholder="https://www.ezcater.com/order/..." />
            </div>
            <div>
              <label className="label">Menu Details</label>
              <textarea name="menuDetails" className="input" rows={2} defaultValue={approval.menuDetails || ""} />
            </div>
            <div>
              <label className="label">Dietary Notes</label>
              <input name="dietaryNotes" className="input" defaultValue={approval.dietaryNotes || ""} />
            </div>
            <div>
              <label className="label">Invoice Image URL</label>
              <input name="invoiceImageUrl" type="url" className="input" defaultValue={approval.invoiceImageUrl || ""} placeholder="Upload to Google Drive and paste link" />
            </div>
            <div>
              <label className="label">Invoice URL</label>
              <input name="invoiceUrl" className="input" defaultValue={approval.invoiceUrl || ""} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary btn-sm">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </form>
        )}

        {/* Change Notes from Finance */}
        {approval.status === "CHANGES_REQUESTED" && approval.changeNotes && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="text-xs font-medium text-orange-700 mb-1">
              Changes requested{approval.decidedBy ? ` by ${approval.decidedBy.name}` : ""}:
            </div>
            <div className="text-sm text-orange-800">{approval.changeNotes}</div>
          </div>
        )}

        {/* Payment complete note */}
        {approval.paymentStatus === "PAID" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs font-medium text-green-700">
              ✅ Payment processed{approval.paidBy ? ` by ${approval.paidBy.name}` : ""}
            </div>
            {approval.paymentNote && (
              <div className="text-sm text-green-800 mt-1">{approval.paymentNote}</div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {!editing && (approval.status === "DRAFT" || approval.status === "CHANGES_REQUESTED") && (
            <>
              <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
                ✏️ Edit Details
              </button>
              <form action={() => submitForApproval(eventId)}>
                <button type="submit" className="btn-primary btn-sm">
                  📤 Submit for Approval
                </button>
              </form>
            </>
          )}

          {isFinance && approval.status === "AWAITING_APPROVAL" && (
            <div className="flex gap-2 w-full">
              <form action={async (fd) => { fd.set("decision", "APPROVED"); await decideCatering(eventId, fd); }}>
                <button type="submit" className="btn-success btn-sm">✅ Approve</button>
              </form>
              <form action={async (fd) => { fd.set("decision", "REJECTED"); await decideCatering(eventId, fd); }}>
                <button type="submit" className="btn-danger btn-sm">❌ Reject</button>
              </form>
              <form
                action={async (fd) => {
                  fd.set("decision", "CHANGES_REQUESTED");
                  fd.set("changeNotes", changeNotes);
                  await decideCatering(eventId, fd);
                }}
                className="flex items-center gap-2 flex-1"
              >
                <input
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="What needs to change?"
                  className="input text-xs flex-1"
                />
                <button type="submit" className="btn-secondary btn-sm whitespace-nowrap">
                  🔄 Request Changes
                </button>
              </form>
            </div>
          )}

          {approval.status === "APPROVED" && approval.paymentStatus === "PENDING" && (
            <form action={() => requestPayment(eventId)}>
              <button type="submit" className="btn-primary btn-sm">💳 Request Payment</button>
            </form>
          )}

          {(isPaymentAdmin || isFinance) && approval.paymentStatus === "REQUESTED" && (
            <PaymentConfirmForm eventId={eventId} />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

function PaymentConfirmForm({ eventId }: { eventId: string }) {
  const [note, setNote] = useState("Done");
  return (
    <form
      action={async (fd) => {
        fd.set("paymentNote", note);
        await markPaid(eventId, fd);
      }}
      className="flex items-center gap-2"
    >
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (e.g. Done, P-card used)"
        className="input text-xs w-48"
      />
      <button type="submit" className="btn-success btn-sm whitespace-nowrap">✅ Mark as Paid</button>
    </form>
  );
}
