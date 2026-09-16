export default function Loading() {
  return (
    <div className="container" style={{ padding: "64px 24px", maxWidth: 720 }}>
      <div className="skel" style={{ width: 300, height: 44, marginBottom: 40 }} />
      <div className="skel" style={{ width: 100, height: 24, marginBottom: 16 }} />
      {[1, 2].map((i) => (
        <div key={i} style={{ borderBottom: "1px solid #e3ded2", padding: "14px 0" }}>
          <div className="skel" style={{ width: "50%", height: 18 }} />
        </div>
      ))}
      <style>{`
        .skel { background: #e3ded2; animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}