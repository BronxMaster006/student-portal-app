"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

// Hier definieren wir den Startzustand mit dem richtigen Typ
const initialState: LoginState = {
  error: undefined
};

export function LoginForm() {
  // Wir sagen useActionState explizit, dass er den LoginState erwartet
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-300">Vorname</label>
        <input
          name="firstName"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-300">Passwort</label>
        <input
          name="password"
          type="password"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none ring-accent focus:ring-2"
          required
        />
      </div>
      
      {/* Jetzt kennt TypeScript state.error und die rote Linie ist weg */}
      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      
      <button 
        disabled={pending} 
        className="w-full rounded-lg bg-accent p-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Anmeldung läuft..." : "Einloggen"}
      </button>
    </form>
  );
}