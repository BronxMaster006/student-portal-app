"use client";

import { useMemo, useState } from "react";
import { Toast } from "@/components/toast";

type UserRow = {
  id: string;
  firstName: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastSeenAt: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  data?: { user?: { id: string; isActive: boolean } };
};

type AdminUserManagementProps = {
  initialUsers: UserRow[];
  currentUserId?: string;
};

const PAGE_SIZE = 10;

export function AdminUserManagement({ initialUsers, currentUserId }: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return users;
    }
    return users.filter((user) => user.firstName.toLowerCase().includes(trimmed));
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const now = Date.now();

  async function updateActiveStatus(user: UserRow, nextIsActive: boolean) {
    const actionText = nextIsActive ? "reaktivieren" : "deaktivieren";

    if (!window.confirm(`Möchtest du diesen Nutzer wirklich ${actionText}?`)) {
      return;
    }

    setPendingId(user.id);
    setToast(null);

    let data: ApiResponse;

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextIsActive })
      });

      const parsed = (await response.json().catch(() => ({ ok: false, error: "Ungültige Serverantwort." }))) as ApiResponse;
      data = parsed;

      if (!response.ok || !data.ok) {
        setToast({ message: data.error ?? "Status konnte nicht geändert werden.", type: "error" });
        setPendingId(null);
        return;
      }
    } catch {
      setToast({ message: "Netzwerkfehler bei der Anfrage.", type: "error" });
      setPendingId(null);
      return;
    }

    setUsers((previous) => previous.map((entry) => (entry.id === user.id ? { ...entry, isActive: nextIsActive } : entry)));
    setToast({ message: nextIsActive ? "Nutzer wurde reaktiviert." : "Nutzer wurde deaktiviert.", type: "success" });
    setPendingId(null);
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-card p-5">
      <h2 className="mb-4 text-xl font-semibold">Benutzer verwalten</h2>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Nach Vorname suchen"
          className="w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-slate-400">Seite {currentPage} von {totalPages}</p>
      </div>

      {toast ? <Toast message={toast.message} type={toast.type} /> : null}

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="p-2">Vorname</th>
              <th className="p-2">Rolle</th>
              <th className="p-2">Status</th>
              <th className="p-2">Erstellt</th>
              <th className="p-2">Last Seen</th>
              <th className="p-2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const lastSeenDate = user.lastSeenAt ? new Date(user.lastSeenAt) : null;
              const online = user.isActive && lastSeenDate ? now - lastSeenDate.getTime() <= 60000 : false;
              const isCurrentUser = currentUserId === user.id;

              return (
                <tr key={user.id} className="border-t border-slate-800">
                  <td className="p-2">{user.firstName}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.isActive ? (online ? "Aktiv (online)" : "Aktiv") : "Deaktiviert"}</td>
                  <td className="p-2">{new Date(user.createdAt).toLocaleString("de-DE")}</td>
                  <td className="p-2">{lastSeenDate ? lastSeenDate.toLocaleString("de-DE") : "-"}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => updateActiveStatus(user, !user.isActive)}
                      disabled={pendingId === user.id || isCurrentUser}
                      className="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-200 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCurrentUser
                        ? "Eigener Account"
                        : pendingId === user.id
                          ? "Speichern..."
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

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-60"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 disabled:opacity-60"
        >
          Weiter
        </button>
      </div>
    </section>
  );
}
