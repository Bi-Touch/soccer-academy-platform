import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { ConsentType } from "@prisma/client";
import { requireAdmin } from "@/lib/permissions";
import { readFlashPassword } from "@/lib/flashPassword";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
import { getCurrentConsents } from "@/lib/consentLedger";
import { consentRowsFromRecord } from "@/lib/consentMapping";
import { approveRegistration, rejectRegistration, requestChanges, resetGuardianPassword } from "../actions";
import { StatusPill } from "@/components/StatusPill";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 };
const headingStyle: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 };
const noticeStyle: React.CSSProperties = { background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 16, marginBottom: 20, fontSize: "0.9rem" };

const CONSENT_LABELS: Record<ConsentType, string> = {
  HEALTH_DATA: "Health information",
  PHOTOGRAPHY: "Photography",
  VIDEO: "Video recording",
  PUBLIC_MEDIA: "Public photos and videos",
  SCOUTING_LOCAL: "Local academies, clubs and scouts",
  AGENTS_LOCAL: "Local agents",
  SCOUTING_OVERSEAS_ACADEMIES: "Overseas academies",
  SCOUTING_OVERSEAS_CLUBS: "Overseas clubs",
  SCOUTING_OVERSEAS_SCOUTS: "Overseas scouts",
  SCOUTING_OVERSEAS_AGENTS: "Overseas agents",
  MARKETING_COMMUNICATIONS: "News and promotions",
};

function YesNo({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span style={{ opacity: 0.5 }}>—</span>;
  return <span style={{ color: ok ? "var(--pitch)" : "var(--card-red)" }}>{ok ? "✓ Yes" : "✗ No"}</span>;
}

export default async function RegistrationDetailPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  await requireAdmin();

  const registration = await prisma.playerRegistration.findUnique({
    where: { id: params.id },
    include: { parentGuardian: true, consent: true },
  });
  if (!registration) return notFound();

  const playerId = registration.createdPlayerId;

  // Live consent state (only exists once the registration is approved and a player created),
  // and whether the medical notes have moved into the player's health profile.
  const [current, notesMoved] = await Promise.all([
    playerId ? getCurrentConsents(playerId) : Promise.resolve(null),
    playerId
      ? prisma.playerHealthProfile.count({ where: { playerId, notes: { not: null } } })
      : Promise.resolve(0),
  ]);

  // Reading medical notes is a sensitive access, so it is recorded (metadata only, never the notes).
  if (registration.medicalNotes) {
    await logAudit({
      action: "registration.medicalNotes.view",
      entityType: "PlayerRegistration",
      entityId: registration.id,
      playerId,
      summary: `Viewed medical notes on the registration for ${registration.firstName} ${registration.lastName}`,
    });
  }

  // The password arrives in a short-lived httpOnly cookie set by approveRegistration, not in the URL.
  // It is only shown on the registration it was created for, so a leftover cookie can't appear on another page.
  const flash = await readFlashPassword();
  const tempPassword = flash && flash.registrationId === registration.id ? flash.password : null;

  const approveWithId = approveRegistration.bind(null, registration.id);
  const rejectWithId = rejectRegistration.bind(null, registration.id);
  const requestChangesWithId = requestChanges.bind(null, registration.id);
  const resetPasswordWithId = resetGuardianPassword.bind(null, registration.parentGuardian.id);
  const g = registration.parentGuardian;
  const c = registration.consent;

  const registeredRows = c ? consentRowsFromRecord(c) : [];
  const usedEarlierForm = Boolean(c && !c.policyVersion);
  const notesNeedFollowUp = Boolean(registration.status === "APPROVED" && registration.medicalNotes && c && !c.healthData);

  const emergencyContact = [
    registration.emergencyName,
    registration.emergencyRelationship && `(${registration.emergencyRelationship})`,
    registration.emergencyPhone,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/registrations" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All registrations</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 8 }}>
        {registration.firstName.toUpperCase()} {registration.lastName.toUpperCase()}
      </h1>
      <div style={{ marginBottom: 24 }}>
        <StatusPill status={registration.status} />
      </div>

      {tempPassword && (
        <div style={{ ...noticeStyle, padding: 20 }}>
          <p style={{ fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
            Account created — share these credentials with the guardian
          </p>
          <p style={{ fontSize: "0.9rem", marginBottom: 4 }}><strong>Email:</strong> {g.email}</p>
          <p style={{ fontSize: "0.9rem", marginBottom: 8 }}><strong>Temporary password:</strong> {tempPassword}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            This password is not stored anywhere and is only kept for about two minutes. Copy it now — once it expires
            it cannot be retrieved again, only reset. Ask the guardian to change it after their first login.
          </p>
        </div>
      )}

      {notesNeedFollowUp && (
        <div role="status" style={noticeStyle}>
          <strong>Follow-up needed.</strong> The guardian entered medical notes but did not give health-information
          consent, so the notes were not copied into the player&apos;s health profile. Ask the guardian to confirm,
          then record their choice. Make sure coaches are told about anything urgent in the meantime.
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={headingStyle}>GUARDIAN</h2>
        <p>{g.firstName} {g.lastName} — {g.relationship}</p>
        <p style={{ opacity: 0.75, fontSize: "0.9rem" }}>{g.phone} &middot; {g.email}</p>
        <div style={{ marginTop: 12 }}>
          <form action={resetPasswordWithId}>
            <button type="submit" className="button secondary">Get / Reset Guardian Password</button>
          </form>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>PLAYER</h2>
        <p>DOB: {formatDate(registration.dateOfBirth)}</p>
        <p>Position: {registration.position || "—"} &middot; Preferred foot: {registration.preferredFoot || "—"}</p>
        <p style={{ marginTop: 8, fontSize: "0.9rem" }}>Emergency contact: {emergencyContact || "—"}</p>
        {registration.medicalNotes ? (
          <p style={{ marginTop: 8, fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>Medical notes: {registration.medicalNotes}</p>
        ) : (
          <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.75 }}>
            Medical notes: {notesMoved > 0 ? "moved to the player's health profile" : "none provided"}
          </p>
        )}
      </div>

      {c && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>REQUIRED AT REGISTRATION</h2>
          {[
            ["Use of information understood", c.dataProcessing],
            ["Statistics understood", c.statistics],
            ["Emergency treatment authorised", c.emergencyTreatmentAuthorised],
            ["Guardian declaration", c.guardianDeclaration],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", padding: "4px 0" }}>
              <span style={{ opacity: 0.75 }}>{label}</span>
              <YesNo ok={val as boolean} />
            </div>
          ))}
          <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>
            Accepted {formatDate(c.consentedAt)} (form version {c.consentVersion}
            {c.policyVersion ? `, privacy policy ${c.policyVersion}` : ""}).
          </p>
        </div>
      )}

      {c && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>OPTIONAL CONSENTS</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px", fontSize: "0.75rem", opacity: 0.6, paddingBottom: 6, borderBottom: "1px solid #f0ede5" }}>
            <span />
            <span>At registration</span>
            <span>Current</span>
          </div>

          {registeredRows.map(({ type, granted }) => {
            const now = current?.get(type);
            const changed = now ? now.granted !== granted : false;
            return (
              <div
                key={type}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 130px",
                  fontSize: "0.9rem",
                  padding: "6px 4px",
                  borderBottom: "1px solid #f0ede5",
                  background: changed ? "#fdf3e2" : undefined,
                }}
              >
                <span style={{ opacity: 0.85 }}>{CONSENT_LABELS[type]}</span>
                <YesNo ok={granted} />
                <span>
                  <YesNo ok={now ? now.granted : null} />
                  {changed && now && (
                    <span style={{ display: "block", fontSize: "0.7rem", opacity: 0.7 }}>
                      changed {formatDate(now.changedAt)}
                    </span>
                  )}
                </span>
              </div>
            );
          })}

          <p style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: 10 }}>
            {playerId
              ? "The Current column is what the parent has chosen now, and is the one the website and any sharing must follow. Highlighted rows have changed since registration."
              : "The Current column appears once the registration is approved and the player is created."}
          </p>
          {usedEarlierForm && (
            <p style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: 6 }}>
              This registration used the earlier form. Scouts and agents were not split into local and overseas, so
              they are treated as local only, and emergency treatment and health consent were not asked.
            </p>
          )}
        </div>
      )}

      {registration.status !== "APPROVED" && registration.status !== "REJECTED" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <form action={approveWithId}>
            <button type="submit" className="button">Approve</button>
          </form>
          <form action={requestChangesWithId} style={{ display: "flex", gap: 8 }}>
            <input name="reviewNotes" placeholder="Notes for changes needed" style={{ flex: 1, padding: 8 }} />
            <button type="submit" className="button secondary">Request Changes</button>
          </form>
          <form action={rejectWithId} style={{ display: "flex", gap: 8 }}>
            <input name="reviewNotes" placeholder="Reason for rejection" style={{ flex: 1, padding: 8 }} />
            <button type="submit" style={{ background: "none", border: "1px solid var(--card-red)", color: "var(--card-red)", padding: "10px 16px", cursor: "pointer" }}>Reject</button>
          </form>
        </div>
      )}
    </div>
  );
}
