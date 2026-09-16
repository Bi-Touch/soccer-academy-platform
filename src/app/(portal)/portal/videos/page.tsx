import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VideoGrid } from "@/components/VideoGrid";

export default async function VideosPage() {
  const session = await getServerSession(authOptions);

  const player = await prisma.player.findUnique({
    where: { userId: session!.user.id },
  });

  const videos = await prisma.video.findMany({
    where: {
      OR: [{ teamId: null }, { teamId: player?.teamId ?? undefined }],
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>VIDEOS</h1>
      <div style={{ marginTop: 24 }}>
        {videos.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No videos posted yet.</p>
        ) : (
          <VideoGrid videos={videos} />
        )}
      </div>
    </div>
  );
}