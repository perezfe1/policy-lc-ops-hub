"use client";

import { switchAcademicYear, updateAcademicYearSettings } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import toast from "react-hot-toast";

interface YearData {
  id: string;
  label: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  isCurrent: boolean;
  budget: number | null;
  eventCount: number;
}

export function AcademicYearRow({ year, months }: { year: YearData; months: string[] }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMakeCurrent = async () => {
    setLoading(true);
    try {
      await switchAcademicYear(year.id);
      toast.success(`Switched to ${year.label}`);
    } catch {
      toast.error("Failed to switch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${year.isCurrent ? "border-yale-blue/30 bg-yale-blue/5" : "border-gray-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{year.label}</span>
          {year.isCurrent && (
            <span className="badge bg-yale-blue text-white text-[10px]">Current</span>
          )}
          <span className="text-xs text-gray-400">{year.eventCount} events</span>
        </div>
        <div className="flex items-center gap-2">
          {!year.isCurrent && (
            <button onClick={handleMakeCurrent} disabled={loading} className="btn-secondary btn-sm text-xs">
              Set Current
            </button>
          )}
          <button onClick={() => setEditing(!editing)} className="btn-secondary btn-sm text-xs">
            {editing ? "Cancel" : "✏️"}
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 flex gap-4">
        <span>{months[year.startMonth - 1]} {year.startYear} — {months[year.endMonth - 1]} {year.endYear}</span>
        <span>Budget: {year.budget ? formatCurrency(year.budget) : "Not set"}</span>
      </div>

      {editing && (
        <form
          action={async (fd) => {
            setLoading(true);
            try {
              await updateAcademicYearSettings(year.id, fd);
              toast.success("Settings updated");
              setEditing(false);
            } catch {
              toast.error("Failed to update");
            } finally {
              setLoading(false);
            }
          }}
          className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-3"
        >
          <div>
            <label className="label">Start Month</label>
            <select name="startMonth" className="input" defaultValue={year.startMonth}>
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Budget ($)</label>
            <input name="budget" type="number" step="0.01" className="input" defaultValue={year.budget || ""} />
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={loading} className="btn-primary btn-sm">
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
