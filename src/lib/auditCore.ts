import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditActor = { id: string; name?: string | null; role?: string | null };

export type AuditEntry = {
  action: string;
  actor?: AuditActor | null;
  entityType?: string;
  entityId?: string;
  summary?: string;
  changes?: unknown;
};

const SENSITIVE_KEYS = new Set(["password", "passwordHash", "token", "secret", "auth", "p256dh", "endpoint"]);

function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value, (key, v) => (SENSITIVE_KEYS.has(key) ? "[redacted]" : v)));
}

function clientIp(): string | null {
  try {
    const h = headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actor?.id ?? null,
        actorName: entry.actor?.name ?? null,
        actorRole: entry.actor?.role ?? null,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        summary: entry.summary ?? null,
        changes: sanitize(entry.changes),
        ip: clientIp(),
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log:", entry.action, err);
  }
}

/** Returns only the fields whose value actually changed, as { field: { from, to } }. */
export function diffFields(before: Record<string, unknown> | null, after: Record<string, unknown>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    const from = before?.[key] ?? null;
    const to = after[key] ?? null;
    if (JSON.stringify(from) !== JSON.stringify(to)) out[key] = { from, to };
  }
  return out;
}