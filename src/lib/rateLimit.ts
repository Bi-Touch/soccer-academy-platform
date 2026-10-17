import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

function getClientIp(): string | null {
  try {
    const h = headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

/**
 * Per-IP limit for public forms, with no extra table or service.
 *
 * It counts how many audit entries with this action this IP has already produced inside the
 * window, so it relies on the form calling logAudit with the same action name after each
 * successful submission. Blocked and honeypot requests write nothing, so they never count.
 *
 * If the IP can't be determined, the request is allowed rather than blocked.
 */
export async function isRateLimited(action: string, max: number, windowMinutes: number): Promise<boolean> {
  const ip = getClientIp();
  if (!ip) return false;

  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const recent = await prisma.auditLog.count({
    where: { action, ip, createdAt: { gte: since } },
  });
  return recent >= max;
}

/**
 * Limit per record instead of per IP, e.g. "no more than 3 reset emails per account per hour".
 * This stops one account being flooded from many different IPs. Same rules as above: it counts
 * audit entries, so the action must call logAudit with this entityId after each success.
 */
export async function isRateLimitedForEntity(
  action: string,
  entityId: string,
  max: number,
  windowMinutes: number
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const recent = await prisma.auditLog.count({
    where: { action, entityId, createdAt: { gte: since } },
  });
  return recent >= max;
}
