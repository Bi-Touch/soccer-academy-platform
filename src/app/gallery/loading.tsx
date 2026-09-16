export default function Loading() {
  return (
    <div className="container" style={{ padding: "64px 24px" }}>
      <div className="skel" style={{ width: 200, height: 44, marginBottom: 40 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skel" style={{ aspectRatio: "4/3" }} />
        ))}
      </div>
      <style>{`
        .skel { background: #e3ded2; animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}