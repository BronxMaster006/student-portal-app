"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heartbeat } from "@/components/heartbeat";

type ApiResponse = { error?: string; ok?: boolean };

type InfoPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type InfoListResponse = {
  posts?: InfoPost[];
  error?: string;
};

export default function AdminInfoPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<InfoPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  async function loadPosts() {
    setLoadingPosts(true);
    const response = await fetch("/api/info", { cache: "no-store" });
    const data = (await response.json()) as InfoListResponse;

    if (!response.ok) {
      setError(data.error ?? "Beiträge konnten nicht geladen werden.");
      setLoadingPosts(false);
      return;
    }

    setPosts(data.posts ?? []);
    setLoadingPosts(false);
  }

  useEffect(() => {
    void loadPosts();
  }, []);

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
    await loadPosts();
  }

  function startEdit(post: InfoPost) {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setError(null);
    setSuccess(null);
  }

  async function saveEdit(postId: string) {
    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/info/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent })
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setError(data.error ?? "Aktualisierung fehlgeschlagen.");
      return;
    }

    setSuccess("Beitrag wurde aktualisiert.");
    setEditingPostId(null);
    await loadPosts();
  }

  async function deletePost(postId: string) {
    if (!window.confirm("Möchtest du diesen Beitrag wirklich löschen?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    const response = await fetch(`/api/info/${postId}`, {
      method: "DELETE"
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setError(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }

    setSuccess("Beitrag wurde gelöscht.");
    await loadPosts();
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

        <section className="rounded-xl border border-slate-700 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Bestehende Beiträge</h2>
          {loadingPosts ? <p className="text-sm text-slate-300">Beiträge werden geladen...</p> : null}
          {!loadingPosts && posts.length === 0 ? <p className="text-sm text-slate-300">Noch keine Beiträge vorhanden.</p> : null}
          <div className="space-y-4">
            {posts.map((post) => {
              const isEditing = editingPostId === post.id;
              const preview = post.content.length > 160 ? `${post.content.slice(0, 160)}...` : post.content;

              return (
                <article key={post.id} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
                      />
                      <textarea
                        value={editContent}
                        onChange={(event) => setEditContent(event.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(post.id)}
                          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                          Speichern
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPostId(null)}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{post.title}</h3>
                        <p className="text-xs text-slate-400">Erstellt am {new Date(post.createdAt).toLocaleString("de-DE")}</p>
                      </div>
                      <p className="text-sm text-slate-300">{preview}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:border-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
