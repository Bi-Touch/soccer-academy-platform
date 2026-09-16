import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationSettings } from "@/components/NotificationSettings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { emailNotifications: true, pushNotifications: true },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>SETTINGS</h1>
      <div style={{ marginTop: 24 }}>
        <NotificationSettings
          emailNotifications={user?.emailNotifications ?? true}
          pushNotifications={user?.pushNotifications ?? false}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!}
        />
      </div>
    </div>
  );
}