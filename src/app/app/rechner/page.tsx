import { Heartbeat } from "@/components/heartbeat";
import { AppHeader } from "@/components/app-header";

export default function RechnerPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-700 bg-card p-6">
        <AppHeader title="Mathe-Rechner" />
        <p className="text-slate-300">Dieser Bereich ist als Platzhalter vorbereitet. Hier folgen später Rechentools.</p>
      </div>
    </main>
  );
}
