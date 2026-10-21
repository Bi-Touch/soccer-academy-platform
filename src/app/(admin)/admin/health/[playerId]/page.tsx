import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireHealthAccess } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
import { getConsentedPlayerIds } from "@/lib/consentLedger";
import { decryptField, profileContext } from "@/lib/healthCrypto";
import { updateHealthProfile } from "./actions";

const cardStyle = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 } as const;
const headingStyle = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 } as const;
const noticeStyle = { borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem", display: "block", marginTop: 12 } as const;

export default async function PlayerHealthPage(props: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await props.params;
  const search = await props.searchParams;

  // Admins and medical officers get the full record. A coach gets a summary, and only for players
  // on their own teams. Anyone else (or a coach of another team) gets a 404, not an error page.
  const access = await requireHealthAccess(params.playerId).catch(() => null);
  if (!access) notFound();
  const { level } = access;

  const player = await prisma.player.findUnique({
    where: { id: params.playerId },
    select: {
      id: true,
      name: true,
      user: { select: { name: true } },
      team: { select: { name: true } },
      emergencyContacts: { orderBy: { isPrimary: "desc" } },
      healthProfile: true,
    },
  });
  if (!player) notFound();

  const healthConsented = (await getConsentedPlayerIds(["HEALTH_DATA"])).has(player.id);
  const profile = player.healthProfile;
  const displayName = player.name?.trim() || player.user?.name || "Unnamed player";

  // Decrypt only the fields this person is allowed to see.
  const allergies = profile && (level === "full" || healthConsented)
    ? decryptField(profile.allergies, profileContext("allergies"))
    : null;
  const full =
    level === "full" && profile
      ? {
          conditions: decryptField(profile.conditions, profileContext("conditions")),
          medications: decryptField(profile.medications, profileContext("medications")),
          notes: decryptField(profile.notes, profileContext("notes")),
          insuranceInfo: decryptField(profile.insuranceInfo, profileContext("insuranceInfo")),
        }
      : null;

  // Every staff view of health information is recorded (metadata only, never the content).
  await logAudit({
    action: "health.view",
    entityType: "PlayerHealthProfile",
    entityId: profile?.id,
    playerId: player.id,
    summary: `Viewed health information (${level} access)`,
  });

  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/admin/health" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Health records</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 4 }}>
        {displayName.toUpperCase()}
      </h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.7, marginBottom: 20 }}>
        {player.team?.name ?? "Unassigned"} &middot; {level === "full" ? "Full access" : "Summary access"}
      </p>

      {search.saved === "1" && (
        <div role="status" style={{ ...noticeStyle, background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)" }}>
          Health information saved.
        </div>
      )}

      {!healthConsented && (
        <div role="status" style={{ ...noticeStyle, background: "#fdf3e2", border: "1px solid var(--floodlight)" }}>
          {level === "full"
            ? "The parent has not given health-information consent. Use what is stored only where needed for safety, and ask the parent to confirm their choice."
            : "The parent has not given health-information consent, so allergy details are not shown. Ask the parent, and make sure the Academy knows about anything urgent."}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={headingStyle}>EMERGENCY</h2>
        <p style={{ fontSize: "0.9rem" }}>
          Emergency treatment:{" "}
          <strong>
            {profile?.emergencyTreatmentAuthorised ? "Authorised" : "Not authorised"}
          </strong>
          {profile?.authorisedAt && (
            <span style={{ opacity: 0.7 }}> (recorded {formatDate(profile.authorisedAt)})</span>
          )}
        </p>
        {player.emergencyContacts.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: 8 }}>No emergency contact on file.</p>
        ) : (
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: "0.9rem" }}>
            {player.emergencyContacts.map((c) => (
              <li key={c.id}>
                {c.name} ({c.relationship}) &middot; {c.phone}
                {c.isPrimary && <span style={{ opacity: 0.6 }}> &middot; primary</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {level === "summary" ? (
        <div style={cardStyle}>
          <h2 style={headingStyle}>ALLERGIES</h2>
          <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
            {healthConsented ? allergies?.trim() || "None recorded" : "Not shown (no health consent)"}
          </p>
        </div>
      ) : (
        <form action={updateHealthProfile.bind(null, player.id)} style={cardStyle}>
          <h2 style={headingStyle}>HEALTH INFORMATION</h2>
          <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: 0 }}>
            Stored encrypted. Changes are logged, recording which fields changed but never their content.
          </p>

          <label style={labelStyle}>
            Allergies
            <textarea name="allergies" rows={2} maxLength={2000} defaultValue={allergies ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={labelStyle}>
            Medical conditions
            <textarea name="conditions" rows={2} maxLength={2000} defaultValue={full?.conditions ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={labelStyle}>
            Medication
            <textarea name="medications" rows={2} maxLength={2000} defaultValue={full?.medications ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={labelStyle}>
            Other medical notes
            <textarea name="notes" rows={3} maxLength={2000} defaultValue={full?.notes ?? ""} style={{ ...inputStyle, resize: "vertical" }} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={labelStyle}>
              Doctor&apos;s name
              <input name="doctorName" maxLength={100} defaultValue={profile?.doctorName ?? ""} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Doctor&apos;s phone
              <input name="doctorPhone" type="tel" maxLength={30} defaultValue={profile?.doctorPhone ?? ""} style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            Insurance information
            <input name="insuranceInfo" maxLength={500} defaultValue={full?.insuranceInfo ?? ""} style={inputStyle} />
          </label>

          <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "12px 0" }}>
            Emergency treatment authorisation is recorded from the parent&apos;s consent form and cannot be edited here.
          </p>
          <button type="submit" className="button">Save health information</button>
        </form>
      )}

      {profile && (
        <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>Last updated {formatDate(profile.updatedAt)}.</p>
      )}
    </div>
  );
}
