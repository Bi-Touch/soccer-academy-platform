import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Uses Prisma's own Role type so new roles in schema.prisma can never drift
// out of sync with this file again.
export type SessionUser = { id: string; role: Role };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // The JWT can outlive the account. Re-read the role from the database so a
  // removed or re-roled user loses access immediately, not after the token expires.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return null;

  return { id: dbUser.id, role: dbUser.role };
}

/**
 * Write access: admins and coaches only. Analysts are deliberately excluded.
 * SAFEGUARDING_LEAD and MEDICAL_OFFICER are also excluded: they only get the
 * specific access granted by the functions further down.
 */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "COACH")) {
    throw new Error("Not authorized.");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Not authorized.");
  }
  return user;
}

/** Read-only access to the analytics dashboard. */
export async function requireViewer(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "COACH" && user.role !== "ANALYST")) {
    throw new Error("Not authorized.");
  }
  return user;
}

/**
 * Returns the team IDs a user may see.
 * ADMIN / ANALYST => null (no restriction, all teams).
 * COACH => array of team IDs they coach (possibly empty).
 * Every other role => empty array (default deny).
 */
export async function getAccessibleTeamIds(user: SessionUser): Promise<string[] | null> {
  if (user.role === "ADMIN" || user.role === "ANALYST") return null;
  if (user.role !== "COACH") return [];

  const coach = await prisma.coach.findUnique({
    where: { userId: user.id },
    include: { teams: true },
  });
  return coach ? coach.teams.map((t) => t.id) : [];
}

/** Throws if a COACH tries to act on a team they don't coach. No-op for ADMIN. */
export function assertTeamAccess(accessibleTeamIds: string[] | null, teamId: string | null) {
  if (accessibleTeamIds === null) return; // admin
  if (!teamId || !accessibleTeamIds.includes(teamId)) {
    throw new Error("You don't have access to that team.");
  }
}

// ─────────────────────────────────────────────────────────────
// Health records
// ─────────────────────────────────────────────────────────────

export type HealthAccessLevel = "full" | "summary";

/**
 * Who may read a player's health information:
 * - ADMIN, MEDICAL_OFFICER: full profile and injury history.
 * - COACH of the player's team: "summary" only (allergies, emergency treatment
 *   authorisation, emergency contacts). Never conditions, medication or notes.
 * - PARENT of the player: use requireGuardianOfPlayer instead.
 * Everyone else (ANALYST, SAFEGUARDING_LEAD, other coaches) is denied.
 *
 * Callers must return only the fields allowed for the returned level, and should
 * write an audit entry for the read (action e.g. "health.view", with playerId).
 */
export async function requireHealthAccess(
  playerId: string
): Promise<{ user: SessionUser; level: HealthAccessLevel }> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authorized.");

  if (user.role === "ADMIN" || user.role === "MEDICAL_OFFICER") {
    return { user, level: "full" };
  }

  if (user.role === "COACH") {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { teamId: true },
    });
    const teamIds = await getAccessibleTeamIds(user);
    assertTeamAccess(teamIds, player?.teamId ?? null);
    return { user, level: "summary" };
  }

  throw new Error("Not authorized.");
}

/** Creating or editing a player's health profile outside the parent's own dashboard. */
export async function requireHealthWrite(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MEDICAL_OFFICER")) {
    throw new Error("Not authorized.");
  }
  return user;
}

// ─────────────────────────────────────────────────────────────
// Safeguarding
// ─────────────────────────────────────────────────────────────

/**
 * Reading, updating, assigning or closing safeguarding concerns: the Designated
 * Safeguarding Lead (and a named deputy, who is also a SAFEGUARDING_LEAD user).
 * ADMIN is deliberately NOT included, so general administrators cannot browse
 * safeguarding records. Decide on a documented break-glass process for the case
 * where no lead is available, rather than widening this check.
 *
 * Callers should require a stated reason and write an audit entry for every read.
 */
export async function requireSafeguardingLead(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "SAFEGUARDING_LEAD") {
    throw new Error("Not authorized.");
  }
  return user;
}

/**
 * Raising a concern: any adult who works with players. Reporters can create a
 * concern but must not be able to read it back or see its outcome.
 */
export async function requireConcernReporter(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (
    !user ||
    (user.role !== "ADMIN" &&
      user.role !== "COACH" &&
      user.role !== "MEDICAL_OFFICER" &&
      user.role !== "SAFEGUARDING_LEAD")
  ) {
    throw new Error("Not authorized.");
  }
  return user;
}

// ─────────────────────────────────────────────────────────────
// Parents / guardians
// ─────────────────────────────────────────────────────────────

/** IDs of the players linked to this parent login. Empty for any other role. */
export async function getGuardianPlayerIds(user: SessionUser): Promise<string[]> {
  if (user.role !== "PARENT") return [];

  const players = await prisma.player.findMany({
    where: { parentGuardian: { userId: user.id } },
    select: { id: true },
  });
  return players.map((p) => p.id);
}

/**
 * A parent may view and manage consents for, and see the health profile of,
 * only their own children. Use this for the parent dashboard and consent
 * withdrawal, instead of trusting a playerId sent from the browser.
 */
export async function requireGuardianOfPlayer(playerId: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "PARENT") {
    throw new Error("Not authorized.");
  }

  const link = await prisma.player.findFirst({
    where: { id: playerId, parentGuardian: { userId: user.id } },
    select: { id: true },
  });
  if (!link) {
    throw new Error("Not authorized.");
  }
  return user;
}