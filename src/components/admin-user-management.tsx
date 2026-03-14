"use client";

import { useState } from "react";

type UserRow = {
  id: string;
  firstName: string;
  role: "USER" | "ADMIN";
  lastSeenAt: string | null;
  lastLoginAt: string | null;
};

type DeleteResponse = {
  ok?: boolean;
  error?: string;
};

type AdminUserManagementProps = {
  initialUsers: UserRow[];
  currentUserId?: string;
};

export function AdminUserManagement({ initialUsers, currentUserId }: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const now = Date.now();

  async function deleteUser(userId: string) {
    if (!window.confirm("Möchtest du diesen Nutzer wirklich löschen?")) {
      return;
    }

    setPendingDeleteId(userId);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = (await response.json()) as DeleteResponse;

    if (!response.ok) {
      setError(data.error ?? "Nutzer konnte nicht gelöscht werden.");
      setPendingDeleteId(null);
      return;
    }

    setUsers((previous) => previous.filter((user) => user.id !== userId));
    setMessage("Nutzer wurde gelöscht.");
    setPendingDeleteId(null);
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-card p-5">
      <h2 className="mb-4 text-xl font-semibold">Benutzer verwalten</h2>
      {message ? <p className="mb-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="p-2">Vorname</th>
              <th className="p-2">Rolle</th>
              <th className="p-2">Online</th>
              <th className="p-2">Last Seen</th>
              <th className="p-2">Last Login</th>
              <th className="p-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const lastSeenDate = user.lastSeenAt ? new Date(user.lastSeenAt) : null;
              const lastLoginDate = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
              const online = lastSeenDate ? now - lastSeenDate.getTime() <= 60000 : false;
              const isCurrentUser = currentUserId === user.id;

              return (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="p-2">{user.firstName}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{online ? "Online" : "Offline"}</td>
                  <td className="p-2">{lastSeenDate ? lastSeenDate.toLocaleString("de-DE") : "-"}</td>
                  <td className="p-2">{lastLoginDate ? lastLoginDate.toLocaleString("de-DE") : "-"}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      disabled={pendingDeleteId === user.id || isCurrentUser}
                      className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-300 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCurrentUser ? "Eigener Account" : pendingDeleteId === user.id ? "Löschen..." : "Löschen"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
