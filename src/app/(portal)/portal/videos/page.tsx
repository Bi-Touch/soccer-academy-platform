import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function VideosPage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
    include: { team: { include: { videos: { orderBy: { createdAt: "desc" } } } } },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>VIDEOS</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginTop: 24 }}>
        {(!player?.team?.videos || player.team.videos.length === 0) && (
          <p style={{ opacity: 0.7 }}>No videos posted yet.</p>
        )}
        {player?.team?.videos.map((video) => (
          <a key={video.id} href={video.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ background: "var(--pitch-dark)", aspectRatio: "16/9" }} />
            <div style={{ padding: "8px 0", fontWeight: 600 }}>{video.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
