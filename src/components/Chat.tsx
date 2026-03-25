"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendMessage, type SendMessageState } from "@/app/app/chat/actions";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    firstName: string;
  };
};

type OnlineUser = {
  id: string;
  firstName: string;
  lastSeenAt: string;
};

type ChatProps = {
  messages: ChatMessage[];
  onlineUsers: OnlineUser[];
};

const initialState: SendMessageState = { ok: false };

export function Chat({ messages, onlineUsers }: ChatProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(sendMessage, initialState);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 3000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <section className="space-y-6 rounded-xl border border-slate-700 bg-card p-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">Gruppenchat</h2>
        <p className="text-sm text-slate-300">Hier können alle eingeloggten Nutzer miteinander schreiben.</p>
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
              <p className="text-sm text-slate-100 whitespace-pre-wrap">{message.content}</p>
              <p className="mt-2 text-xs text-slate-400">
                {message.author.firstName} • {new Date(message.createdAt).toLocaleString("de-DE")}
              </p>
            </article>
          ))
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <label htmlFor="chat-content" className="block text-sm text-slate-300">
          Nachricht
        </label>
        <textarea
          id="chat-content"
          name="content"
          rows={3}
          maxLength={500}
          required
          placeholder="Schreibe eine Nachricht an die Gruppe..."
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
        />

        {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-emerald-300">Nachricht wurde gesendet.</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Sende..." : "Nachricht senden"}
        </button>
      </form>
    </section>
  );
}
