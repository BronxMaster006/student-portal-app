import { prisma } from "@/lib/prisma";
import { Heartbeat } from "@/components/heartbeat";

export default async function InfoPage() {
  const posts = await prisma.infoPost.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          firstName: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Info-Seiten</h1>
          <p className="text-sm text-slate-300">
            Wichtige Hinweise, Termine und Ankündigungen.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-card p-6 text-slate-300">
            Noch keine Beiträge vorhanden.
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-slate-700 bg-card p-6"
            >
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Von {post.author.firstName} ·{" "}
                {new Date(post.createdAt).toLocaleString("de-DE")}
              </p>
              <p className="mt-4 whitespace-pre-line text-slate-200">
                {post.content}
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}