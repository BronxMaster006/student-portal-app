import { NextResponse } from "next/server";
import { logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";
import { infoSchema, requireAdmin } from "@/lib/info-utils";

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  const posts = await prisma.infoPost.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true }
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = infoSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
      await logError(`Info-Post fehlgeschlagen: ${message}`, "/admin/info", session.user.id);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await prisma.infoPost.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        authorId: session.user.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Info-Post: ${message}`, "/admin/info", session.user.id);
    return NextResponse.json({ error: "Serverfehler beim Speichern." }, { status: 500 });
  }
}

