"use client";

export function BarChart({
  data,
  orientation = "vertical",
  color = "var(--floodlight)",
  height = 180,
}: {
  data: { label: string; value: number }[];
  orientation?: "vertical" | "horizontal";
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);

  if (orientation === "horizontal") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 90, fontSize: "0.8rem", textAlign: "right", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.label}
            </div>
            <div style={{ flex: 1, background: "#e3ded2", height: 18, position: "relative" }}>
              <div
                style={{
                  width: `${(d.value / max) * 100}%`,
                  height: "100%",
                  background: color,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <div style={{ width: 28, fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>{d.value}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height, paddingTop: 20 }}>
      {data.map((d) => (
        <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 6 }}>{d.value}</div>
          <div
            style={{
              width: "100%",
              maxWidth: 48,
              height: `${(d.value / max) * (height - 50)}px`,
              background: color,
              transition: "height 0.6s ease",
            }}
          />
          <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: 8 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}