// The Academy is in Kenya, so show times in Nairobi time regardless of
// whether the page renders on a laptop or on Vercel's UTC servers.
const TZ = "Africa/Nairobi";

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}