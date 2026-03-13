# AGENTS.md

## Zweck
Dieses Repository enthält eine einfache, deutschsprachige Full-Stack-App für ein geschütztes Studentenportal.

## Dauerhafte Regeln
- UI-Texte bleiben standardmäßig auf Deutsch.
- Sicherheitsrelevante Secrets dürfen niemals hardcodiert werden; immer ENV-Variablen nutzen.
- Invite-Code darf nie in Client-Code oder in gerenderten Assets auftauchen.
- Auth-Schreibzugriffe laufen serverseitig über Route-Handler oder Server Actions.
- Bei Login/Registrierung immer sinnvolle Activity-/Error-Logs schreiben.
- Passwortspeicherung ausschließlich als Hash.

## Technische Konventionen
- Stack: Next.js App Router + TypeScript + Tailwind + Prisma + Auth.js.
- Datenzugriff über `src/lib/prisma.ts`.
- Auth-Zugriff über `src/lib/auth.ts`.
- Geschützte Routen über `middleware.ts`.

## Qualität
- Vor Abschluss mindestens einen Build- oder Lint-Check versuchen und Ergebnis dokumentieren.
- Änderungen klar in README nachziehen, wenn Setup/ENV/Deployment betroffen ist.
