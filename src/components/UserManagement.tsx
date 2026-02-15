"use client";

import { ROLES } from "@/lib/constants";
import { useState } from "react";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UserManagement({ users }: { users: UserData[] }) {
  const [adding, setAdding] = useState(false);

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
        toast.success("User created!");
        setAdding(false);
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
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
          <form onSubmit={handleAddUser} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input name="name" className="input" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input name="password" type="password" className="input" required minLength={6} />
              </div>
              <div>
                <label className="label">Role</label>
                <select name="role" className="input">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary btn-sm">Create User</button>
          </form>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-medium text-gray-500">Name</th>
              <th className="text-left py-2 font-medium text-gray-500">Email</th>
              <th className="text-left py-2 font-medium text-gray-500">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2 text-gray-900">{u.name}</td>
                <td className="py-2 text-gray-600">{u.email}</td>
                <td className="py-2">
                  <span className="badge bg-yale-blue/10 text-yale-blue text-xs">{u.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
