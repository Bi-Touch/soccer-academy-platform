export default function Loading() {
  return (
    <div className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
      <div style={{ width: 220, height: 44, background: "#e3ded2", marginBottom: 40 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ borderBottom: "1px solid #e3ded2", padding: "24px 0" }}>
          <div style={{ width: "60%", height: 28, background: "#e3ded2", marginBottom: 10 }} />
          <div style={{ width: "90%", height: 16, background: "#eee" }} />
        </div>
      ))}
      <style>{`
        div { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}