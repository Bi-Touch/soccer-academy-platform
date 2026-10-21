import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { playerName } from "@/lib/playerDisplay";
import { getConsentReviewStatuses } from "@/lib/consentReview";

/**
 * Shown at the top of every parent portal page while any of the parent's children
 * need their consent choices set up or reconfirmed. Renders nothing otherwise.
 * Server component: it reads the live state on each render.
 */
export async function ConsentReviewBanner({ guardianId }: { guardianId: string }) {
  const children = await prisma.player.findMany({ where: { parentGuardianId: guardianId } });
  const statuses = await getConsentReviewStatuses(children.map((child) => child.id));
  const pending = children.filter((child) => statuses.get(child.id)?.needsReview);

  if (pending.length === 0) return null;

  return (
    <div
      role="status"
      style={{
        background: "#fdf3e2",
        border: "1px solid var(--floodlight)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        fontSize: "0.9rem",
      }}
    >
      <strong style={{ color: "var(--pitch)" }}>Please review your consent choices</strong>
      <p style={{ margin: "6px 0 8px", opacity: 0.85 }}>
        It only takes a minute. Until you do, the Academy will not use or share your child&apos;s information
        beyond what is needed to run training safely.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {pending.map((child) => {
          const status = statuses.get(child.id);
          return (
            <li key={child.id} style={{ margin: "4px 0" }}>
              <Link
                href={`/portal/parent/${child.id}/consent`}
                style={{ color: "var(--pitch)", fontWeight: 600, textDecoration: "underline" }}
              >
                {playerName(child)}
              </Link>
              {status?.reasons[0] ? <span style={{ opacity: 0.75 }}> — {status.reasons[0]}</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
