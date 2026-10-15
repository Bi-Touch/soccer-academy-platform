
import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  getAccessibleTeamIds,
} from "@/lib/permissions";

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day));

  return start;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone:
    | "players"
    | "sessions"
    | "attendance"
    | "injuries"
    | "registrations";
  href: string;
};

export async function getAdminDashboardData() {
  const user = await getSessionUser();

  const accessibleTeamIds = user
    ? await getAccessibleTeamIds(user)
    : null;

  const teamFilter = accessibleTeamIds
    ? { teamId: { in: accessibleTeamIds } }
    : {};

  const playerFilter = accessibleTeamIds
    ? { teamId: { in: accessibleTeamIds } }
    : {};

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const accessiblePlayerIds = accessibleTeamIds
    ? (
        await prisma.player.findMany({
          where: playerFilter,
          select: { id: true },
        })
      ).map((player) => player.id)
    : null;

  const [
    playerCount,
    sessionsThisWeek,
    activeInjuries,
    pendingRegistrations,
    upcomingSessions,
    recentMatches,
    unloggedSessions,
    attendanceRecords,
  ] = await Promise.all([
    prisma.player.count({
      where: playerFilter,
    }),

    prisma.scheduleEvent.count({
      where: {
        ...teamFilter,
        type: { in: ["TRAINING", "DRILL"] },
        startsAt: { gte: weekStart, lt: weekEnd },
      },
    }),

    prisma.injuryRecord.count({
      where: {
        status: "ACTIVE",
        player: { is: playerFilter },
      },
    }),

    prisma.playerRegistration.count({
      where: {
        status: { in: ["PENDING", "UNDER_REVIEW"] },
        ...(accessiblePlayerIds
          ? {
              createdPlayerId: {
                in: accessiblePlayerIds,
              },
            }
          : {}),
      },
    }),

    prisma.scheduleEvent.findMany({
      where: {
        ...teamFilter,
        startsAt: { gte: now },
      },
      include: { team: true },
      orderBy: { startsAt: "asc" },
      take: 5,
    }),

    prisma.scheduleEvent.findMany({
      where: {
        ...teamFilter,
        type: "MATCH",
        startsAt: { lt: now },
      },
      include: { team: true },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),

    prisma.scheduleEvent.findMany({
      where: {
        ...teamFilter,
        type: { in: ["TRAINING", "DRILL"] },
        startsAt: { lt: now },
        attendance: { none: {} },
      },
      include: { team: true },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),

    prisma.trainingAttendance.findMany({
      where: {
        event: {
          ...teamFilter,
          startsAt: { lt: now },
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  const attendedCount = attendanceRecords.filter(
    (record) =>
      record.status === "PRESENT" || record.status === "LATE"
  ).length;

  const attendanceRate = attendanceRecords.length
    ? Math.round(
        (attendedCount / attendanceRecords.length) * 100
      )
    : null;

  const metrics: DashboardMetric[] = [
    {
      label: "Total Players",
      value: playerCount.toLocaleString(),
      detail: "Registered academy players",
      tone: "players",
      href: "/admin/players",
    },
    {
      label: "Sessions This Week",
      value: sessionsThisWeek.toLocaleString(),
      detail: "Training sessions and drills",
      tone: "sessions",
      href: "/admin/schedule",
    },
    {
      label: "Attendance Rate",
      value:
        attendanceRate === null
          ? "—"
          : `${attendanceRate}%`,
      detail:
        attendanceRate === null
          ? "No attendance recorded yet"
          : "Historical recorded attendance",
      tone: "attendance",
      href: "/admin/training",
    },
    {
      label: "Open Injuries",
      value: activeInjuries.toLocaleString(),
      detail: "Players with active injury records",
      tone: "injuries",
      href: "/admin/players",
    },
    {
      label: "Pending Registrations",
      value: pendingRegistrations.toLocaleString(),
      detail: "Awaiting review",
      tone: "registrations",
      href: "/admin/registrations",
    },
  ];

  return {
    metrics,
    upcomingSessions,
    recentMatches,
    unloggedSessions,
  };
}