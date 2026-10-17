"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { consumeResetToken } from "@/lib/passwordReset";
import { logAudit } from "@/lib/audit";

export async function resetPassword(token: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "Missing token." };
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const record = await consumeResetToken(token);
  if (!record) return { ok: false, error: "This reset link is invalid or has expired." };

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  // Nobody is signed in at this point, so the account owner is recorded as the actor.
  // The token, the new password and its hash are deliberately never logged.
  await logAudit({
    action: "auth.passwordReset.complete",
    actor: { id: user.id, name: user.name, role: user.role },
    entityType: "User",
    entityId: user.id,
    summary: `Password changed through a reset link for ${user.name}`,
  });

  return { ok: true };
}
