"use client";

import { addExpense, deleteExpense, toggleExpensePaid } from "@/lib/actions";
import { formatCurrency } from "@/lib/utils";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { useState } from "react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  vendor: string | null;
  isPaid: boolean;
  notes: string | null;
}

export function ExpenseSection({
  eventId,
  expenses,
}: {
  eventId: string;
  expenses: Expense[];
}) {
  const [adding, setAdding] = useState(false);
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const paid = expenses.filter((e) => e.isPaid).reduce((s, x) => s + x.amount, 0);

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">💰</span>
          <h3 className="section-title">Expenses</h3>
          <span className="text-xs text-gray-500">
            {formatCurrency(paid)} / {formatCurrency(total)}
          </span>
        </div>
        <button onClick={() => setAdding(!adding)} className="btn-secondary btn-sm">
          {adding ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      <div className="p-5">
        {/* Add form */}
        {adding && (
          <form
            action={async (fd) => {
              await addExpense(eventId, fd);
              setAdding(false);
            }}
            className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Description *</label>
                <input name="description" className="input" placeholder="What is this expense for?" required />
              </div>
              <div>
                <label className="label">Amount *</label>
                <input name="amount" type="number" step="0.01" className="input" placeholder="0.00" required />
              </div>
              <div>
                <label className="label">Category</label>
                <select name="category" className="input">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vendor</label>
                <input name="vendor" className="input" placeholder="e.g. Bon Appetit" />
              </div>
              <div>
                <label className="label">Notes</label>
                <input name="notes" className="input" placeholder="Optional notes" />
              </div>
            </div>
            <button type="submit" className="btn-primary btn-sm">Add Expense</button>
          </form>
        )}

        {/* Expense list */}
        {expenses.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">
            No expenses yet.
          </div>
        ) : (
          <div className="space-y-1">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => toggleExpensePaid(exp.id, eventId)}
                    className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 ${
                      exp.isPaid
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {exp.isPaid && "✓"}
                  </button>
                  <div className="min-w-0">
                    <div className={`text-sm ${exp.isPaid ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {exp.description}
                    </div>
                    <div className="text-xs text-gray-400">
                      {EXPENSE_CATEGORY_LABELS[exp.category as keyof typeof EXPENSE_CATEGORY_LABELS] || exp.category}
                      {exp.vendor && ` · ${exp.vendor}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-medium ${exp.isPaid ? "text-gray-400" : "text-gray-900"}`}>
                    {formatCurrency(exp.amount)}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this expense?")) {
                        deleteExpense(exp.id, eventId);
                      }
                    }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
