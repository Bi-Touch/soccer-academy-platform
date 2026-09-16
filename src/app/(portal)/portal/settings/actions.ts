"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function currentUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not signed in.");
  return session.user.id;
}

export async function updateNotificationPrefs(prefs: { emailNotifications: boolean; pushNotifications: boolean }) {
  const userId = await currentUserId();
  await prisma.user.update({ where: { id: userId }, data: prefs });
  revalidatePath("/portal/settings");
}

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  const userId = await currentUserId();
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId, p256dh: sub.p256dh, auth: sub.auth },
    create: { userId, ...sub },
  });
}

export async function deletePushSubscription(endpoint: string) {
  await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
}