import Link from "next/link";

type AppHeaderProps = {
  title: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-700 bg-card px-4 py-3">
      <Link href="/app" className="text-sm text-slate-200 transition hover:text-accent">
        ← Zurück zum Dashboard
      </Link>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
