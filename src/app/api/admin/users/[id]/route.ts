import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireAdmin } from "@/lib/info-utils";
import { logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, context: Context) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    if (id === session.user.id) {
      return NextResponse.json({ error: "Du kannst deinen eigenen Account nicht löschen." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Nutzer wurde nicht gefunden." }, { status: 404 });
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Der letzte Admin darf nicht gelöscht werden." }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Nutzerlöschung: ${message}`, "/admin", session.user.id);
    return NextResponse.json({ error: "Serverfehler beim Löschen des Nutzers." }, { status: 500 });
  }
}
