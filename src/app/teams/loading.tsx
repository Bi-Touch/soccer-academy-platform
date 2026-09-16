export default function Loading() {
  return (
    <div className="container" style={{ padding: "64px 24px" }}>
      <div className="skel" style={{ width: 260, height: 44, marginBottom: 40 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", borderTop: "3px solid #e3ded2" }}>
            <div className="skel" style={{ width: 56, height: 56, borderRadius: "50%" }} />
            <div>
              <div className="skel" style={{ width: 140, height: 22, marginBottom: 6 }} />
              <div className="skel" style={{ width: 100, height: 14 }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .skel { background: #e3ded2; animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}