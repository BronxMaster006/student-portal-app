import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

const infoSchema = z.object({
  title: z.string().trim().min(3, "Titel muss mindestens 3 Zeichen lang sein.").max(120, "Titel ist zu lang."),
  content: z.string().trim().min(10, "Inhalt muss mindestens 10 Zeichen lang sein.").max(5000, "Inhalt ist zu lang.")
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
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
