"use server";

import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/notifications";

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always behave the same way regardless of whether the account exists —
  // this prevents the form from leaking which emails are registered.
  if (user) {
    const token = await createResetToken(user.id);
    const resetUrl = `${process.env.NEXTAUTH_URL || ""}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (e) {
      console.error("Password reset email failed:", e);
    }
  }

  return { ok: true };
}