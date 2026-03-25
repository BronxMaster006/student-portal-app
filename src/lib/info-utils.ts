import { z } from "zod";
import { auth } from "@/lib/auth";

export const infoSchema = z.object({
  title: z.string().trim().min(3, "Titel muss mindestens 3 Zeichen lang sein.").max(120, "Titel ist zu lang."),
  content: z.string().trim().min(10, "Inhalt muss mindestens 10 Zeichen lang sein.").max(5000, "Inhalt ist zu lang.")
});

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
