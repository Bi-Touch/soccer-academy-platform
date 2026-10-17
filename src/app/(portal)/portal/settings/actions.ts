"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logAudit, diffFields } from "@/lib/audit";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not signed in.");
  return session.user.id;
}

export async function updateNotificationPrefs(prefs: { emailNotifications: boolean; pushNotifications: boolean }) {
  const userId = await currentUserId();

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailNotifications: true, pushNotifications: true },
  });

  await prisma.user.update({ where: { id: userId }, data: prefs });

  const changes = diffFields(
    before
      ? { emailNotifications: before.emailNotifications, pushNotifications: before.pushNotifications }
      : null,
    { emailNotifications: prefs.emailNotifications, pushNotifications: prefs.pushNotifications }
  );

  // Saving with no actual changes is not logged, to keep the log free of noise.
  if (Object.keys(changes).length > 0) {
    await logAudit({
      action: "user.notificationPrefs.update",
      entityType: "User",
      entityId: userId,
      summary: "Changed notification preferences",
      changes,
    });
  }

  revalidatePath("/portal/settings");
}

// Push subscription saves and removals are device plumbing (the endpoint and keys are secrets), so they are not audited.
export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  const userId = await currentUserId();

  // An endpoint that already belongs to a different account may only be moved by someone who also
  // holds its keys. A browser re-subscribing on the same device (for example after another person
  // signs in on a shared phone) sends the same keys, so that still works. Someone who has only
  // learned the endpoint URL cannot take the device over.
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: sub.endpoint } });
  if (existing && existing.userId !== userId) {
    if (existing.p256dh !== sub.p256dh || existing.auth !== sub.auth) {
      throw new Error("This device is already registered to another account.");
    }
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth },
    create: { userId, ...sub },
  });
}

export async function deletePushSubscription(endpoint: string) {
  // Requires a signed-in user and only removes that user's own subscription.
  const userId = await currentUserId();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}
