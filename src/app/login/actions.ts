"use server";

<<<<<<< HEAD
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
=======
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
>>>>>>> codex-new

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", {
      firstName,
      password,
<<<<<<< HEAD
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
=======
      redirectTo: "/app"
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Anmeldung fehlgeschlagen. Bitte Daten prüfen." };
    }
    return { error: "Unbekannter Fehler bei der Anmeldung." };
  }
}
>>>>>>> codex-new
