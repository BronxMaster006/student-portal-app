import bcrypt from "bcryptjs";
import { ActivityType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity, logError } from "@/lib/logging";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Vorname muss mindestens 2 Zeichen lang sein."),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein."),
  inviteCode: z.string().min(1, "Ein Invite-Code ist erforderlich.")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Ungültige Eingabedaten.";
      await logError(`Registrierung fehlgeschlagen: ${message}`, "/register");
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }

    const { firstName, password, inviteCode } = parsed.data;

    if (inviteCode !== process.env.INVITE_CODE_SECRET) {
      await logError("Registrierung fehlgeschlagen: Falscher Invite-Code", "/register");
      return NextResponse.json({ ok: false, error: "Der Invite-Code ist ungültig." }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { firstName } });
    if (existingUser) {
      await logError("Registrierung fehlgeschlagen: Vorname bereits vergeben", "/register", existingUser.id);
      return NextResponse.json({ ok: false, error: "Dieser Vorname ist bereits vergeben." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const shouldBecomeAdmin =
      process.env.ADMIN_FIRST_NAME && firstName === process.env.ADMIN_FIRST_NAME && (await prisma.user.count({ where: { role: Role.ADMIN } })) === 0;

    const created = await prisma.user.create({
      data: {
        firstName,
        passwordHash: hash,
        role: shouldBecomeAdmin ? Role.ADMIN : Role.USER,
        lastSeenAt: new Date()
      }
    });

    await logActivity(created.id, ActivityType.REGISTER_SUCCESS, "Registrierung erfolgreich");

    return NextResponse.json({ ok: true, data: { id: created.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    await logError(`Serverfehler bei Registrierung: ${message}`, "/register");
    return NextResponse.json({ ok: false, error: "Serverfehler bei der Registrierung." }, { status: 500 });
  }
}
