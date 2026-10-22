import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { readFlashPassword } from "@/lib/flashPassword";
import { formatDate } from "@/lib/dates";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { createStaffAccount, removeStaffAccess, resetStaffPassword } from "./actions";

const cardStyle = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 } as const;
const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem", verticalAlign: "top" } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem" } as const;
const linkButton = { background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" } as const;

const ROLE_LABEL: Record<string, string> = {
  SAFEGUARDING_LEAD: "Safeguarding lead",
  MEDICAL_OFFICER: "Medical officer",
};

const ERRORS: Record<string, string> = {
  details: "Enter a name and a valid email address.",
  role: "Choose a role.",
  exists: "An account with that email already exists.",
  person: "That account could not be found, or it is not a safeguarding lead or medical officer.",
  lastLead: "This is the only safeguarding lead and there are still open concerns, so nobody else could read them. Create another lead first.",
};

export default async function StaffAccountsPage(props: {
  searchParams: Promise<{ credentials?: string; removed?: string; error?: string }>;
}) {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) notFound();

  const search = await props.searchParams;

  const people = await prisma.user.findMany({
    where: { role: { in: ["SAFEGUARDING_LEAD", "MEDICAL_OFFICER"] } },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const leadCount = people.filter((p) => p.role === "SAFEGUARDING_LEAD").length;
  const medicalCount = people.filter((p) => p.role === "MEDICAL_OFFICER").length;

  // The temporary password is shown only on the account it was created for, and only briefly.
  let credentials: { name: string; email: string; password: string } | null = null;
  let credentialsExpired = false;
  if (search.credentials) {
    const flash = await readFlashPassword();
    const person = people.find((p) => p.id === search.credentials);
    if (flash && person && flash.registrationId === `staff:${person.id}`) {
      credentials = { name: person.name, email: person.email, password: flash.password };
    } else {
      credentialsExpired = true;
    }
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>STAFF ACCOUNTS</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>
        Create and manage the safeguarding lead (and deputy) and the medical officer. Coaches, analysts and admins are
        managed elsewhere.
      </p>

      {credentials && (
        <div role="status" style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, color: "var(--pitch)", marginBottom: 8 }}>
            Share these sign-in details with {credentials.name}, in person or by phone
          </p>
          <p style={{ fontSize: "0.9rem", marginBottom: 4 }}><strong>Email:</strong> {credentials.email}</p>
          <p style={{ fontSize: "0.9rem", marginBottom: 8 }}><strong>Temporary password:</strong> {credentials.password}</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
            This password is not stored anywhere and is only kept for about two minutes. Copy it now. Do not send it by
            email, WhatsApp or text message. Ask them to change it after their first sign-in.
          </p>
        </div>
      )}
      {credentialsExpired && (
        <div role="status" style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: "0.9rem" }}>
          The temporary password is no longer available. Use Reset password to create a new one.
        </div>
      )}
      {search.removed === "1" && (
        <div role="status" style={{ background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: "0.9rem" }}>
          Access removed. It takes effect immediately, including for anyone already signed in.
        </div>
      )}
      {search.error && ERRORS[search.error] && (
        <div role="alert" style={{ background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: "0.9rem" }}>
          {ERRORS[search.error]}
        </div>
      )}

      {(leadCount === 0 || leadCount === 1) && (
        <div role="note" style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: "0.9rem" }}>
          {leadCount === 0
            ? "There is no safeguarding lead, so nobody can read the concerns people raise. Create one now."
            : "There is one safeguarding lead and no deputy. Create a second safeguarding lead as the named deputy, so concerns can still be handled when the lead is away."}
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
              <th style={cellStyle}>Name</th>
              <th style={cellStyle}>Role</th>
              <th style={cellStyle}>Email</th>
              <th style={cellStyle}>Added</th>
              <th style={cellStyle} />
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr><td style={{ ...cellStyle, opacity: 0.7 }} colSpan={5}>No safeguarding leads or medical officers yet.</td></tr>
            ) : (
              people.map((p) => (
                <tr key={p.id}>
                  <td style={cellStyle}>{p.name}</td>
                  <td style={cellStyle}>{ROLE_LABEL[p.role] ?? p.role}</td>
                  <td style={cellStyle}>{p.email}</td>
                  <td style={cellStyle}>{formatDate(p.createdAt)}</td>
                  <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                    <form action={resetStaffPassword.bind(null, p.id)} style={{ display: "inline" }}>
                      <ConfirmSubmitButton
                        message={`Create a new temporary password for ${p.name}? Their current password will stop working.`}
                        style={{ ...linkButton, color: "var(--pitch)" }}
                      >
                        Reset password
                      </ConfirmSubmitButton>
                    </form>
                    {" · "}
                    <form action={removeStaffAccess.bind(null, p.id)} style={{ display: "inline" }}>
                      <ConfirmSubmitButton
                        message={`Remove ${p.name}'s access? They will be signed out of everything straight away and will not be able to sign in again.`}
                        style={{ ...linkButton, color: "var(--card-red)" }}
                      >
                        Remove access
                      </ConfirmSubmitButton>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form action={createStaffAccount} style={cardStyle}>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>CREATE AN ACCOUNT</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <label style={labelStyle}>
            Full name *
            <input name="name" required maxLength={100} autoComplete="off" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Email address *
            <input name="email" type="email" required maxLength={254} autoComplete="off" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Role *
            <select name="role" required defaultValue="" style={inputStyle}>
              <option value="" disabled>Choose</option>
              <option value="SAFEGUARDING_LEAD">Safeguarding lead (or deputy)</option>
              <option value="MEDICAL_OFFICER">Medical officer</option>
            </select>
          </label>
        </div>
        <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "12px 0" }}>
          For a deputy, create a second Safeguarding lead account. Both can read and handle concerns. A safeguarding lead
          cannot see health records, and a medical officer cannot see safeguarding concerns. Use their own work email,
          not a shared one, so the access log shows who did what.
        </p>
        <button type="submit" className="button">Create account</button>
      </form>

      <p style={{ fontSize: "0.8rem", opacity: 0.65 }}>
        {leadCount} safeguarding lead{leadCount === 1 ? "" : "s"} &middot; {medicalCount} medical officer{medicalCount === 1 ? "" : "s"}
      </p>
    </div>
  );
}
