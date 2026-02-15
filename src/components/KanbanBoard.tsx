"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { updateEventStatus } from "@/lib/actions";
import { EVENT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import toast from "react-hot-toast";

type KanbanEvent = {
  id: string;
  title: string;
  date: Date | string;
  location: string | null;
  status: string;
  createdBy: { name: string };
  catering: any;
  room: any;
  flyer: any;
};

const kanbanStatuses = EVENT_STATUSES.filter((s) => s !== "ARCHIVED");

export function KanbanBoard({ events: initialEvents }: { events: KanbanEvent[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const dragItem = useRef<{ id: string; fromStatus: string } | null>(null);

  const handleDragStart = (e: React.DragEvent, eventId: string, fromStatus: string) => {
    dragItem.current = { id: eventId, fromStatus };
    setDraggingId(eventId);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
    dragItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column, not entering a child
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (!dragItem.current) return;
    const { id, fromStatus } = dragItem.current;
    if (fromStatus === toStatus) return;

    // Optimistic update
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, status: toStatus } : ev))
    );

    try {
      await updateEventStatus(id, toStatus);
      toast.success(`Moved to ${STATUS_LABELS[toStatus as keyof typeof STATUS_LABELS] || toStatus}`);
    } catch {
      // Revert on error
      setEvents((prev) =>
        prev.map((ev) => (ev.id === id ? { ...ev, status: fromStatus } : ev))
      );
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {kanbanStatuses.map((status) => {
        const statusEvents = events.filter((e) => e.status === status);
        const isOver = dragOverStatus === status;

        return (
          <div
            key={status}
            className={`min-w-[280px] w-[280px] shrink-0 rounded-xl p-3 transition-colors ${
              isOver ? "bg-yale-blue/5 ring-2 ring-yale-blue/30" : "bg-gray-50/50"
            }`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <StatusBadge status={status} />
              <span className="text-xs text-gray-400 font-medium">{statusEvents.length}</span>
            </div>

            <div className="space-y-2 min-h-[60px]">
              {statusEvents.map((event) => (
                <div
                  key={event.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event.id, status)}
                  onDragEnd={handleDragEnd}
                  className={`group card p-4 cursor-grab active:cursor-grabbing transition-all ${
                    draggingId === event.id
                      ? "opacity-40 scale-95"
                      : "hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <Link href={`/events/${event.id}`} className="block" onClick={(e) => { if (draggingId) e.preventDefault(); }}>
                    <div className="font-medium text-sm text-gray-900 mb-1 group-hover:text-yale-accent transition-colors">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(event.date)}
                      {event.location && ` · ${event.location}`}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1.5">
                        {event.catering && <span title="Catering">🍽️</span>}
                        {event.room && <span title="Room">🏫</span>}
                        {event.flyer && <span title="Flyer">📰</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">{event.createdBy.name}</span>
                    </div>
                  </Link>
                </div>
              ))}

              {statusEvents.length === 0 && (
                <div className={`text-xs text-center py-8 rounded-lg border-2 border-dashed transition-colors ${
                  isOver ? "border-yale-blue/30 text-yale-blue/50" : "border-gray-200 text-gray-300"
                }`}>
                  {isOver ? "Drop here" : "No events"}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
