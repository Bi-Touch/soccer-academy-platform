import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireHealthAccess } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
import { getConsentedPlayerIds } from "@/lib/consentLedger";
import { HEALTH_CONTEXT, decryptField, decryptForDisplay, profileContext } from "@/lib/healthCrypto";
import { addInjury, markInjuryRecovered, updateHealthProfile } from "./actions";

const cardStyle = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 } as const;
const headingStyle = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 } as const;
const noticeStyle = { borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem", display: "block", marginTop: 12 } as const;

export default async function PlayerHealthPage(props: {
  params: Promise<{ playerId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
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
      injuryRecords: { orderBy: { dateOccurred: "desc" } },
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

      {search.error === "injury" && (
        <div role="alert" style={{ ...noticeStyle, background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)" }}>
          Enter the injury type and a valid date.
        </div>
      )}
      {search.error === "secure" && (
        <div role="alert" style={{ ...noticeStyle, background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)" }}>
          This could not be saved securely, so nothing was saved. Check the health data encryption key.
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

      {level === "full" && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>INJURIES</h2>
          {player.injuryRecords.length === 0 ? (
            <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>No injuries recorded.</p>
          ) : (
            player.injuryRecords.map((injury) => (
              <div key={injury.id} style={{ borderTop: "1px solid #f0ede5", padding: "10px 0", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{injury.injuryType}</strong>
                  <span style={{ color: injury.status === "ACTIVE" ? "var(--card-red)" : "var(--pitch)", fontWeight: 600 }}>
                    {injury.status === "ACTIVE" ? "Active" : "Recovered"}
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                  {formatDate(injury.dateOccurred)}
                  {injury.expectedReturnDate && ` · expected back ${formatDate(injury.expectedReturnDate)}`}
                  {injury.actualReturnDate && ` · returned ${formatDate(injury.actualReturnDate)}`}
                </div>
                {injury.description && (
                  <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                    {decryptForDisplay(injury.description, HEALTH_CONTEXT.injuryDescription)}
                  </p>
                )}
                {injury.treatment && (
                  <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", opacity: 0.85 }}>
                    Treatment: {decryptForDisplay(injury.treatment, HEALTH_CONTEXT.injuryTreatment)}
                  </p>
                )}
                {injury.status === "ACTIVE" && (
                  <form action={markInjuryRecovered.bind(null, injury.id)} style={{ marginTop: 6 }}>
                    <button type="submit" style={{ background: "none", border: "none", color: "var(--pitch)", cursor: "pointer", fontSize: "0.85rem", padding: 0, textDecoration: "underline" }}>
                      Mark recovered
                    </button>
                  </form>
                )}
              </div>
            ))
          )}

          <form action={addInjury.bind(null, player.id)} style={{ borderTop: "1px solid #e3ded2", marginTop: 12, paddingTop: 12 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>Record an injury</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <label style={labelStyle}>
                Injury type *
                <input name="injuryType" required maxLength={100} placeholder="e.g. Ankle sprain" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Date *
                <input name="dateOccurred" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Expected return
                <input name="expectedReturnDate" type="date" style={inputStyle} />
              </label>
            </div>
            <label style={labelStyle}>
              Description
              <textarea name="description" rows={2} maxLength={2000} style={{ ...inputStyle, resize: "vertical" }} />
            </label>
            <label style={labelStyle}>
              Treatment
              <textarea name="treatment" rows={2} maxLength={2000} style={{ ...inputStyle, resize: "vertical" }} />
            </label>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "8px 0" }}>Description and treatment are stored encrypted.</p>
            <button type="submit" className="button">Save injury</button>
          </form>
        </div>
      )}

      {profile && (
        <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>Last updated {formatDate(profile.updatedAt)}.</p>
      )}
    </div>
  );
}
