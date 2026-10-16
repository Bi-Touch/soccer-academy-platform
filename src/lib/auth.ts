import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/auditCore";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: credentials.email.trim(),
              mode: "insensitive",
            },
          },
        });

        // Do not log the submitted email or password when
        // no matching account exists.
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) {
          await writeAudit({
            action: "auth.login_failed",
            actor: null,
            entityType: "User",
            entityId: user.id,
            summary: "Failed sign-in attempt (wrong password)",
          });

          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }

      return session;
    },
  },

  events: {
    async signIn({ user }) {
      await writeAudit({
        action: "auth.login",
        actor: {
          id: user.id,
          name: user.name,
          role: (user as any).role,
        },
        entityType: "User",
        entityId: user.id,
        summary: "Signed in",
      });
    },

    async signOut({ token }) {
      // JWT sessions normally provide the token here.
      // Use the standard subject as a fallback for the custom ID.
      const jwt = token as
        | (typeof token & {
            id?: string;
            role?: string;
          })
        | undefined;

      const userId = jwt?.id ?? jwt?.sub;

      // Avoid writing an incorrectly attributed audit record
      // if the session identity is unavailable.
      if (!userId) return;

      await writeAudit({
        action: "auth.logout",
        actor: {
          id: userId,
          name: jwt?.name ?? null,
          role: jwt?.role ?? null,
        },
        entityType: "User",
        entityId: userId,
        summary: "Signed out",
      });
    },
  },
};