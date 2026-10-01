import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { playerName } from "@/lib/playerDisplay";

const ROW_LABELS: { key: string; label: string }[] = [
  { key: "dataProcessing", label: "Academy data processing" },
  { key: "statistics", label: "Training & match statistics" },
  { key: "photography", label: "Photography" },
  { key: "videoRecording", label: "Video recording" },
  { key: "publicMedia", label: "Public media (website/social)" },
  { key: "localScouting", label: "Local scouting" },
  { key: "overseasAcademies", label: "Overseas academies" },
  { key: "overseasClubs", label: "Overseas clubs" },
  { key: "scouts", label: "Scouts" },
  { key: "agents", label: "Agents" },
];

export default async function ParentConsentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const guardian = await prisma.parentGuardian.findUnique({ where: { userId: session.user.id } });
  if (!guardian) return notFound();

  const player = await prisma.player.findUnique({ where: { id: params.id } });
  if (!player || player.parentGuardianId !== guardian.id) return notFound();

  // The registration record carries the one-time consent given at sign-up.
  // There is no later/ongoing registration per player once approved, so the
  // most recent approved registration matching this player is the source of truth.
  const registration = await prisma.playerRegistration.findFirst({
    where: { createdPlayerId: player.id },
    include: { consent: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/portal/parent" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; My Children</Link>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 24 }}>
        {playerName(player).toUpperCase()} — CONSENT &amp; PRIVACY
      </h1>

      {!registration?.consent ? (
        <p style={{ opacity: 0.7 }}>No consent record found for this player.</p>
      ) : (
        <>
          <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 0, overflow: "hidden" }}>
            {ROW_LABELS.map(({ key, label }) => {
              const granted = Boolean((registration.consent as unknown as Record<string, boolean>)[key]);
              return (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem" }}>
                  <span>{label}</span>
                  <span style={{ color: granted ? "var(--pitch)" : "var(--card-red)", fontWeight: 600 }}>
                    {granted ? "Granted" : "Not granted"}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 16 }}>
            Consent version {registration.consent.consentVersion}, given {registration.consent.consentedAt.toLocaleDateString()}.
          </p>
        </>
      )}
    </div>
  );
}