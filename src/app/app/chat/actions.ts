"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Bitte gib eine Nachricht ein.").max(500, "Die Nachricht darf maximal 500 Zeichen haben.")
});

export type SendMessageState = {
  ok: boolean;
  error?: string;
};

export async function sendMessage(_: SendMessageState, formData: FormData): Promise<SendMessageState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, error: "Du bist nicht eingeloggt." };
  }

  const parsed = sendMessageSchema.safeParse({
    content: String(formData.get("content") ?? "")
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ungültige Nachricht." };
  }

  await prisma.message.create({
    data: {
      content: parsed.data.content,
      authorId: userId
    }
  });

  revalidatePath("/app/chat");

  return { ok: true };
}
