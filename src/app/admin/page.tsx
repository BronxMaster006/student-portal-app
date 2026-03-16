import Link from "next/link";
import { ActivityType } from "@prisma/client";
import { Heartbeat } from "@/components/heartbeat";
import { LogoutButton } from "@/components/logout-button";
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
        createdAt: true,
        lastSeenAt: true,
        lastLoginAt: true,
        isActive: true,
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { firstName: true } } },
    }),
    prisma.errorLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { firstName: true } } },
    }),
  ]);

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/info"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
            >
              Info-Posts verwalten
            </Link>
            <LogoutButton />
          </div>
        </header>

        <AdminUserManagement
          initialUsers={users.map((user) => ({
            ...user,
            createdAt: user.createdAt.toISOString(),
            lastSeenAt: user.lastSeenAt ? user.lastSeenAt.toISOString() : null,
            lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
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
                  [{entry.createdAt.toLocaleString("de-DE")}] {entry.user?.firstName ?? "System"} –{" "}
                  {entry.route ?? "-"}: {entry.message}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}