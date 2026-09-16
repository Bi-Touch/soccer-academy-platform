import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const recipientSelect = {
  id: true,
  email: true,
  name: true,
  emailNotifications: true,
  pushNotifications: true,
  pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
} as const;

type Recipient = {
  id: string;
  email: string;
  name: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  pushSubscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[];
};

async function sendPush(recipient: Recipient, title: string, body: string, url: string) {
  if (!recipient.pushNotifications || recipient.pushSubscriptions.length === 0) return;
  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    recipient.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          // Browser dropped the subscription — clean it up so we stop retrying it.
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Push send failed:", err?.message || err);
        }
      }
    })
  );
}

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return console.error("RESEND_API_KEY not set — skipped email to", to);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) console.error("Email send failed:", res.status, await res.text());
}

async function notify(recipient: Recipient, title: string, body: string, url: string) {
  await Promise.all([
    sendPush(recipient, title, body, url),
    recipient.emailNotifications
      ? sendEmail(recipient.email, title, `<p>Hi ${recipient.name},</p><p>${body}</p><p><a href="${url}">Open the player portal</a></p>`)
      : Promise.resolve(),
  ]);
}

export async function notifyTeamOfNewEvent(teamId: string, teamName: string, eventTitle: string, startsAt: Date) {
  const players = await prisma.player.findMany({
    where: { teamId },
    select: { user: { select: recipientSelect } },
  });
  const when = startsAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  await Promise.all(
    players.map((p) => notify(p.user, `New ${teamName} schedule event`, `${eventTitle} — ${when}`, "/portal/schedule"))
  );
}

export async function notifyPlayerOfNewNote(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { user: { select: recipientSelect } },
  });
  if (!player) return;
  await notify(player.user, "New coach note", "Your coach added a note to your profile.", "/portal/profile");
}