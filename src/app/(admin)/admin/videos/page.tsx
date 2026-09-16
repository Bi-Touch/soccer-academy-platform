import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteVideo } from "./actions";
import { getSessionUser, getAccessibleTeamIds } from "@/lib/permissions";

export default async function AdminVideosPage() {
  const user = await getSessionUser();
  const accessibleTeamIds = user ? await getAccessibleTeamIds(user) : null;

  const videos = await prisma.video.findMany({
    where: accessibleTeamIds ? { teamId: { in: accessibleTeamIds } } : undefined,
    include: { team: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="display" style={{ fontSize: "2.4rem", color: "var(--pitch)" }}>VIDEOS</h1>
        <Link href="/admin/videos/new" className="button">+ Add Video</Link>
      </div>

      <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--ink)" }}>
            <th style={{ padding: "8px 0" }}>Title</th>
            <th>Team</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} style={{ borderBottom: "1px solid #e3ded2" }}>
              <td style={{ padding: "8px 0" }}>
                <a href={video.url} target="_blank" rel="noreferrer">{video.title}</a>
              </td>
              <td>{video.team?.name ?? "All teams"}</td>
              <td style={{ textAlign: "right" }}>
                <form action={deleteVideo.bind(null, video.id)} style={{ display: "inline" }}>
                  <button
                    type="submit"
                    style={{ background: "none", border: "none", color: "var(--card-red)", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
                  >
                    Remove
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {videos.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: "24px 0", opacity: 0.7 }}>
                {accessibleTeamIds && accessibleTeamIds.length === 0
                  ? "You aren't assigned to any teams yet."
                  : 'No videos yet — click "Add Video" to post the first one.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}