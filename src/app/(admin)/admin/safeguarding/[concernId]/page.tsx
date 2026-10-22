import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSafeguardingLead } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
import { HEALTH_CONTEXT, decryptForDisplay } from "@/lib/healthCrypto";
import {
  CATEGORY_LABELS,
  EMERGENCY_NOTICE,
  STATUS_LABELS,
  VIEW_REASONS,
  concernRef,
  isViewReason,
} from "@/lib/safeguarding";
import { updateConcern } from "../actions";

const cardStyle = { background: "#fff", border: "1px solid #e3ded2", borderRadius: 8, padding: 20, marginBottom: 20 } as const;
const headingStyle = { fontSize: "0.85rem", fontWeight: 600, color: "var(--pitch)", marginBottom: 8 } as const;
const inputStyle = { display: "block", width: "100%", padding: 10, marginTop: 4 } as const;
const labelStyle = { fontSize: "0.85rem", display: "block", marginTop: 12 } as const;

const ERRORS: Record<string, string> = {
  outcome: "To close a concern, record the outcome (at least a sentence).",
  reopen: "To reopen a closed concern, add a note explaining why.",
  empty: "Nothing to save. Add a note, or change the status or assignment.",
  assignee: "That person cannot be assigned. Choose a safeguarding lead.",
  secure: "This could not be saved securely, so nothing was saved. Check the health data encryption key.",
};

export default async function ConcernPage(props: {
  params: Promise<{ concernId: string }>;
  searchParams: Promise<{ reason?: string; saved?: string; error?: string }>;
}) {
  const lead = await requireSafeguardingLead().catch(() => null);
  if (!lead) notFound();

  const params = await props.params;
  const search = await props.searchParams;

  const concern = await prisma.safeguardingConcern.findUnique({
    where: { id: params.concernId },
    include: {
      actions: { orderBy: { createdAt: "asc" } },
      player: {
        select: {
          id: true,
          name: true,
          user: { select: { name: true } },
          team: { select: { name: true } },
          parentGuardian: { select: { firstName: true, lastName: true, relationship: true, phone: true } },
          emergencyContacts: { orderBy: { isPrimary: "desc" } },
        },
      },
    },
  });
  if (!concern) notFound();

  const ref = concernRef(concern.id);
  const reason = isViewReason(search.reason) ? search.reason : null;

  // Step 1: ask why the record is being opened. Nothing sensitive is shown until a reason is given.
  if (!reason) {
    return (
      <div style={{ maxWidth: 560 }}>
        <Link href="/admin/safeguarding" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Safeguarding</Link>
        <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", margin: "12px 0 8px" }}>{ref}</h1>
        <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
          {STATUS_LABELS[concern.status]} &middot; raised {formatDate(concern.createdAt)}
        </p>
        <form method="get" style={cardStyle}>
          <p style={{ fontSize: "0.9rem", margin: "0 0 8px" }}>
            Opening this record is logged. Why are you opening it?
          </p>
          <select name="reason" required defaultValue="" style={inputStyle}>
            <option value="" disabled>Choose a reason</option>
            {Object.entries(VIEW_REASONS).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <button type="submit" className="button" style={{ marginTop: 12 }}>Open record</button>
        </form>
      </div>
    );
  }

  // Step 2: log the view with the reason, then show the record.
  await logAudit({
    action: "safeguarding.view",
    entityType: "SafeguardingConcern",
    entityId: concern.id,
    reason: VIEW_REASONS[reason],
    summary: "A safeguarding record was opened",
  });

  const description = decryptForDisplay(concern.description, HEALTH_CONTEXT.concernDescription);
  const outcome = decryptForDisplay(concern.outcome, HEALTH_CONTEXT.concernOutcome);
  const timeline = concern.actions.map((a) => ({
    id: a.id,
    actorId: a.actorId,
    createdAt: a.createdAt,
    note: decryptForDisplay(a.note, HEALTH_CONTEXT.concernNote),
  }));

  const userIds = [...new Set([concern.reportedById, concern.assignedToId, ...timeline.map((t) => t.actorId)].filter((id): id is string => !!id))];
  const [people, leads] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { role: "SAFEGUARDING_LEAD" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const nameOf = (id: string | null) => (id ? people.find((p) => p.id === id)?.name ?? "Unknown" : "—");

  const child = concern.player;
  const childName = child ? child.name?.trim() || child.user?.name || "Unnamed player" : null;

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/admin/safeguarding" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; Safeguarding</Link>
      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", margin: "12px 0 4px" }}>{ref}</h1>
      <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 12 }}>
        {STATUS_LABELS[concern.status]} &middot; {CATEGORY_LABELS[concern.category]} &middot; raised {formatDate(concern.createdAt)} by {nameOf(concern.reportedById)} &middot; assigned to {nameOf(concern.assignedToId)}
      </p>
      <p style={{ fontSize: "0.8rem", opacity: 0.65, marginBottom: 16 }}>
        Opened for: {VIEW_REASONS[reason]}. This view has been logged. {EMERGENCY_NOTICE}
      </p>

      {search.saved === "1" && (
        <div role="status" style={{ background: "#e7f3ed", border: "1px solid var(--pitch)", color: "var(--pitch)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
          Saved.
        </div>
      )}
      {search.error && ERRORS[search.error] && (
        <div role="alert" style={{ background: "#fdecec", border: "1px solid var(--card-red)", color: "var(--card-red)", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: "0.9rem" }}>
          {ERRORS[search.error]}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={headingStyle}>CHILD</h2>
        {child ? (
          <>
            <p style={{ fontSize: "0.9rem" }}>{childName} &middot; {child.team?.name ?? "No team"}</p>
            {child.parentGuardian && (
              <p style={{ fontSize: "0.9rem", marginTop: 6 }}>
                Guardian: {child.parentGuardian.firstName} {child.parentGuardian.lastName} ({child.parentGuardian.relationship}) &middot; {child.parentGuardian.phone}
              </p>
            )}
            {child.emergencyContacts.length > 0 && (
              <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: "0.9rem" }}>
                {child.emergencyContacts.map((c) => (
                  <li key={c.id}>{c.name} ({c.relationship}) &middot; {c.phone}</li>
                ))}
              </ul>
            )}
            <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>
              Contact details are shown so you can act. Think carefully before contacting a guardian: if the concern is about them or someone close to the child, contacting them may put the child at risk.
            </p>
          </>
        ) : (
          <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Not about one specific child.</p>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}>WHAT WAS REPORTED</h2>
        <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{description}</p>
      </div>

      {outcome && (
        <div style={cardStyle}>
          <h2 style={headingStyle}>OUTCOME</h2>
          <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{outcome}</p>
          {concern.closedAt && <p style={{ fontSize: "0.8rem", opacity: 0.6, marginTop: 8 }}>Closed {formatDate(concern.closedAt)}</p>}
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={headingStyle}>TIMELINE</h2>
        {timeline.length === 0 ? (
          <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>No updates yet.</p>
        ) : (
          timeline.map((t) => (
            <div key={t.id} style={{ borderTop: "1px solid #f0ede5", padding: "10px 0" }}>
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{formatDate(t.createdAt)} &middot; {nameOf(t.actorId)}</div>
              <p style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{t.note}</p>
            </div>
          ))
        )}
      </div>

      <form action={updateConcern.bind(null, concern.id)} style={cardStyle}>
        <h2 style={headingStyle}>ADD AN UPDATE</h2>
        <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: 0 }}>
          Updates are added to the timeline and cannot be edited or removed.
        </p>
        <input type="hidden" name="reason" value={reason} />

        <label style={labelStyle}>
          Note
          <textarea name="note" rows={4} maxLength={5000} style={{ ...inputStyle, resize: "vertical" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={labelStyle}>
            Status
            <select name="status" defaultValue={concern.status} style={inputStyle}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Assigned to
            <select name="assignedToId" defaultValue={concern.assignedToId ?? ""} style={inputStyle}>
              <option value="">Unassigned</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label style={labelStyle}>
          Outcome (required when closing)
          <textarea name="outcome" rows={3} maxLength={5000} style={{ ...inputStyle, resize: "vertical" }} />
        </label>

        <button type="submit" className="button" style={{ marginTop: 16 }}>Save update</button>
      </form>
    </div>
  );
}
