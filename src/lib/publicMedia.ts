import { prisma } from "@/lib/prisma";
import { getConsentedPlayerIds } from "@/lib/consentLedger";

/**
 * Everything shown to the general public must come through these two functions.
 *
 * A photo or video is public only when ALL of these are true:
 *  1. An administrator marked it isPublic.
 *  2. Every player tagged in it currently has the needed consents
 *     (photos: PUBLIC_MEDIA + PHOTOGRAPHY, videos: PUBLIC_MEDIA + VIDEO).
 *
 * The consent check runs on every request, so a withdrawal takes effect as soon as the
 * parent saves it. The pages that call these must not be statically cached
 * (export const dynamic = "force-dynamic").
 *
 * If the lookup fails the error propagates and the page fails, instead of falling back to
 * showing everything.
 *
 * Players are NOT returned, so the browser never receives who is tagged in an image.
 * Untagged items are treated as showing no identifiable player, so tag every identifiable
 * player before marking anything public.
 */
export async function getPublicPhotos() {
  const [photos, consented] = await Promise.all([
    prisma.galleryPhoto.findMany({
      where: { isPublic: true },
      include: { players: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getConsentedPlayerIds(["PUBLIC_MEDIA", "PHOTOGRAPHY"]),
  ]);

  return photos
    .filter((photo) => photo.players.every((player) => consented.has(player.id)))
    .map((photo) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
      teamId: photo.teamId,
      createdAt: photo.createdAt,
      isPublic: photo.isPublic,
    }));
}

export async function getPublicVideos() {
  const [videos, consented] = await Promise.all([
    prisma.video.findMany({
      where: { isPublic: true },
      include: { players: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getConsentedPlayerIds(["PUBLIC_MEDIA", "VIDEO"]),
  ]);

  return videos
    .filter((video) => video.players.every((player) => consented.has(player.id)))
    .map((video) => ({
      id: video.id,
      title: video.title,
      description: video.description,
      url: video.url,
      thumbnailUrl: video.thumbnailUrl,
      teamId: video.teamId,
      createdAt: video.createdAt,
      isPublic: video.isPublic,
    }));
}

/**
 * How a child's name appears on public pages. "initial" shows first name and last
 * initial (for example "Brian K."), which limits what a stranger can learn about a child.
 * Change to "full" if the Academy decides to publish full names and the consent wording
 * says so.
 */
const PUBLIC_NAME_STYLE: "initial" | "full" = "initial";

export function publicPlayerName(fullName: string): string {
  const name = fullName.trim();
  if (PUBLIC_NAME_STYLE === "full") return name;

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
