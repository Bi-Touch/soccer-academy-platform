import { prisma } from "@/lib/prisma";

export default async function AdminEnquiriesPage() {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ENQUIRIES</h1>

      {submissions.length === 0 && <p style={{ opacity: 0.7, marginTop: 24 }}>No enquiries yet.</p>}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {submissions.map((s) => (
          <div key={s.id} style={{ background: "white", padding: 20, borderLeft: "4px solid var(--floodlight)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{s.name}</strong>
              <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{s.createdAt.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: 4 }}>
              {s.email}{s.phone ? ` · ${s.phone}` : ""}
            </div>
            <p style={{ marginTop: 12 }}>{s.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}