"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      firstName,
      password,
      redirectTo: "/app",
    });

    return {};
  } catch (error: any) {

    // WICHTIG: Redirect Fehler durchlassen
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }

    if (error instanceof AuthError) {
      return { error: "Anmeldung fehlgeschlagen. Bitte Daten prüfen." };
    }

    return { error: "Unbekannter Fehler bei der Anmeldung." };
  }
}