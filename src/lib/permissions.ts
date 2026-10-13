import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = { id: string; role: "ADMIN" | "COACH" | "ANALYST" | "PARENT" | "PLAYER" };

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

/** Write access: admins and coaches only. Analysts are deliberately excluded. */
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
 */
export async function getAccessibleTeamIds(user: SessionUser): Promise<string[] | null> {
  if (user.role === "ADMIN" || user.role === "ANALYST") return null;
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