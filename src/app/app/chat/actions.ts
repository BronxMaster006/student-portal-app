"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SendMessageResult = {
  ok: boolean;
  error?: string;
};

const messageSchema = z.object({
  content: z.string().trim().min(1, "Bitte gib eine Nachricht ein.").max(500, "Nachricht ist zu lang (max. 500 Zeichen).")
});

export async function sendMessage(formData: FormData): Promise<SendMessageResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, error: "Nicht autorisiert." };
  }

  const parsed = messageSchema.safeParse({
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
