"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      password: String(formData.get("password") ?? ""),
      inviteCode: String(formData.get("inviteCode") ?? ""),
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: { error?: string; ok?: boolean } = {};

      try {
        data = (await response.json()) as { error?: string; ok?: boolean };
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(data.error ?? "Registrierung fehlgeschlagen.");
        return;
      }

      setLoading(false);
      router.push("/login");
    } catch {
      setError("Netzwerkfehler bei der Registrierung.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-2xl border border-slate-700 bg-card p-8 shadow-2xl shadow-black/30">
        <h1 className="mb-2 text-2xl font-bold">Neues Konto erstellen</h1>
        <p className="mb-6 text-sm text-slate-300">
          Du brauchst einen gültigen Invite-Code.
        </p>

        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Vorname</label>
            <input
              name="firstName"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Passwort</label>
            <input
              name="password"
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">Invite-Code</label>
            <input
              name="inviteCode"
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-accent p-3 font-medium text-white transition hover:opacity-90"
          >
            {loading ? "Registrierung läuft..." : "Registrieren"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Schon registriert?{" "}
          <Link href="/login" className="text-accent">
            Zum Login
          </Link>
        </p>
      </section>
    </main>
  );
}