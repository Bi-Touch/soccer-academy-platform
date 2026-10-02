import { prisma } from "@/lib/prisma";
import { SearchableList } from "@/components/SearchableList";

export default async function AdminEnquiriesPage() {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const items = submissions.map((s) => ({
    id: s.id,
    label: `${s.name} ${s.email} ${s.phone ?? ""} ${s.message}`,
    node: (
      <div style={{ background: "white", padding: 20, borderLeft: "4px solid var(--floodlight)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>{s.name}</strong>
          <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{s.createdAt.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: "0.85rem", opacity: 0.75, marginTop: 4 }}>
          {s.email}{s.phone ? ` · ${s.phone}` : ""}
        </div>
        <p style={{ marginTop: 12 }}>{s.message}</p>
      </div>
    ),
  }));

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ENQUIRIES</h1>

      <div style={{ marginTop: 24 }}>
        <SearchableList
          items={items}
          placeholder="Search enquiries by name, email, or message..."
          emptyMessage="No enquiries yet."
        />
      </div>
    </div>
  );
}