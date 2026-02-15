"use client";

import { useState, useRef, useEffect } from "react";
import { switchAcademicYear } from "@/lib/actions";
import toast from "react-hot-toast";

interface AcademicYear {
  id: string;
  label: string;
  isCurrent: boolean;
}

export function AcademicYearSwitcher({
  years,
  currentYearId,
}: {
  years: AcademicYear[];
  currentYearId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLabel = years.find((y) => y.id === currentYearId)?.label || "All Years";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (yearId: string) => {
    if (yearId === currentYearId) { setOpen(false); return; }
    setLoading(true);
    try {
      await switchAcademicYear(yearId);
      toast.success("Academic year switched");
    } catch {
      toast.error("Failed to switch year");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  if (years.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
      >
        🎓 {currentLabel}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {years.map((year) => (
            <button
              key={year.id}
              onClick={() => handleSwitch(year.id)}
              disabled={loading}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                year.id === currentYearId ? "font-medium text-yale-blue" : "text-gray-700"
              }`}
            >
              {year.label}
              {year.id === currentYearId && <span className="text-xs text-yale-accent">●</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
