import Link from "next/link";
import { Heartbeat } from "@/components/heartbeat";
import { prisma } from "@/lib/prisma";

export default async function InfoPage() {
  const posts = await prisma.infoPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { firstName: true } } }
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Info-Seiten</h1>
            <p className="text-sm text-slate-300">Alle wichtigen Hinweise auf einen Blick.</p>
          </div>
          <Link href="/app" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
            Zurück
          </Link>
        </header>

        {posts.length === 0 ? (
          <section className="rounded-xl border border-slate-700 bg-card p-6 text-slate-300">
            Aktuell gibt es noch keine veröffentlichten Info-Beiträge.
          </section>
        ) : (
          <section className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-xl border border-slate-700 bg-card p-6">
                <h2 className="text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-slate-200">{post.content}</p>
                <p className="mt-4 text-xs text-slate-400">
                  Von {post.author.firstName} am {post.createdAt.toLocaleString("de-DE")}
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
