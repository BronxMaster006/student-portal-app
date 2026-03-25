import { ActivityType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/info-utils";
import { logActivity, logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  isActive?: boolean;
};

export async function PATCH(request: Request, context: Context) {
  const session = await requireAdmin();

  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Nicht autorisiert." }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    if (id === session.user.id) {
      return NextResponse.json({ ok: false, error: "Du kannst deinen eigenen Account nicht deaktivieren." }, { status: 400 });
    }

    const body = (await request.json()) as PatchBody;
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ ok: false, error: "Ungültige Anfrage." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Nutzer wurde nicht gefunden." }, { status: 404 });
    }

    if (!body.isActive && user.role === Role.ADMIN) {
      const activeAdminCount = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true } });
      if (activeAdminCount <= 1 && user.isActive) {
        return NextResponse.json({ ok: false, error: "Der letzte aktive Admin darf nicht deaktiviert werden." }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true }
    });

    await logActivity(
      session.user.id,
      ActivityType.USER_DEACTIVATED,
      updatedUser.isActive ? `Nutzer reaktiviert: ${updatedUser.id}` : `Nutzer deaktiviert: ${updatedUser.id}`
    );

    return NextResponse.json({ ok: true, data: { user: updatedUser } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Nutzerstatusänderung: ${message}`, "/admin", session.user.id);
    return NextResponse.json({ ok: false, error: "Serverfehler bei der Statusänderung." }, { status: 500 });
  }
}
