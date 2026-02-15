"use client";

import { updateRetrospective } from "@/lib/actions";
import { useState } from "react";

export function RetrospectiveSection({
  eventId,
  doAgain,
  reinviteSpeaker,
  retrospectiveNotes,
  headcount,
  hasSpeaker,
}: {
  eventId: string;
  doAgain: boolean | null;
  reinviteSpeaker: boolean | null;
  retrospectiveNotes: string | null;
  headcount: number | null;
  hasSpeaker: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const hasData = doAgain !== null || retrospectiveNotes;

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <h3 className="section-title">Retrospective</h3>
          {hasData && <span className="badge bg-emerald-50 text-emerald-700 text-[10px]">Filled</span>}
        </div>
        <button onClick={() => setEditing(!editing)} className="btn-secondary btn-sm">
          {editing ? "Cancel" : hasData ? "✏️ Edit" : "Fill In"}
        </button>
      </div>

      <div className="p-5">
        {!editing && hasData ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500">Headcount</span>
                <div className="text-gray-900">{headcount || "—"}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Do Again?</span>
                <div className="text-gray-900">
                  {doAgain === true ? "✅ Yes" : doAgain === false ? "❌ No" : "—"}
                </div>
              </div>
              {hasSpeaker && (
                <div>
                  <span className="text-xs text-gray-500">Re-invite Speaker?</span>
                  <div className="text-gray-900">
                    {reinviteSpeaker === true ? "✅ Yes" : reinviteSpeaker === false ? "❌ No" : "—"}
                  </div>
                </div>
              )}
            </div>
            {retrospectiveNotes && (
              <div>
                <span className="text-xs text-gray-500">Notes</span>
                <p className="text-gray-700 whitespace-pre-wrap">{retrospectiveNotes}</p>
              </div>
            )}
          </div>
        ) : editing ? (
          <form
            action={async (fd) => {
              await updateRetrospective(eventId, fd);
              setEditing(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Headcount</label>
              <input name="headcount" type="number" className="input w-32" defaultValue={headcount || ""} placeholder="e.g. 35" />
            </div>
            <div>
              <label className="label">Would you do this event again?</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="doAgain" value="true" defaultChecked={doAgain === true} />
                  Yes
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="doAgain" value="false" defaultChecked={doAgain === false} />
                  No
                </label>
              </div>
            </div>
            {hasSpeaker && (
              <div>
                <label className="label">Re-invite this speaker?</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" name="reinviteSpeaker" value="true" defaultChecked={reinviteSpeaker === true} />
                    Yes
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" name="reinviteSpeaker" value="false" defaultChecked={reinviteSpeaker === false} />
                    No
                  </label>
                </div>
              </div>
            )}
            <div>
              <label className="label">Retrospective Notes</label>
              <textarea
                name="retrospectiveNotes"
                className="input"
                rows={4}
                defaultValue={retrospectiveNotes || ""}
                placeholder="What went well? What could be improved? Lessons learned..."
              />
            </div>
            <button type="submit" className="btn-primary btn-sm">Save Retrospective</button>
          </form>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">
            No retrospective data yet. Click &quot;Fill In&quot; to record learnings.
          </p>
        )}
      </div>
    </div>
  );
}
