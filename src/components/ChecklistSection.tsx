"use client";

import { toggleChecklistItem, addChecklistItem } from "@/lib/actions";
import { useState } from "react";

interface ChecklistData {
  id: string;
  notes: string | null;
  items: {
    id: string;
    label: string;
    isChecked: boolean;
    isCustom: boolean;
  }[];
}

export function ChecklistSection({ checklist }: { checklist: ChecklistData | null }) {
  const [newItem, setNewItem] = useState("");

  if (!checklist) return null;

  const done = checklist.items.filter((i) => i.isChecked).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">✅</span>
          <h3 className="section-title">Day-of Checklist</h3>
          <span className="text-xs text-gray-500">
            {done}/{total} ({pct}%)
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Items */}
        <div className="space-y-1">
          {checklist.items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={(e) => toggleChecklistItem(item.id, e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-500"
              />
              <span
                className={`text-sm flex-1 ${
                  item.isChecked ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {item.label}
              </span>
              {item.isCustom && (
                <span className="text-[10px] text-gray-300 opacity-0 group-hover:opacity-100">
                  custom
                </span>
              )}
            </label>
          ))}
        </div>

        {/* Add custom item */}
        <form
          action={async () => {
            if (newItem.trim()) {
              await addChecklistItem(checklist.id, newItem.trim());
              setNewItem("");
            }
          }}
          className="flex gap-2 mt-4 pt-3 border-t border-gray-100"
        >
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a custom item…"
            className="input flex-1 text-sm"
          />
          <button type="submit" disabled={!newItem.trim()} className="btn-secondary btn-sm">
            + Add
          </button>
        </form>
      </div>
    </div>
  );
}
