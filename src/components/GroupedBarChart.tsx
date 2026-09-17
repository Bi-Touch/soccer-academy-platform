"use client";

export function GroupedBarChart({
  labels,
  series,
  height = 180,
  max: maxProp,
  gridlines = 4,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  max?: number;
  gridlines?: number;
}) {
  if (labels.length === 0) return null;

  const plottedSeries = series.filter((s) => s.values.length > 0);
  const allValues = plottedSeries.flatMap((s) => s.values);
  const max = maxProp ?? Math.max(...allValues, 1);
  const chartHeight = height - 50;
  const gridStep = max / gridlines;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12, height: 20, flexWrap: "wrap" }}>
        {series.map((s, i) => (
          <div key={s.name + i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
            <span style={{ opacity: 0.75 }}>{s.name}</span>
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: chartHeight, pointerEvents: "none" }}>
          {Array.from({ length: gridlines + 1 }).map((_, i) => {
            const value = gridStep * i;
            const bottomPos = (value / max) * chartHeight;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: bottomPos,
                  left: 0,
                  right: 0,
                  borderTop: "1px dashed #e3ded2",
                  fontSize: "0.65rem",
                  color: "#999",
                }}
              >
                <span style={{ position: "relative", top: -7, background: "#fff", paddingRight: 4 }}>
                  {Math.round(value)}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, height, paddingTop: 20, position: "relative" }}>
          {labels.map((label, i) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: "100%" }}>
                {plottedSeries.map((s, si) => (
                  <div key={s.name + si} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: 4 }}>{s.values[i]}</div>
                    <div
                      style={{
                        width: 18,
                        height: `${(s.values[i] / max) * chartHeight}px`,
                        background: s.color,
                        transition: "height 0.6s ease",
                        borderRadius: "3px 3px 0 0",
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
    </div>
  );
}