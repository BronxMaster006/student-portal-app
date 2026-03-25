# Studentenportal (Next.js + Auth.js + Prisma + Supabase)

Einfache, moderne Full-Stack-Webapp mit deutscher Oberfläche:
- Login
- Registrierung mit Invite-Code
- geschützte Auswahlseite `/app`
- Admin-Dashboard `/admin`

## 1) Lokales Setup

```bash
npm install
cp .env.example .env
```

Danach `.env` befüllen (siehe Abschnitt **Umgebungsvariablen**).

## 2) Supabase Setup

1. In Supabase ein neues Projekt anlegen.
2. Unter **Project Settings → Database** die Postgres-Connection-URL kopieren.
3. In `.env` als `DATABASE_URL` eintragen.
4. Optional: SSL-Parameter je nach Supabase-Vorgabe ergänzen.

## 3) Prisma Migration Steps

```bash
npm run prisma:generate
npm run prisma:migrate
```

Für Deployment (ohne dev prompts):

```bash
npm run prisma:deploy
```

## 4) Umgebungsvariablen

Siehe `.env.example`:
- `DATABASE_URL` – Supabase Postgres URL
- `NEXTAUTH_SECRET` – langer zufälliger Secret-String
- `NEXTAUTH_URL` – z. B. `http://localhost:3000`
- `INVITE_CODE_SECRET` – geheimer Invite-Code für Registrierungen
- `ADMIN_FIRST_NAME` – dieser Vorname wird beim ersten Treffer als ADMIN angelegt

## 5) Invite-Code Setup

Setze `INVITE_CODE_SECRET` in deiner `.env`.
Die Registrierung in `/register` vergleicht den eingegebenen Code **ausschließlich serverseitig** in `src/app/api/register/route.ts`.

## 6) Admin Account Setup

Empfohlen:
1. `ADMIN_FIRST_NAME=deinadminname` setzen.
2. Benutzer mit genau diesem Vornamen registrieren.
3. Wenn noch kein Admin existiert, bekommt dieser Nutzer automatisch Rolle `ADMIN`.

## 7) Lokal starten

```bash
npm run dev
```

Routen:
- `/` leitet zu `/app` oder `/login`
- `/login`
- `/register`
- `/app` (geschützt)
- `/admin` (nur ADMIN)

## 8) Cloudflare Workers / OpenNext Deployment (Vorbereitung)

Diese Codebasis ist für OpenNext vorbereitet (App Router, Middleware, Route Handlers).

Typischer Ablauf:
1. Cloudflare-Account + Worker-Projekt anlegen.
2. OpenNext-Adapter für Cloudflare verwenden (Build-Artefakte erzeugen).
3. ENV-Variablen (`DATABASE_URL`, `NEXTAUTH_SECRET`, `INVITE_CODE_SECRET`, etc.) in Cloudflare setzen.
4. Prisma Migrationen gegen Produktionsdatenbank ausführen (`npm run prisma:deploy`).
5. Worker deployen.

> Hinweis: Je nach OpenNext-Version können sich konkrete CLI-Kommandos ändern. Nutze die aktuelle OpenNext/Cloudflare-Doku für den exakten Deploy-Befehl.

## 9) Logging und Sicherheit

- Passwort-Hashing mit `bcryptjs`
- Erfolgreiche und fehlgeschlagene Logins werden protokolliert
- Registrierungsfehler und Serverfehler werden in `ErrorLog` gespeichert
- `lastSeenAt` wird per Heartbeat aktualisiert (Online = Aktivität in letzten 60 Sekunden)
