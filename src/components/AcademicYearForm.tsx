"use client";

import { createAcademicYear } from "@/lib/actions";
import { useState } from "react";
import toast from "react-hot-toast";

export function AcademicYearForm({ months }: { months: string[] }) {
  const [loading, setLoading] = useState(false);
  const currentCalYear = new Date().getFullYear();

  return (
    <form
      action={async (fd) => {
        setLoading(true);
        try {
          await createAcademicYear(fd);
          toast.success("Academic year created");
        } catch {
          toast.error("Failed to create");
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Label</label>
          <input name="label" className="input" placeholder="e.g. 2026-2027" />
        </div>
        <div>
          <label className="label">Start Year</label>
          <input name="startYear" type="number" className="input" defaultValue={currentCalYear} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Month</label>
          <select name="startMonth" className="input" defaultValue="9">
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Yearly Budget ($)</label>
          <input name="budget" type="number" step="0.01" className="input" placeholder="15000" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isCurrent" value="true" className="rounded" />
        Set as current academic year
      </label>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Creating…" : "Create Academic Year"}
      </button>
    </form>
  );
}
