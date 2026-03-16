import Link from "next/link";
import { auth } from "@/lib/auth";
import { Heartbeat } from "@/components/heartbeat";
import { LogoutButton } from "@/components/logout-button";

const cards = [
  {
    title: "Spiele",
    description: "Hier findest du bald kleine Lern- und Fun-Games.",
    href: "/app/spiele"
  },
  {
    title: "Info-Seiten",
    description: "Wichtige Hinweise, Termine und Dokumente.",
    href: "/app/info"
  },
  {
    title: "Mathe-Rechner",
    description: "Nützliche Rechentools als Platzhalterbereich.",
    href: "/app/rechner"
  }
];

export default async function AppPage() {
  const session = await auth();

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-300">Eingeloggt als</p>
            <h1 className="text-3xl font-bold">Hallo, {session?.user?.name ?? "Nutzer"}</h1>
          </div>
          <div className="flex items-center gap-3">
            {session?.user?.role === "ADMIN" ? (
              <Link href="/admin" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">Admin-Dashboard</Link>
            ) : null}
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-xl border border-slate-700 bg-card p-5 transition hover:border-accent">
              <h2 className="mb-2 text-xl font-semibold">{card.title}</h2>
              <p className="text-sm text-slate-300">{card.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
