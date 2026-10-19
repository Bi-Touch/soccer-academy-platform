import { prisma } from "@/lib/prisma";
import { requireOwnedChild } from "@/lib/parentAccess";
import { ChildPageShell } from "@/components/parent/ChildPageShell";

export default async function ParentChildVideosPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { player, child } = await requireOwnedChild(params.id);

  // Team videos for this child's team, plus academy-wide videos (no team set).
  const videos = await prisma.video.findMany({
    where: player.teamId ? { OR: [{ teamId: player.teamId }, { teamId: null }] } : { teamId: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ChildPageShell child={child} active="videos">
      {videos.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No videos have been shared yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", background: "white", border: "1px solid #e3ded2", borderRadius: 8, overflow: "hidden", textDecoration: "none", color: "inherit" }}
            >
              {v.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnailUrl} alt="" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ aspectRatio: "16 / 9", background: "#f4f3ef", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pitch)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
              )}
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 600 }}>{v.title}</div>
                {v.description && (
                  <div style={{ fontSize: "0.8rem", opacity: 0.65, marginTop: 4, lineHeight: 1.4 }}>{v.description}</div>
                )}
                <div style={{ fontSize: "0.8rem", color: "var(--pitch)", marginTop: 8, fontWeight: 600 }}>Watch &rarr;</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </ChildPageShell>
  );
}