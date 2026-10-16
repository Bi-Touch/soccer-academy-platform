"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { generateTempPassword } from "@/lib/tempPassword";
import { sendPlayerLoginEmail } from "@/lib/notifications";
import type { PlayerLoginResult } from "@/lib/playerLoginTypes";
import { logAudit, diffFields } from "@/lib/audit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createPlayerLogin(playerId: string, formData: FormData): Promise<PlayerLoginResult> {
  await requireAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const sendToPlayer = formData.get("sendEmail") === "on";

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found." };
  if (player.userId) return { ok: false, error: "This player already has a login." };

  const taken = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (taken) {
    return {
      ok: false,
      error: "That email is already used by another account. A player needs their own address, different from their parent's.",
    };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const name = playerName(player);

  let userId: string;
  try {
    // Both writes succeed together or neither does, so we never leave an orphan login.
    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, name, passwordHash, role: "PLAYER" } });
      await tx.player.update({ where: { id: playerId }, data: { userId: user.id } });
      return user.id;
    });
  } catch (e) {
    console.error("createPlayerLogin failed:", e);
    return { ok: false, error: "Could not create the login. Please try again." };
  }

  // The temporary password is deliberately never logged.
  await logAudit({
    action: "player.login.create",
    entityType: "Player",
    entityId: playerId,
    summary: `Created a login for ${name}`,
    changes: diffFields(null, { email, userId, emailRequested: sendToPlayer }),
  });

  if (sendToPlayer) {
    try {
      await sendPlayerLoginEmail(email, name, email, tempPassword);
    } catch (e) {
      console.error("Player login email failed:", e);
    }
  }

  revalidatePath("/admin/players");
  revalidatePath(`/admin/players/${playerId}/login`);
  return { ok: true, email, tempPassword, emailAttempted: sendToPlayer };
}

export async function resetPlayerLoginPassword(playerId: string, formData: FormData): Promise<PlayerLoginResult> {
  await requireAdmin();

  const sendToPlayer = formData.get("sendEmail") === "on";

  const player = await prisma.player.findUnique({ where: { id: playerId }, include: { user: true } });
  if (!player?.user) return { ok: false, error: "This player doesn't have a login yet." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({ where: { id: player.user.id }, data: { passwordHash } });

  // The new password and hash are deliberately never logged, only the fact of the reset.
  await logAudit({
    action: "player.login.reset",
    entityType: "Player",
    entityId: playerId,
    summary: `Reset the login password for ${playerName(player)}`,
    changes: { email: player.user.email, emailRequested: sendToPlayer },
  });

  if (sendToPlayer) {
    try {
      await sendPlayerLoginEmail(player.user.email, playerName(player), player.user.email, tempPassword);
    } catch (e) {
      console.error("Player login email failed:", e);
    }
  }

  revalidatePath(`/admin/players/${playerId}/login`);
  return { ok: true, email: player.user.email, tempPassword, emailAttempted: sendToPlayer };
}
