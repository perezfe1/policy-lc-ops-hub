"use client";

import { updateEvent, archiveEvent } from "@/lib/actions";
import { EVENT_STATUSES } from "@/lib/constants";
import { StatusBadge } from "./StatusBadge";
import { useState } from "react";

export function EventStatusControl({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === "ARCHIVED") {
      await archiveEvent(eventId);
    } else {
      const fd = new FormData();
      fd.set("status", newStatus);
      await updateEvent(eventId, fd);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-secondary btn-sm">
        Change Status ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-48">
            {EVENT_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => handleChange(status)}
                disabled={status === currentStatus}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  status === currentStatus ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <StatusBadge status={status} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
