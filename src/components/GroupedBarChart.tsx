"use client";

function getNiceGridlineValues(max: number, targetCount = 4): number[] {
  if (max <= 0) return [0];
  const rawStep = max / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceStep;
  if (residual > 5) niceStep = 10 * magnitude;
  else if (residual > 2) niceStep = 5 * magnitude;
  else if (residual > 1) niceStep = 2 * magnitude;
  else niceStep = magnitude;

  const values: number[] = [];
  for (let v = 0; v <= max + 0.0001; v += niceStep) {
    values.push(Math.round(v * 100) / 100);
  }
  return values;
}

export function GroupedBarChart({
  labels,
  series,
  height = 180,
  max: maxProp,
}: {
  labels: string[];
  series: { name: string; color: string; values: number[] }[];
  height?: number;
  max?: number;
}) {
  if (labels.length === 0) return null;

  const plottedSeries = series.filter((s) => s.values.length > 0);
  const allValues = plottedSeries.flatMap((s) => s.values);
  const max = maxProp ?? Math.max(...allValues, 1);

  const barWidth = 18;
  const barGap = 4;
  const topPad = 22;
  const bottomLabelH = 28;
  const chartHeight = height - topPad - bottomLabelH;
  const gridValues = getNiceGridlineValues(max);

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

      <div style={{ position: "relative", height }}>
        <div style={{ position: "absolute", top: topPad, left: 0, right: 0, height: chartHeight, pointerEvents: "none" }}>
          {gridValues.map((value, i) => {
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
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 20, height: "100%", position: "relative" }}>
          {labels.map((label, i) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ height: topPad, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: barGap }}>
                {plottedSeries.map((s, si) => (
                  <span key={s.name + si} style={{ width: barWidth, textAlign: "center", fontSize: "0.75rem", fontWeight: 600 }}>
                    {s.values[i]}
                  </span>
                ))}
              </div>
              <div style={{ height: chartHeight, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: barGap }}>
                {plottedSeries.map((s, si) => (
                  <div
                    key={s.name + si}
                    style={{
                      width: barWidth,
                      height: `${(s.values[i] / max) * chartHeight}px`,
                      background: s.color,
                      transition: "height 0.6s ease",
                      borderRadius: "3px 3px 0 0",
                    }}
                  />
                ))}
              </div>
              <div style={{ height: bottomLabelH, display: "flex", alignItems: "flex-start", paddingTop: 6, fontSize: "0.75rem", opacity: 0.65 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}