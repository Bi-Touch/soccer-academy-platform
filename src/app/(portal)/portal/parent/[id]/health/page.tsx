import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";
import { formatDate } from "@/lib/dates";
import { decryptProfile } from "@/lib/healthCrypto";

export default async function ParentChildHealthPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { player, child } = await requireOwnedChild(params.id);

  const stored = await prisma.playerHealthProfile.findUnique({
    where: { playerId: player.id },
  });
  // The sensitive fields are stored encrypted and are decrypted here for the parent only.
  const health = stored ? decryptProfile(stored) : null;

  const fields = [
    { label: "Medical notes", value: health?.notes },
    { label: "Allergies", value: health?.allergies },
    { label: "Medical conditions", value: health?.conditions },
    { label: "Medications", value: health?.medications },
    { label: "Doctor's name", value: health?.doctorName },
    { label: "Doctor's phone", value: health?.doctorPhone },
    { label: "Insurance information", value: health?.insuranceInfo },
  ];

  return (
    <ChildPageShell child={child} active="health">
      {!health ? (
        <p style={{ opacity: 0.7 }}>
          No health profile has been recorded for this child. Please contact the Academy if you believe this is
          incorrect.
        </p>
      ) : (
        <>
          <div
            style={{
              background: "white",
              border: "1px solid #e3ded2",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {fields.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0ede5",
                }}
              >
                <div style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                  {value?.trim() || "Not provided"}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #e3ded2",
              borderRadius: 8,
              padding: 16,
              marginTop: 16,
            }}
          >
            <h2 style={{ fontSize: "1rem", margin: "0 0 12px" }}>Emergency treatment</h2>

            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Authorisation:{" "}
              <strong>
                {health.emergencyTreatmentAuthorised ? "Authorised" : "Not authorised"}
              </strong>
            </p>

            <p style={{ margin: "8px 0 0", fontSize: "0.8rem", opacity: 0.65 }}>
              Recorded: {health.authorisedAt ? formatDate(health.authorisedAt) : "No date recorded"}
            </p>
          </div>

          <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 12 }}>
            Last updated: {formatDate(health.updatedAt)}
          </p>
        </>
      )}
    </ChildPageShell>
  );
}
