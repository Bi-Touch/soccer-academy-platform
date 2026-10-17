"use server";

import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always behave the same way regardless of whether the account exists —
  // this prevents the form from leaking which emails are registered.
  if (user) {
    const token = await createResetToken(user.id);
    const resetUrl = `${process.env.NEXTAUTH_URL || ""}/reset-password?token=${token}`;

    // Nobody is signed in at this point, so the account owner is recorded as the actor.
    // The token and reset link are deliberately never logged. Requests for unknown emails
    // are not logged, so the audit log never stores arbitrary typed-in addresses.
    await logAudit({
      action: "auth.passwordReset.request",
      actor: { id: user.id, name: user.name, role: user.role },
      entityType: "User",
      entityId: user.id,
      summary: `Password reset requested for ${user.name}`,
    });

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (e) {
      console.error("Password reset email failed:", e);
    }
  }

  return { ok: true };
}
