"use client";

export function BarChart({
  data,
  orientation = "vertical",
  color = "var(--floodlight)",
  height = 180,
  max: maxProp,
  unit = "",
  gridlines = 4,
}: {
  data: { label: string; value: number }[];
  orientation?: "vertical" | "horizontal";
  color?: string;
  height?: number;
  max?: number;
  unit?: string;
  gridlines?: number;
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

  // Fixed pixel slots so bars, gridlines, and labels all agree on where "zero" is
  const topPad = 22;        // space reserved for the value label above each bar
  const bottomLabelH = 28;  // space reserved for the date/season label below each bar
  const chartHeight = height - topPad - bottomLabelH;
  const gridStep = max / gridlines;

  return (
    <div style={{ position: "relative", height }}>
      {/* Gridlines, anchored to the exact same box the bars grow inside */}
      <div style={{ position: "absolute", top: topPad, left: 0, right: 0, height: chartHeight, pointerEvents: "none" }}>
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
                {Math.round(value)}{unit}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, height: "100%", position: "relative" }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* value label — fixed height slot */}
            <div style={{ height: topPad, display: "flex", alignItems: "flex-end", fontSize: "0.8rem", fontWeight: 600 }}>
              {d.value}{unit}
            </div>
            {/* bar — fixed height slot, bar grows up from the bottom of this box */}
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
            {/* date/season label — fixed height slot */}
            <div style={{ height: bottomLabelH, display: "flex", alignItems: "flex-start", paddingTop: 6, fontSize: "0.75rem", opacity: 0.65 }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}