"use client";

import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { useState } from "react";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UserManagement({ users: initialUsers }: { users: UserData[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: string; password: string }>({
    name: "", email: "", role: "", password: "",
  });

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          role: fd.get("role"),
        }),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, { ...newUser, createdAt: new Date().toISOString() }]);
        toast.success("User created!");
        setAdding(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
      }
    } catch {
      toast.error("Network error");
    }
  }

  function startEdit(user: UserData) {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role, password: "" });
  }

  async function handleSaveEdit(id: string) {
    try {
      const body: Record<string, string> = { id, name: editForm.name, email: editForm.email, role: editForm.role };
      if (editForm.password.length > 0) body.password = editForm.password;

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map((u) => u.id === id ? { ...u, ...updated } : u));
        toast.success("User updated!");
        setEditingId(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== id));
        toast.success("User deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="section-title">User Management</h2>
        <button onClick={() => setAdding(!adding)} className="btn-secondary btn-sm">
          {adding ? "Cancel" : "+ Add User"}
        </button>
      </div>
      <div className="p-5">
        {adding && (
          <form onSubmit={handleAddUser} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" placeholder="jane@yale.edu" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" className="input" placeholder="Min 6 characters" required minLength={6} />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" className="input">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary btn-sm">Create User</button>
          </form>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="border rounded-lg p-4">
              {editingId === u.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name</label>
                      <input
                        className="input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <select
                        className="input"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r as keyof typeof ROLE_LABELS] || r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">New Password <span className="text-gray-400 font-normal">(leave blank to keep)</span></label>
                      <input
                        type="password"
                        className="input"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(u.id)} className="btn-primary btn-sm">Save</button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary btn-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yale-blue/10 flex items-center justify-center text-sm font-bold text-yale-blue">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                    <span className="badge bg-yale-blue/10 text-yale-blue text-xs">
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(u)} className="btn-secondary btn-sm text-xs">✏️ Edit</button>
                    <button onClick={() => handleDelete(u.id, u.name)} className="btn-sm text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
