const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "#fdf3e2", fg: "var(--floodlight)" },
  UNDER_REVIEW: { bg: "#fdf3e2", fg: "var(--floodlight)" },
  CHANGES_REQUESTED: { bg: "#fdecec", fg: "var(--card-red)" },
  APPROVED: { bg: "#e7f3ed", fg: "var(--pitch)" },
  REJECTED: { bg: "#fdecec", fg: "var(--card-red)" },
};

export function StatusPill({ status }: { status: string }) {
  const style = STATUS_PILL[status] ?? { bg: "#eee", fg: "#555" };
  return (
    <span
      style={{
        display: "inline-block",
        background: style.bg,
        color: style.fg,
        fontWeight: 600,
        fontSize: "0.8rem",
        padding: "4px 12px",
        borderRadius: 999,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}