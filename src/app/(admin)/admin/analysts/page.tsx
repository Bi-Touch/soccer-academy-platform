import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { SubmitButton } from "@/components/SubmitButton";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { createAnalyst, deleteAnalyst } from "./actions";

const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 };

export default async function AdminAnalystsPage() {
  await requireAdmin();
  const analysts = await prisma.user.findMany({ where: { role: "ANALYST" }, orderBy: { name: "asc" } });

  return (
    <div className="form-page">
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ANALYSTS</h1>
      <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 24, fontSize: "0.9rem" }}>
        Analysts get read-only access to the Analytics dashboard and nothing else. They cannot open the staff admin or change any data.
      </p>

      <form action={createAnalyst} style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 32 }}>
        <label style={{ fontSize: "0.85rem" }}>
          Full name
          <input name="name" required style={inputStyle} />
        </label>
        <label style={{ fontSize: "0.85rem", display: "block", marginTop: 16 }}>
          Email (used to log in)
          <input name="email" type="email" required style={inputStyle} />
        </label>
        <label style={{ fontSize: "0.85rem", display: "block", marginTop: 16 }}>
          Temporary password
          <input name="password" type="password" required minLength={8} style={inputStyle} />
        </label>
        <div style={{ marginTop: 20 }}>
          <SubmitButton pendingText="Creating…">Create analyst</SubmitButton>
        </div>
      </form>

      <h2 className="display" style={{ fontSize: "1.2rem", color: "var(--pitch)", marginBottom: 12 }}>CURRENT ANALYSTS</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {analysts.map((a) => (
          <div key={a.id} style={{ background: "white", border: "1px solid #e3ded2", borderRadius: 8, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <strong>{a.name}</strong>
              <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{a.email}</div>
            </div>
            <form action={deleteAnalyst.bind(null, a.id)}>
              <ConfirmSubmitButton
                message={`Remove ${a.name}? They will no longer be able to sign in.`}
                style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
              >
                Remove
              </ConfirmSubmitButton>
            </form>
          </div>
        ))}
        {analysts.length === 0 && <p style={{ opacity: 0.7 }}>No analysts yet.</p>}
      </div>
    </div>
  );
}