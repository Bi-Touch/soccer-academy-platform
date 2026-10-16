import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/permissions";

const PAGE_SIZE = 50;

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e3ded2",
  borderRadius: 8,
};

type SearchParams = { q?: string; action?: string; from?: string; to?: string; page?: string };

const ACTION_FILTERS = [
  { value: "", label: "All actions" },
  { value: "auth.", label: "Sign-ins" },
  { value: "player.", label: "Players" },
  { value: "guardian.", label: "Parents / guardians" },
  { value: "consent.", label: "Consent" },
  { value: "import.", label: "Imports" },
  { value: "user.", label: "User accounts" },
];

function parseDate(value: string | undefined, endOfDay: boolean) {
  if (!value) return undefined;
  const d = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return isNaN(d.getTime()) ? undefined : d;
}

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/admin");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const q = searchParams.q?.trim();

  const where: Prisma.AuditLogWhereInput = {};
  if (searchParams.action) where.action = { startsWith: searchParams.action };
  if (q) {
    where.OR = [
      { actorName: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { entityId: q },
    ];
  }
  const gte = parseDate(searchParams.from, false);
  const lte = parseDate(searchParams.to, true);
  if (gte || lte) where.createdAt = { ...(gte && { gte }), ...(lte && { lte }) };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (searchParams.action) params.set("action", searchParams.action);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    params.set("page", String(p));
    return `/admin/audit?${params.toString()}`;
  }

  const inputStyle = { display: "block", padding: 8, marginTop: 4 };

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>AUDIT LOG</h1>
      <p style={{ opacity: 0.7, marginTop: 4, fontSize: "0.9rem" }}>
        A record of who did what, and when. Entries can't be edited or deleted from the app.
      </p>

      <form method="GET" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 20 }}>
        <label style={{ fontSize: "0.8rem" }}>
          Search
          <input name="q" defaultValue={q ?? ""} placeholder="Name, summary or record id" style={{ ...inputStyle, minWidth: 220 }} />
        </label>
        <label style={{ fontSize: "0.8rem" }}>
          Action
          <select name="action" defaultValue={searchParams.action ?? ""} style={inputStyle}>
            {ACTION_FILTERS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: "0.8rem" }}>
          From
          <input name="from" type="date" defaultValue={searchParams.from ?? ""} style={inputStyle} />
        </label>
        <label style={{ fontSize: "0.8rem" }}>
          To
          <input name="to" type="date" defaultValue={searchParams.to ?? ""} style={inputStyle} />
        </label>
        <button type="submit" className="button">Filter</button>
        <Link href="/admin/audit" className="button outline">Reset</Link>
      </form>

      <p style={{ marginTop: 20, fontSize: "0.85rem", opacity: 0.7 }}>
        {total} entr{total === 1 ? "y" : "ies"}
      </p>

      <div style={{ ...cardStyle, marginTop: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)", fontSize: "0.85rem" }}>
              <th style={{ padding: "12px 16px" }}>When</th>
              <th style={{ padding: "12px 8px" }}>Who</th>
              <th style={{ padding: "12px 8px" }}>Action</th>
              <th style={{ padding: "12px 8px" }}>Summary</th>
              <th style={{ padding: "12px 16px" }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #e3ded2", fontSize: "0.85rem", verticalAlign: "top" }}>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                  {r.createdAt.toLocaleString("en-GB", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "medium" })}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {r.actorName ?? "—"}
                  {r.actorRole && <div style={{ opacity: 0.55, fontSize: "0.75rem" }}>{r.actorRole}</div>}
                </td>
                <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{r.action}</td>
                <td style={{ padding: "10px 8px" }}>
                  {r.summary ?? "—"}
                  {r.entityType && (
                    <div style={{ opacity: 0.55, fontSize: "0.75rem" }}>
                      {r.entityType}{r.entityId ? ` · ${r.entityId}` : ""}
                    </div>
                  )}
                  {r.changes != null && (
                    <details style={{ marginTop: 6 }}>
                      <summary style={{ cursor: "pointer", fontSize: "0.75rem", opacity: 0.7 }}>Details</summary>
                      <pre style={{ fontSize: "0.72rem", background: "var(--chalk)", padding: 8, borderRadius: 4, overflowX: "auto", margin: "6px 0 0" }}>
                        {JSON.stringify(r.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
                <td style={{ padding: "10px 16px", whiteSpace: "nowrap", opacity: 0.7 }}>{r.ip ?? "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "24px 16px", opacity: 0.7 }}>No entries match those filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16, fontSize: "0.9rem" }}>
          {page > 1 && <Link href={pageHref(page - 1)} className="button outline sm">&larr; Newer</Link>}
          <span style={{ opacity: 0.7 }}>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={pageHref(page + 1)} className="button outline sm">Older &rarr;</Link>}
        </div>
      )}
    </div>
  );
}