export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: item.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.8rem", opacity: 0.75 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}