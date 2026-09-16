export type VideoKind = "youtube" | "vimeo" | "file" | "unknown";

export function getVideoKind(url: string): VideoKind {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return "file";
  return "unknown";
}

export function getEmbedUrl(url: string): string | null {
  const kind = getVideoKind(url);

  if (kind === "youtube") {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    const id = watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (kind === "vimeo") {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : null;
  }

  return null;
}