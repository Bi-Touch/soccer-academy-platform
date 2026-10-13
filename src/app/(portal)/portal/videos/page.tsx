import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoGrid } from "@/components/VideoGrid";

export default async function VideosPage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
  });

  // Untagged videos only: all-teams, plus the player's own team if they have one.
  const teamVisible = {
    players: { none: {} },
    OR: [{ teamId: null }, ...(player?.teamId ? [{ teamId: player.teamId }] : [])],
  };

  const [personal, shared] = await Promise.all([
    player
      ? prisma.video.findMany({
          where: { players: { some: { id: player.id } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.video.findMany({ where: teamVisible, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>VIDEOS</h1>

      {personal.length === 0 && shared.length === 0 && (
        <p style={{ opacity: 0.7, marginTop: 24 }}>No videos posted yet.</p>
      )}

      {personal.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
            JUST FOR YOU
          </h2>
          <VideoGrid videos={personal} />
        </div>
      )}

      {shared.length > 0 && (
        <div style={{ marginTop: 32 }}>
          {personal.length > 0 && (
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 12 }}>
              TEAM VIDEOS
            </h2>
          )}
          <VideoGrid videos={shared} />
        </div>
      )}
    </div>
  );
}