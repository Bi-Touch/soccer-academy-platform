"use client";

import { useEffect, useState, useTransition } from "react";
import { updateNotificationPrefs, savePushSubscription, deletePushSubscription } from "@/app/(portal)/portal/settings/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from([...atob(base64)].map((c) => c.charCodeAt(0)));
}

export function NotificationSettings({
  emailNotifications,
  pushNotifications,
  vapidPublicKey,
}: {
  emailNotifications: boolean;
  pushNotifications: boolean;
  vapidPublicKey: string;
}) {
  const [email, setEmail] = useState(emailNotifications);
  const [push, setPush] = useState(pushNotifications);
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) setSupported(false);
  }, []);

  function toggleEmail(next: boolean) {
    setEmail(next);
    startTransition(() => updateNotificationPrefs({ emailNotifications: next, pushNotifications: push }));
  }

  async function togglePush(next: boolean) {
    setStatus(null);
    if (!next) {
      setPush(false);
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      startTransition(() => updateNotificationPrefs({ emailNotifications: email, pushNotifications: false }));
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("Notifications are blocked in this browser. Allow them in your browser settings and try again.");
      return;
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = sub.toJSON();
    setPush(true);
    startTransition(async () => {
      await savePushSubscription({ endpoint: sub.endpoint, p256dh: json.keys!.p256dh!, auth: json.keys!.auth! });
      await updateNotificationPrefs({ emailNotifications: email, pushNotifications: true });
    });
  }

  return (
    <div style={{ background: "white", padding: 32, maxWidth: 480, display: "flex", flexDirection: "column", gap: 20 }}>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span>Email me about new schedule events and coach notes</span>
        <input type="checkbox" checked={email} disabled={isPending} onChange={(e) => toggleEmail(e.target.checked)} />
      </label>
      <label style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span>Push notifications on this device</span>
        <input type="checkbox" checked={push} disabled={isPending || !supported} onChange={(e) => togglePush(e.target.checked)} />
      </label>
      {!supported && <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>Push isn't supported in this browser.</p>}
      {status && <p style={{ fontSize: "0.85rem", color: "var(--card-red)" }}>{status}</p>}
    </div>
  );
}