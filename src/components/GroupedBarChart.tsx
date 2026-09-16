"use client";

export function GroupedBarChart({
  labels,
  series,
  height = 180,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
}) {
  if (labels.length === 0) return null;

  const plottedSeries = series.filter((s) => s.values.length > 0);
  const allValues = plottedSeries.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, height: 20 }}>
        {series.map((s, i) => (
          <div key={s.name + i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
            <span style={{ width: 10, height: 10, background: s.color, display: "inline-block" }} />
            {s.name}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height, paddingTop: 20 }}>
        {labels.map((label, i) => (
          <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: "100%" }}>
              {plottedSeries.map((s, si) => (
                <div key={s.name + si} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 4 }}>{s.values[i]}</div>
                  <div
                    style={{
                      width: 18,
                      height: `${(s.values[i] / max) * (height - 50)}px`,
                      background: s.color,
                      transition: "height 0.6s ease",
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.65, marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}