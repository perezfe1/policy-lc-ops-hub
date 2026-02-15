"use client";

import { assignTaskLead, acceptTask } from "@/lib/actions";
import { useState } from "react";
import toast from "react-hot-toast";

interface LeadUser {
  id: string;
  name: string;
}

export function TaskAssignment({
  eventId,
  taskType,
  assignee,
  acceptedAt,
  currentUserId,
  lcLeads,
}: {
  eventId: string;
  taskType: "catering" | "room" | "flyer";
  assignee: { id?: string; name: string } | null;
  acceptedAt: Date | string | null;
  currentUserId: string;
  lcLeads: LeadUser[];
}) {
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAssignedToMe = assignee?.id === currentUserId;
  const isAccepted = !!acceptedAt;

  const handleAssign = async (leadId: string) => {
    setLoading(true);
    try {
      await assignTaskLead(eventId, taskType, leadId);
      toast.success("Lead assigned & notified by email");
      setAssigning(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to assign");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptTask(eventId, taskType);
      toast.success("Task accepted!");
    } catch {
      toast.error("Failed to accept");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 text-sm">
      {assignee ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-yale-blue/10 flex items-center justify-center text-xs font-bold text-yale-blue">
            {assignee.name.charAt(0)}
          </div>
          <span className="text-gray-700 font-medium">{assignee.name}</span>

          {isAccepted ? (
            <span className="badge bg-green-100 text-green-700 text-[10px]">✓ Accepted</span>
          ) : (
            <>
              <span className="badge bg-yellow-100 text-yellow-700 text-[10px]">Pending acceptance</span>
              {isAssignedToMe && (
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="btn-success btn-sm text-xs ml-1"
                >
                  {loading ? "..." : "Accept Task"}
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setAssigning(true)}
            className="text-xs text-gray-400 hover:text-gray-600 ml-1"
            title="Reassign"
          >
            ✏️
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAssigning(true)}
          className="btn-secondary btn-sm text-xs"
        >
          👤 Assign LC Lead
        </button>
      )}

      {assigning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setAssigning(false)}>
          <div className="bg-white rounded-xl shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-3">
              Assign LC Lead — {taskType === "catering" ? "Catering" : taskType === "room" ? "Room" : "Flyer"}
            </h3>
            {lcLeads.length === 0 ? (
              <p className="text-sm text-gray-500">No LC Leads found. Add users with the LC_LEAD role first.</p>
            ) : (
              <div className="space-y-1">
                {lcLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleAssign(lead.id)}
                    disabled={loading}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-yale-blue/5 transition-colors flex items-center gap-2 ${
                      assignee?.id === lead.id ? "bg-yale-blue/10 font-medium" : ""
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-yale-blue/10 flex items-center justify-center text-xs font-bold text-yale-blue">
                      {lead.name.charAt(0)}
                    </div>
                    {lead.name}
                    {assignee?.id === lead.id && <span className="text-xs text-gray-400 ml-auto">Current</span>}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setAssigning(false)} className="btn-secondary btn-sm w-full mt-3">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
