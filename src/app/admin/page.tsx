<<<<<<< HEAD
=======
import Link from "next/link";
>>>>>>> codex-new
import { ActivityType } from "@prisma/client";
import { Heartbeat } from "@/components/heartbeat";
import { LogoutButton } from "@/components/logout-button";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.id) {
    await logActivity(session.user.id, ActivityType.ADMIN_VIEW, "Admin-Dashboard geöffnet");
  }

  const [users, activities, errors] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
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

  const now = Date.now();

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-6xl space-y-6">
<<<<<<< HEAD
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          <LogoutButton />
=======
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin/info" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">Info erstellen</Link>
            <LogoutButton />
          </div>
>>>>>>> codex-new
        </header>

        <section className="rounded-xl border border-slate-700 bg-card p-5">
          <h2 className="mb-4 text-xl font-semibold">Registrierte Nutzer</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-300">
                <tr>
                  <th className="p-2">Vorname</th>
                  <th className="p-2">Rolle</th>
                  <th className="p-2">Online</th>
                  <th className="p-2">Last Seen</th>
                  <th className="p-2">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const online = user.lastSeenAt ? now - user.lastSeenAt.getTime() <= 60000 : false;
                  return (
                    <tr key={user.id} className="border-t border-slate-800">
                      <td className="p-2">{user.firstName}</td>
                      <td className="p-2">{user.role}</td>
                      <td className="p-2">{online ? "Online" : "Offline"}</td>
                      <td className="p-2">{user.lastSeenAt ? user.lastSeenAt.toLocaleString("de-DE") : "-"}</td>
                      <td className="p-2">{user.lastLoginAt ? user.lastLoginAt.toLocaleString("de-DE") : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

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
        </section>
      </div>
    </main>
  );
}
