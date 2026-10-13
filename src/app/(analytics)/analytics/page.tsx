import Link from "next/link";
import { requireViewer, getAccessibleTeamIds } from "@/lib/permissions";
import { TABS, isTabKey, loadKpis, loadTable, loadTeams, ROW_LIMIT, type TabKey } from "@/lib/analytics";
import { DataTable } from "@/components/DataTable";

const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20 };
const fieldLabel: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, display: "flex", flexDirection: "column", gap: 4 };
const fieldInput: React.CSSProperties = { padding: 10, border: "1px solid #d8d2c2", borderRadius: 6, minWidth: 150, fontWeight: 400 };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { tab?: string; team?: string; from?: string; to?: string };
}) {
  const user = await requireViewer();
  const accessible = await getAccessibleTeamIds(user);

  const tab: TabKey = isTabKey(searchParams.tab) ? searchParams.tab : "players";
  const filters = {
    teamId: searchParams.team || undefined,
    from: searchParams.from || undefined,
    to: searchParams.to || undefined,
  };

  const [teams, kpis, table] = await Promise.all([
    loadTeams(accessible),
    loadKpis(filters, accessible),
    loadTable(tab, filters, accessible),
  ]);

  function tabHref(t: TabKey) {
    const p = new URLSearchParams({ tab: t });
    if (filters.teamId) p.set("team", filters.teamId);
    if (filters.from) p.set("from", filters.from);
    if (filters.to) p.set("to", filters.to);
    return `/analytics?${p.toString()}`;
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";
  const scopeLabel = filters.teamId ? teams.find((t) => t.id === filters.teamId)?.name ?? "Selected team" : "All teams";

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>ANALYTICS DASHBOARD</h1>
      <p style={{ opacity: 0.7, marginTop: 4, marginBottom: 24, fontSize: "0.9rem" }}>
        Read-only view of academy data &middot; {scopeLabel}
        {filters.from || filters.to ? ` · ${filters.from ?? "start"} to ${filters.to ?? "today"}` : ""}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ ...cardStyle, borderTop: "3px solid var(--floodlight)", padding: 16 }}>
            <div style={{ fontSize: "0.75rem", opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
            <div className="display" style={{ fontSize: "2rem", color: "var(--pitch)", marginTop: 6 }}>{k.value}</div>
            {k.hint && <div style={{ fontSize: "0.75rem", opacity: 0.55, marginTop: 2 }}>{k.hint}</div>}
          </div>
        ))}
      </div>

      <form
        method="GET"
        className="analytics-filters"
        style={{ ...cardStyle, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}
      >
        <input type="hidden" name="tab" value={tab} />
        <label style={fieldLabel}>
          Team
          <select name="team" defaultValue={filters.teamId ?? ""} style={fieldInput}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          From
          <input type="date" name="from" defaultValue={filters.from ?? ""} style={fieldInput} />
        </label>
        <label style={fieldLabel}>
          To
          <input type="date" name="to" defaultValue={filters.to ?? ""} style={fieldInput} />
        </label>
        <button type="submit" className="button">Apply filters</button>
        <Link href={`/analytics?tab=${tab}`} className="button outline">Reset</Link>
      </form>

      <nav
        className="analytics-tabs"
        style={{ display: "flex", gap: 4, borderBottom: "1px solid #e3ded2", marginBottom: 20, overflowX: "auto", whiteSpace: "nowrap" }}
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            style={{
              padding: "10px 18px",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--pitch)" : "inherit",
              borderBottom: tab === t.key ? "2px solid var(--floodlight)" : "2px solid transparent",
            }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <h2 className="display" style={{ fontSize: "1.4rem", color: "var(--pitch)", marginBottom: 12 }}>{activeLabel.toUpperCase()}</h2>

      {table.truncated && (
        <div style={{ background: "#fdf3e2", border: "1px solid var(--floodlight)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.85rem" }}>
          Showing the most recent {ROW_LIMIT.toLocaleString()} records. Narrow the date range or pick a team to see everything.
        </div>
      )}

      <DataTable
        key={`${tab}|${filters.teamId}|${filters.from}|${filters.to}`}
        columns={table.columns}
        rows={table.rows}
        stickyCol={table.stickyCol}
        filename={`academy-${tab}-${today}.csv`}
      />

      <p className="no-print" style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: 24 }}>
        View only &mdash; this dashboard cannot change any data.
      </p>
    </div>
  );
}