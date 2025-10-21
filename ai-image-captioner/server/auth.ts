import { ExpressAuth, type ExpressAuthConfig } from "@auth/express";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma.js";
import { z } from "zod";
import argon2 from "argon2";

declare module "@auth/core/types" {
  interface Session {
    user?: { id?: string; name?: string | null; email?: string | null; image?: string | null };
  }
}

export const authConfig: ExpressAuthConfig = {
  secret: process.env.AUTH_SECRET!,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse({ email: raw?.email, password: raw?.password });
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
        if (!user || !user.passwordHash) return null;

        const ok = await argon2.verify(user.passwordHash, parsed.data.password);
        if (!ok) return null;

        return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined };
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      const FE = process.env.ORIGIN ?? "http://localhost:5173";
      try {
        if (url.startsWith("/")) return `${FE}${url}`;
        const u = new URL(url);
        const b = new URL(baseUrl);
        if (u.origin === b.origin) return `${FE}${u.pathname}${u.search}${u.hash}`;
        if (u.origin === new URL(FE).origin) return u.toString();
      } catch {}
      return FE;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) session.user.id = token.sub;
      return session;
    },
  },

  logger: {
    error(error) { console.error("[auth][error]", error); },
    warn(code) { console.warn("[auth][warn]", code); },
    debug(code) { console.log("[auth][debug]", code); },
  },
};

export const authHandler = ExpressAuth(authConfig);
