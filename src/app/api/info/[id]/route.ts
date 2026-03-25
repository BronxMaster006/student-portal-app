import { ActivityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { logActivity, logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";
import { infoSchema, requireAdmin } from "@/lib/info-utils";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = infoSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
      await logError(`Info-Post Update fehlgeschlagen: ${message}`, "/admin/info", session.user.id);
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const post = await prisma.infoPost.update({
      where: { id },
      data: {
        title: parsed.data.title,
        content: parsed.data.content
      },
      select: { id: true, title: true, content: true, createdAt: true }
    });

    await logActivity(session.user.id, ActivityType.INFO_POST_EDITED, `Info-Post bearbeitet: ${post.id}`);

    return NextResponse.json({ ok: true, data: { post } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Info-Post Update: ${message}`, "/admin/info", session.user.id);
    return NextResponse.json({ ok: false, error: "Serverfehler beim Aktualisieren." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await prisma.infoPost.delete({ where: { id } });

    await logActivity(session.user.id, ActivityType.INFO_POST_DELETED, `Info-Post gelöscht: ${id}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Info-Post Löschung: ${message}`, "/admin/info", session.user.id);
    return NextResponse.json({ ok: false, error: "Serverfehler beim Löschen." }, { status: 500 });
  }
}
