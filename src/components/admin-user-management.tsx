"use client";

import { useState } from "react";

type UserRow = {
  id: string;
  firstName: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  lastSeenAt: string | null;
  lastLoginAt: string | null;
};

type PatchResponse = {
  ok?: boolean;
  error?: string;
  data?: {
    user?: {
      id: string;
      isActive: boolean;
    };
  };
};

type AdminUserManagementProps = {
  initialUsers: UserRow[];
  currentUserId?: string;
};

export function AdminUserManagement({
  initialUsers,
  currentUserId,
}: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const now = Date.now();

  async function toggleUserActive(userId: string, nextIsActive: boolean) {
    const confirmText = nextIsActive
      ? "Möchtest du diesen Nutzer wirklich reaktivieren?"
      : "Möchtest du diesen Nutzer wirklich deaktivieren?";

    if (!window.confirm(confirmText)) {
      return;
    }

    setPendingUserId(userId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      const data = (await response.json()) as PatchResponse;

      if (!response.ok || !data.ok) {
        setError(
          data.error ??
            (nextIsActive
              ? "Nutzer konnte nicht reaktiviert werden."
              : "Nutzer konnte nicht deaktiviert werden.")
        );
        setPendingUserId(null);
        return;
      }

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId ? { ...user, isActive: nextIsActive } : user
        )
      );

      setMessage(
        nextIsActive
          ? "Nutzer wurde reaktiviert."
          : "Nutzer wurde deaktiviert."
      );
    } catch {
      setError("Netzwerkfehler bei der Benutzerverwaltung.");
    } finally {
      setPendingUserId(null);
    }
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
              <th className="p-2">Status</th>
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
              const online =
                user.isActive && lastSeenDate
                  ? now - lastSeenDate.getTime() <= 60000
                  : false;
              const isCurrentUser = currentUserId === user.id;
              const isPending = pendingUserId === user.id;

              return (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="p-2">{user.firstName}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">
                    {user.isActive ? (
                      <span className="text-emerald-300">Aktiv</span>
                    ) : (
                      <span className="text-slate-400">Deaktiviert</span>
                    )}
                  </td>
                  <td className="p-2">{online ? "Online" : "Offline"}</td>
                  <td className="p-2">
                    {lastSeenDate ? lastSeenDate.toLocaleString("de-DE") : "-"}
                  </td>
                  <td className="p-2">
                    {lastLoginDate ? lastLoginDate.toLocaleString("de-DE") : "-"}
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => toggleUserActive(user.id, !user.isActive)}
                      disabled={isPending || isCurrentUser}
                      className={`rounded-lg border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        user.isActive
                          ? "border-red-500/50 text-red-300 hover:border-red-400"
                          : "border-emerald-500/50 text-emerald-300 hover:border-emerald-400"
                      }`}
                    >
                      {isCurrentUser
                        ? "Eigener Account"
                        : isPending
                        ? user.isActive
                          ? "Deaktivieren..."
                          : "Reaktivieren..."
                        : user.isActive
                        ? "Deaktivieren"
                        : "Reaktivieren"}
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