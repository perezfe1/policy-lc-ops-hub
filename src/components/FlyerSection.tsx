"use client";

import { StatusBadge } from "./StatusBadge";
import { updateFlyerTask } from "@/lib/actions";
import { useState } from "react";
import { TaskAssignment } from "./TaskAssignment";

interface FlyerTask {
  id: string;
  designStatus: string;
  flyerUrl: string | null;
  distYaleConnect: boolean;
  distEmail: boolean;
  distWhatsApp: boolean;
  distTeams: boolean;
  distOther: string | null;
  notes: string | null;
  assigneeId: string | null;
  acceptedAt: Date | string | null;
  assignee: { name: string } | null;
}

export function FlyerSection({
  eventId,
  flyer,
  lcLeads,
  currentUserId,
}: {
  eventId: string;
  flyer: FlyerTask | null;
  lcLeads: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!flyer) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <span>📰</span>
            <span className="text-sm">No flyer task</span>
          </div>
          <form action={async (fd) => { await updateFlyerTask(eventId, fd); }}>
            <input type="hidden" name="designStatus" value="NOT_STARTED" />
            <button type="submit" className="btn-secondary btn-sm">+ Add Flyer Task</button>
          </form>
        </div>
      </div>
    );
  }

  const channels = [
    { key: "distYaleConnect", label: "YaleConnect", checked: flyer.distYaleConnect },
    { key: "distEmail", label: "Email", checked: flyer.distEmail },
    { key: "distWhatsApp", label: "WhatsApp", checked: flyer.distWhatsApp },
    { key: "distTeams", label: "Teams", checked: flyer.distTeams },
  ];

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">📰</span>
          <h3 className="section-title">Flyer / Marketing</h3>
          <StatusBadge status={flyer.designStatus} />
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
            taskType="flyer"
            assignee={flyer.assignee ? { id: flyer.assigneeId || undefined, name: flyer.assignee.name } : null}
            acceptedAt={flyer.acceptedAt}
            currentUserId={currentUserId}
            lcLeads={lcLeads}
          />
        </div>

        {!editing ? (
          <div className="space-y-3">
            {flyer.flyerUrl && (
              <div>
                <span className="text-xs text-gray-500">Flyer</span>
                <a href={flyer.flyerUrl} target="_blank" rel="noopener" className="block text-sm text-yale-accent hover:underline">
                  View Flyer →
                </a>
              </div>
            )}
            <div>
              <span className="text-xs text-gray-500 block mb-1">Distribution</span>
              <div className="flex gap-3 flex-wrap">
                {channels.map((ch) => (
                  <span
                    key={ch.key}
                    className={`badge ${ch.checked ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-400"}`}
                  >
                    {ch.checked ? "✓" : "○"} {ch.label}
                  </span>
                ))}
                {flyer.distOther && (
                  <span className="badge bg-blue-50 text-blue-700">+ {flyer.distOther}</span>
                )}
              </div>
            </div>
            {flyer.notes && (
              <div>
                <span className="text-xs text-gray-500">Notes</span>
                <div className="text-sm text-gray-700">{flyer.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <form
            action={async (fd) => {
              await updateFlyerTask(eventId, fd);
              setEditing(false);
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Design Status</label>
                <select name="designStatus" className="input" defaultValue={flyer.designStatus}>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label className="label">Flyer URL</label>
                <input name="flyerUrl" className="input" defaultValue={flyer.flyerUrl || ""} placeholder="Link to Canva, Google Drive, etc." />
              </div>
            </div>
            <div>
              <label className="label">Distribution Channels</label>
              <div className="flex flex-wrap gap-4 mt-1">
                {channels.map((ch) => (
                  <label key={ch.key} className="flex items-center gap-1.5 text-sm">
                    <input type="hidden" name={ch.key} value="false" />
                    <input type="checkbox" name={ch.key} value="true" defaultChecked={ch.checked} className="rounded" />
                    {ch.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Other Channels</label>
              <input name="distOther" className="input" defaultValue={flyer.distOther || ""} placeholder="e.g. Instagram, Bulletin board" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" className="input" rows={2} defaultValue={flyer.notes || ""} />
            </div>
            <button type="submit" className="btn-primary btn-sm">Save</button>
          </form>
        )}
      </div>
    </div>
  );
}
