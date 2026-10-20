import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditActor = { id: string; name?: string | null; role?: string | null };

export type AuditEntry = {
  action: string;
  actor?: AuditActor | null;
  entityType?: string;
  entityId?: string;
  /** The player the entry is about, so you can answer "who accessed this player's data?". */
  playerId?: string | null;
  /** Why the record was accessed. Required by your own rules for safeguarding views. */
  reason?: string | null;
  summary?: string;
  changes?: unknown;
};

// Values under these keys are replaced with "[redacted]" before anything is stored.
// This is a safety net: sensitive content should never be passed in to begin with.
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "secret",
  "auth",
  "p256dh",
  "endpoint",
  "dateOfBirth",
  "email",
  "injuryType",
  // Health, identity and safeguarding content
  "medicalNotes",
  "allergies",
  "conditions",
  "medications",
  "insuranceInfo",
  "treatment",
  "outcome",
  "idNumber",
]);

function sanitize(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value, (key, v) => (SENSITIVE_KEYS.has(key) ? "[redacted]" : v)));
}

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();

    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null
    );
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
        playerId: entry.playerId ?? null,
        reason: entry.reason ?? null,
        summary: entry.summary ?? null,
        changes: sanitize(entry.changes),
        ip: await clientIp(),
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
