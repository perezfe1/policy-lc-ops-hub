"use client";

import { StatusBadge } from "./StatusBadge";
import { updateRoomReservation } from "@/lib/actions";
import { useState } from "react";
import { TaskAssignment } from "./TaskAssignment";

interface RoomReservation {
  id: string;
  roomName: string | null;
  reservationUrl: string | null;
  confirmationId: string | null;
  status: string;
  notes: string | null;
  assigneeId: string | null;
  acceptedAt: Date | string | null;
  assignee: { name: string } | null;
}

export function RoomSection({
  eventId,
  reservation,
  lcLeads,
  currentUserId,
}: {
  eventId: string;
  reservation: RoomReservation | null;
  lcLeads: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!reservation) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <span>🏫</span>
            <span className="text-sm">No room reservation</span>
          </div>
          <form action={async (fd) => { fd.set("status", "PENDING"); await updateRoomReservation(eventId, fd); }}>
            <button type="submit" className="btn-secondary btn-sm">+ Add Room</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏫</span>
          <h3 className="section-title">Room Reservation</h3>
          <StatusBadge status={reservation.status} />
        </div>
        <button onClick={() => setEditing(!editing)} className="btn-secondary btn-sm">
          {editing ? "Cancel" : "✏️ Edit"}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Assignment */}
        <div className="pb-3 border-b border-gray-100">
          <span className="text-xs text-gray-500 block mb-1">Assigned LC Lead</span>
          <TaskAssignment
            eventId={eventId}
            taskType="room"
            assignee={reservation.assignee ? { id: reservation.assigneeId || undefined, name: reservation.assignee.name } : null}
            acceptedAt={reservation.acceptedAt}
            currentUserId={currentUserId}
            lcLeads={lcLeads}
          />
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-500">Room</span>
              <div className="text-gray-900">{reservation.roomName || "TBD"}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Confirmation ID</span>
              <div className="text-gray-900">{reservation.confirmationId || "—"}</div>
            </div>
            {reservation.reservationUrl && (
              <div>
                <span className="text-xs text-gray-500">Reservation</span>
                <a href={reservation.reservationUrl} target="_blank" rel="noopener" className="text-yale-accent hover:underline text-sm">
                  View →
                </a>
              </div>
            )}
            {reservation.notes && (
              <div className="col-span-full">
                <span className="text-xs text-gray-500">Notes</span>
                <div className="text-gray-700">{reservation.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <form
            action={async (fd) => {
              await updateRoomReservation(eventId, fd);
              setEditing(false);
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Room Name</label>
                <input name="roomName" className="input" defaultValue={reservation.roomName || ""} />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input" defaultValue={reservation.status}>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Confirmation ID</label>
                <input name="confirmationId" className="input" defaultValue={reservation.confirmationId || ""} />
              </div>
              <div>
                <label className="label">Reservation URL</label>
                <input name="reservationUrl" className="input" defaultValue={reservation.reservationUrl || ""} />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" className="input" rows={2} defaultValue={reservation.notes || ""} />
            </div>
            <button type="submit" className="btn-primary btn-sm">Save</button>
          </form>
        )}
      </div>
    </div>
  );
}
