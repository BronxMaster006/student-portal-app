import Link from "next/link";
import { ActivityType } from "@prisma/client";
import { Heartbeat } from "@/components/heartbeat";
import { LogoutButton } from "@/components/logout-button";
<<<<<<< HEAD
import { AdminUserManagement } from "@/components/admin-user-management";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.id) {
    await logActivity(session.user.id, ActivityType.ADMIN_VIEW, "Admin-Dashboard geöffnet");
  }

  const [users, activities, errors] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        role: true,
        lastSeenAt: true,
        lastLoginAt: true
      }
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { firstName: true } } }
    }),
    prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { firstName: true } } }
    })
  ]);
=======
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatActivityLabel(type: ActivityType) {
  switch (type) {
    case "LOGIN_SUCCESS":
      return "Login erfolgreich";
    case "LOGIN_FAILED":
      return "Login fehlgeschlagen";
    case "REGISTER_SUCCESS":
      return "Registrierung erfolgreich";
    case "REGISTER_FAILED":
      return "Registrierung fehlgeschlagen";
    default:
      return type;
  }
}

export default async function AdminPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const activityLogs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: true,
    },
  });

  const errorLogs = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: true,
    },
  });
>>>>>>> main

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-6xl space-y-6">
<<<<<<< HEAD
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin/info" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">Info-Posts verwalten</Link>
=======
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">Adminbereich</p>
            <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/info"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Info erstellen
            </Link>
            <Link
              href="/app"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-white"
            >
              Zurück zum Portal
            </Link>
>>>>>>> main
            <LogoutButton />
          </div>
        </header>

<<<<<<< HEAD
        <AdminUserManagement
          initialUsers={users.map((user) => ({
            ...user,
            lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
            lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null
          }))}
          currentUserId={session?.user?.id}
        />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Letzte Login-Aktivitäten</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {activities.map((entry) => (
                <li key={entry.id}>
                  [{entry.createdAt.toLocaleString("de-DE")}] {entry.user.firstName}: {entry.type} – {entry.message}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Letzte Fehler</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              {errors.map((entry) => (
                <li key={entry.id}>
                  [{entry.createdAt.toLocaleString("de-DE")}] {entry.user?.firstName ?? "System"} – {entry.route ?? "-"}: {entry.message}
                </li>
              ))}
            </ul>
          </div>
=======
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-2 text-lg font-semibold">Nutzer</h2>
            <p className="text-3xl font-bold">{users.length}</p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-2 text-lg font-semibold">Admin</h2>
            <p className="text-sm text-slate-300">
              Eingeloggt als {session?.user?.name ?? "Unbekannt"}
            </p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-2 text-lg font-semibold">Info-Verwaltung</h2>
            <p className="text-sm text-slate-300">
              Beiträge erstellen und Hinweise verwalten.
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Registrierte Nutzer</h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{user.firstName}</p>
                    <p className="text-xs text-slate-400">{user.role}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>
                      Letzter Login:{" "}
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleString("de-DE")
                        : "Noch nie"}
                    </p>
                    <p>
                      Letzte Aktivität:{" "}
                      {user.lastSeenAt
                        ? new Date(user.lastSeenAt).toLocaleString("de-DE")
                        : "Keine Daten"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Aktivitätslog</h2>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-sm text-slate-400">Keine Aktivitäten vorhanden.</p>
              ) : (
                activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                  >
                    <p className="font-medium">{formatActivityLabel(log.type)}</p>
                    <p className="text-sm text-slate-300">{log.message}</p>
                    <p className="text-xs text-slate-400">
                      {log.user?.firstName ?? "Unbekannt"} ·{" "}
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section>
          <article className="rounded-xl border border-slate-700 bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Fehlerprotokoll</h2>
            <div className="space-y-3">
              {errorLogs.length === 0 ? (
                <p className="text-sm text-slate-400">Keine Fehler vorhanden.</p>
              ) : (
                errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-red-900 bg-slate-900 px-4 py-3"
                  >
                    <p className="text-sm text-slate-200">{log.message}</p>
                    <p className="text-xs text-slate-400">
                      {log.user?.firstName ?? "Unbekannt"} ·{" "}
                      {log.route ?? "Keine Route"} ·{" "}
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
>>>>>>> main
        </section>
      </div>
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> main
