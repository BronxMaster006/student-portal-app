"use client";

import Link from "next/link";
import { useState } from "react";
import { Heartbeat } from "@/components/heartbeat";

type ApiResponse = { error?: string; ok?: boolean };

export default function AdminInfoPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? "")
    };

    const response = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setError(data.error ?? "Speichern fehlgeschlagen.");
      setLoading(false);
      return;
    }

    setSuccess("Beitrag wurde veröffentlicht.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Info-Beitrag erstellen</h1>
            <p className="text-sm text-slate-300">Neue Hinweise für alle eingeloggten Nutzer veröffentlichen.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
            Zurück
          </Link>
        </header>

        <section className="rounded-xl border border-slate-700 bg-card p-6">
          <form action={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Titel</label>
              <input
                name="title"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Inhalt</label>
              <textarea
                name="content"
                rows={8}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
                required
              />
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
            <button disabled={loading} className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90">
              {loading ? "Speichern..." : "Beitrag veröffentlichen"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
