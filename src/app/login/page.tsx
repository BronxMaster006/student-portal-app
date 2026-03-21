import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-2xl border border-slate-700 bg-card p-8 shadow-2xl shadow-black/30">
        <h1 className="mb-2 text-2xl font-bold">Willkommen zurück</h1>
        <p className="mb-6 text-sm text-slate-300">Melde dich mit Vorname und Passwort an.</p>
        <LoginForm />
        <p className="mt-6 text-sm text-slate-300">
          Noch kein Konto? <Link href="/register" className="text-accent">Jetzt registrieren</Link>
        </p>
      </section>
    </main>
  );
}
