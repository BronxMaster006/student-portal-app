import Link from "next/link";
import { Heartbeat } from "@/components/heartbeat";

export default function RechnerPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-slate-700 bg-card p-6">
        <h1 className="text-3xl font-bold">Mathe-Rechner</h1>
        <p className="text-slate-300">Dieser Bereich ist als Platzhalter vorbereitet. Hier folgen später Rechentools.</p>
        <Link href="/app" className="inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
          Zurück zur Auswahl
        </Link>
      </div>
    </main>
  );
}
