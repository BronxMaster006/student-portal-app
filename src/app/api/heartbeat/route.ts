import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logActivity, logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";
import { ActivityType } from "@prisma/client";

export async function POST() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date(), isActive: true }
    });

    await logActivity(userId, ActivityType.HEARTBEAT, "Nutzeraktivität aktualisiert");

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Heartbeat-Fehler: ${message}`, "/api/heartbeat");
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
