import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSafeguardingLead } from "@/lib/permissions";
import { formatDate } from "@/lib/dates";
import { CATEGORY_LABELS, STALE_DAYS, STATUS_LABELS, concernRef, daysSince } from "@/lib/safeguarding";

const cellStyle = { padding: "10px 12px", borderBottom: "1px solid #f0ede5", fontSize: "0.9rem", verticalAlign: "top" } as const;

/**
 * The safeguarding lead's list. It shows who and what kind of concern, never the description.
 * Opening a concern asks for a reason, and the view is logged.
 */
export default async function SafeguardingListPage(props: {
  searchParams: Promise<{ show?: string }>;
}) {
  const lead = await requireSafeguardingLead().catch(() => null);
  if (!lead) notFound();

  const search = await props.searchParams;
  const showAll = search.show === "all";

  const [concerns, openCount, reviewCount, referredCount] = await Promise.all([
    prisma.safeguardingConcern.findMany({
      where: showAll ? {} : { status: { not: "CLOSED" } },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        assignedToId: true,
        player: { select: { name: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: showAll ? "desc" : "asc" },
    }),
    prisma.safeguardingConcern.count({ where: { status: "OPEN" } }),
    prisma.safeguardingConcern.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.safeguardingConcern.count({ where: { status: "REFERRED_EXTERNAL" } }),
  ]);

  const assigneeIds = [...new Set(concerns.map((c) => c.assignedToId).filter((id): id is string => !!id))];
  const assignees = assigneeIds.length
    ? await prisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true } })
    : [];
  const assigneeName = new Map<string, string>(
    assignees.map((a: { id: string; name: string }): [string, string] => [a.id, a.name])
  );

  const unassigned = concerns.filter((c) => c.status === "OPEN" && !c.assignedToId).length;
  const stale = concerns.filter((c) => c.status !== "CLOSED" && daysSince(c.createdAt) >= STALE_DAYS).length;

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginBottom: 8 }}>SAFEGUARDING</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16 }}>
        Only safeguarding leads can see this area. Opening a concern asks for a reason and is recorded. Nothing here is ever deleted.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/admin/safeguarding/report" className="button">Raise a concern</Link>
        <Link href="/admin/safeguarding/clearances" className="button secondary">Staff clearances</Link>
        <Link href="/admin/safeguarding/access-log" className="button secondary">Access log</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          ["Open", openCount],
          ["Under review", reviewCount],
          ["Referred outside", referredCount],
        ].map(([label, value]) => (
          <div key={label as string} style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 16 }}>
            <div className="display" style={{ fontSize: "1.8rem" }}>{value}</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</div>
          </div>
        ))}
      </div>

      {(unassigned > 0 || stale > 0) && (
        <div role="status" style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
          {unassigned > 0 && <div>{unassigned} open concern{unassigned === 1 ? " has" : "s have"} not been assigned.</div>}
          {stale > 0 && <div>{stale} concern{stale === 1 ? " has" : "s have"} been open for {STALE_DAYS} days or more.</div>}
        </div>
      )}

      <p style={{ fontSize: "0.9rem", marginBottom: 12 }}>
        <Link href={showAll ? "/admin/safeguarding" : "/admin/safeguarding?show=all"} style={{ textDecoration: "underline" }}>
          {showAll ? "Show only concerns that are not closed" : "Include closed concerns"}
        </Link>
      </p>

      {concerns.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No concerns to show.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ fontSize: "0.75rem", opacity: 0.65 }}>
                <th style={cellStyle}>Reference</th>
                <th style={cellStyle}>Raised</th>
                <th style={cellStyle}>Type</th>
                <th style={cellStyle}>Child</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Assigned to</th>
                <th style={cellStyle} />
              </tr>
            </thead>
            <tbody>
              {concerns.map((c) => {
                const age = daysSince(c.createdAt);
                const overdue = c.status !== "CLOSED" && age >= STALE_DAYS;
                return (
                  <tr key={c.id}>
                    <td style={cellStyle}>{concernRef(c.id)}</td>
                    <td style={cellStyle}>
                      {formatDate(c.createdAt)}
                      <div style={{ fontSize: "0.75rem", color: overdue ? "var(--card-red)" : undefined, opacity: overdue ? 1 : 0.6 }}>
                        {age} day{age === 1 ? "" : "s"} ago
                      </div>
                    </td>
                    <td style={cellStyle}>{CATEGORY_LABELS[c.category]}</td>
                    <td style={cellStyle}>
                      {c.player ? c.player.name?.trim() || c.player.user?.name || "Unnamed player" : <span style={{ opacity: 0.6 }}>Not a specific child</span>}
                    </td>
                    <td style={cellStyle}>{STATUS_LABELS[c.status]}</td>
                    <td style={cellStyle}>
                      {c.assignedToId ? assigneeName.get(c.assignedToId) ?? "Unknown" : <span style={{ color: c.status === "OPEN" ? "var(--card-red)" : undefined, opacity: c.status === "OPEN" ? 1 : 0.6 }}>Unassigned</span>}
                    </td>
                    <td style={cellStyle}>
                      <Link href={`/admin/safeguarding/${c.id}`} style={{ textDecoration: "underline", color: "var(--pitch)" }}>Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
