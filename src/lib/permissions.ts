import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = { id: string; role: "ADMIN" | "COACH" | "PLAYER" };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return { id: session.user.id, role: session.user.role as SessionUser["role"] };
}

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

/**
 * Returns the team IDs a staff member may act on.
 * ADMIN => null (meaning: no restriction, all teams).
 * COACH => array of team IDs they coach (possibly empty).
 */
export async function getAccessibleTeamIds(user: SessionUser): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;
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