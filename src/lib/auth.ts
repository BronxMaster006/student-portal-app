import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ActivityType, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity, logError } from "@/lib/logging";

const loginSchema = z.object({
  firstName: z.string().min(2),
  password: z.string().min(4)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Anmeldung",
      credentials: {
        firstName: { label: "Vorname", type: "text" },
        password: { label: "Passwort", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          await logError("Ungültiges Login-Format", "/login");
          return null;
        }

        const { firstName, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { firstName } });

        if (!user) {
          await logError(`Login fehlgeschlagen: Nutzer ${firstName} nicht gefunden`, "/login");
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
          await logActivity(user.id, ActivityType.LOGIN_FAILED, "Falsches Passwort");
          await logError("Login fehlgeschlagen: Falsches Passwort", "/login", user.id);
          return null;
        }

        const now = new Date();
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: now, lastSeenAt: now, isActive: true }
        });

        await logActivity(user.id, ActivityType.LOGIN_SUCCESS, "Login erfolgreich");

        return {
          id: user.id,
          name: user.firstName,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: Role }).role ?? Role.USER;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
});
