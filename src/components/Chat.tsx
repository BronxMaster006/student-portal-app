import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/app/app/chat/actions";

const ONLINE_WINDOW_IN_MS = 2 * 60 * 1000;

export async function Chat() {
  const onlineSince = new Date(Date.now() - ONLINE_WINDOW_IN_MS);

  const [latestMessages, onlineUsers] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { firstName: true } } }
    }),
    prisma.user.findMany({
      where: {
        lastSeenAt: { gte: onlineSince },
        isActive: true
      },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastSeenAt: true }
    })
  ]);

  const messages = [...latestMessages].reverse();

  return (
    <section className="space-y-6 rounded-xl border border-slate-700 bg-card p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Gruppenchat</h2>
        <p className="text-sm text-slate-300">Alle eingeloggten Nutzer können hier Nachrichten schreiben.</p>
      </header>

      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Online ({onlineUsers.length})</h3>
        {onlineUsers.length === 0 ? (
          <p className="text-sm text-slate-400">Aktuell ist niemand online.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {onlineUsers.map((user) => (
              <li key={user.id} className="rounded-full border border-emerald-500/40 bg-emerald-900/20 px-3 py-1 text-xs text-emerald-200">
                {user.firstName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Nachrichten vorhanden.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-sm text-slate-100">{message.content}</p>
              <p className="mt-2 text-xs text-slate-400">
                {message.author.firstName} • {message.createdAt.toLocaleString("de-DE")}
              </p>
            </article>
          ))
        )}
      </div>

      <form action={sendMessage} className="space-y-3">
        <label htmlFor="chat-content" className="block text-sm text-slate-300">
          Nachricht
        </label>
        <textarea
          id="chat-content"
          name="content"
          rows={3}
          required
          maxLength={500}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
          placeholder="Schreibe eine Nachricht an die Gruppe..."
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Nachricht senden
        </button>
      </form>
    </section>
  );
}
