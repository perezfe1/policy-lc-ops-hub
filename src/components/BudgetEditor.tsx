"use client";

import { useState } from "react";
import { updateYearlyBudget } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export function BudgetEditor({
  yearId,
  currentBudget,
}: {
  yearId: string;
  currentBudget: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentBudget?.toString() || "");

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) { toast.error("Enter a valid amount"); return; }
    await updateYearlyBudget(yearId, num);
    toast.success("Budget updated");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
        title="Click to edit"
      >
        <span className="text-2xl font-display font-bold text-gray-900">
          {currentBudget ? formatCurrency(currentBudget) : "Not set"}
        </span>
        <span className="text-gray-300 group-hover:text-gray-500 text-xs">✏️</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-gray-400">$</span>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        className="input w-32 text-lg font-bold"
        placeholder="15000"
      />
      <button onClick={handleSave} className="btn-primary btn-sm">Save</button>
      <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
    </div>
  );
}
