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

export function BarChart({
  data,
  orientation = "vertical",
  color = "var(--floodlight)",
  height = 180,
  max: maxProp,
  unit = "",
}: {
  data: { label: string; value: number }[];
  orientation?: "vertical" | "horizontal";
  color?: string;
  height?: number;
  max?: number;
  unit?: string;
}) {
  if (data.length === 0) return null;
  const max = maxProp ?? Math.max(...data.map((d) => d.value), 1);

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
            <div style={{ width: 40, fontSize: "0.8rem", fontWeight: 600, flexShrink: 0 }}>
              {d.value}{unit}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const topPad = 22;
  const bottomLabelH = 28;
  const chartHeight = height - topPad - bottomLabelH;
  const gridValues = getNiceGridlineValues(max);

  return (
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
                {value}{unit}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, height: "100%", position: "relative" }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ height: topPad, display: "flex", alignItems: "flex-end", fontSize: "0.8rem", fontWeight: 600 }}>
              {d.value}{unit}
            </div>
            <div style={{ height: chartHeight, width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 48,
                  height: `${(d.value / max) * chartHeight}px`,
                  background: color,
                  transition: "height 0.6s ease",
                  borderRadius: "3px 3px 0 0",
                }}
              />
            </div>
            <div style={{ height: bottomLabelH, display: "flex", alignItems: "flex-start", paddingTop: 6, fontSize: "0.75rem", opacity: 0.65 }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}