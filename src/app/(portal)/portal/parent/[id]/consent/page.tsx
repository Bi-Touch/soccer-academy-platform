import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDate } from "@/lib/dates";

const ROWS: { key: string; label: string }[] = [
  { key: "dataProcessing", label: "Academy data processing" },
  { key: "statistics", label: "Training & match statistics" },
  { key: "photography", label: "Photography" },
  { key: "videoRecording", label: "Video recording" },
  { key: "publicMedia", label: "Public media (website / social)" },
  { key: "localScouting", label: "Local scouting" },
  { key: "overseasAcademies", label: "Overseas academies" },
  { key: "overseasClubs", label: "Overseas clubs" },
  { key: "scouts", label: "Scouts" },
  { key: "agents", label: "Agents" },
];

export default async function ParentChildConsentPage({ params }: { params: { id: string } }) {
  const { player, child } = await requireOwnedChild(params.id);

  const registration = await prisma.playerRegistration.findFirst({
    where: { createdPlayerId: player.id },
    include: { consent: true },
    orderBy: { createdAt: "desc" },
  });
  const consent = registration?.consent;

  return (
    <ChildPageShell child={child} active="consent">
      {!consent ? (
        <p style={{ opacity: 0.7 }}>No consent record found for this player.</p>
      ) : (
        <>
          <div style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, overflow: "hidden" }}>
            {ROWS.map(({ key, label }) => {
              const granted = Boolean((consent as unknown as Record<string, boolean>)[key]);
              return (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem" }}>
                  <span>{label}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "3px 12px",
                      borderRadius: 999,
                      background: granted ? "#e7f3ed" : "#fdecec",
                      color: granted ? "var(--pitch)" : "var(--card-red)",
                    }}
                  >
                    {granted ? "Granted" : "Not granted"}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 12 }}>
            Consent version {consent.consentVersion}, given {formatDate(consent.consentedAt)}.
          </p>
        </>
      )}
    </ChildPageShell>
  );
}