"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heartbeat } from "@/components/heartbeat";
import { Toast } from "@/components/toast";

type InfoPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  data?: {
    posts?: InfoPost[];
  };
};

export default function AdminInfoPageClient() {
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

    try {
      const response = await fetch("/api/info", { cache: "no-store" });
      const data = (await response.json().catch(() => ({
        ok: false,
        error: "Ungültige Serverantwort.",
      }))) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Beiträge konnten nicht geladen werden.");
        setLoadingPosts(false);
        return;
      }

      setPosts(data.data?.posts ?? []);
      setLoadingPosts(false);
    } catch {
      setError("Netzwerkfehler beim Laden der Beiträge.");
      setLoadingPosts(false);
    }
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
      content: String(formData.get("content") ?? ""),
    };

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({
        ok: false,
        error: "Ungültige Serverantwort.",
      }))) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        setLoading(false);
        return;
      }

      setSuccess("Post erfolgreich gespeichert");
      setLoading(false);
      await loadPosts();
    } catch {
      setError("Netzwerkfehler beim Speichern.");
      setLoading(false);
    }
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

    try {
      const response = await fetch(`/api/info/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });

      const data = (await response.json().catch(() => ({
        ok: false,
        error: "Ungültige Serverantwort.",
      }))) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }

      setSuccess("Post erfolgreich gespeichert");
      setEditingPostId(null);
      await loadPosts();
    } catch {
      setError("Netzwerkfehler beim Speichern.");
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm("Möchtest du diesen Beitrag wirklich löschen?")) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/info/${postId}`, {
        method: "DELETE",
      });

      const data = (await response.json().catch(() => ({
        ok: false,
        error: "Ungültige Serverantwort.",
      }))) as ApiResponse;

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Fehler beim Löschen");
        return;
      }

      setSuccess("Post erfolgreich gelöscht");
      await loadPosts();
    } catch {
      setError("Netzwerkfehler beim Löschen.");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Info-Posts verwalten</h1>
            <p className="text-sm text-slate-300">
              {editingPostId
                ? "Du bearbeitest gerade einen bestehenden Beitrag."
                : "Neue Hinweise für alle eingeloggten Nutzer veröffentlichen."}
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
          >
            Zurück
          </Link>
        </header>

        {error ? <Toast message={error} type="error" /> : null}
        {success ? <Toast message={success} type="success" /> : null}

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
            <button
              disabled={loading}
              className="rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              {loading ? "Speichern..." : "Neuen Beitrag veröffentlichen"}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-700 bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Bestehende Beiträge</h2>
          {loadingPosts ? <p className="text-sm text-slate-300">Laden...</p> : null}
          {!loadingPosts && posts.length === 0 ? (
            <p className="text-sm text-slate-300">Noch keine Beiträge vorhanden.</p>
          ) : null}
          <div className="space-y-4">
            {posts.map((post) => {
              const isEditing = editingPostId === post.id;
              const preview =
                post.content.length > 160
                  ? `${post.content.slice(0, 160)}...`
                  : post.content;

              return (
                <article
                  key={post.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <p className="text-xs text-accent">Bearbeitungsmodus aktiv</p>
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
                        <p className="text-xs text-slate-400">
                          Erstellt am {new Date(post.createdAt).toLocaleString("de-DE")}
                        </p>
                      </div>
                      <p className="text-sm text-slate-300">{preview}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(post)}
                          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
                        >
                          Bearbeiten
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePost(post.id)}
                          className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:border-red-400"
                        >
                          Löschen
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