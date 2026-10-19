import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { playerName } from "@/lib/playerDisplay";
import { PlayerLoginPanel } from "@/components/PlayerLoginPanel";
import { createPlayerLogin, resetPlayerLoginPassword } from "./actions";

export default async function PlayerLoginPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await requireAdmin();

  const player = await prisma.player.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!player) return notFound();

  const age = player.dateOfBirth
    ? Math.floor((Date.now() - player.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="form-page">
      <Link href="/admin/players" style={{ fontSize: "0.9rem", opacity: 0.7 }}>&larr; All players</Link>

      <h1 className="display" style={{ fontSize: "2.2rem", color: "var(--pitch)", marginTop: 12, marginBottom: 4 }}>
        PORTAL LOGIN
      </h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: 24 }}>For {playerName(player)}</p>

      <PlayerLoginPanel
        playerName={playerName(player)}
        hasLogin={Boolean(player.user)}
        loginEmail={player.user?.email ?? null}
        youngPlayer={age != null && age < 13}
        createAction={createPlayerLogin.bind(null, player.id)}
        resetAction={resetPlayerLoginPassword.bind(null, player.id)}
      />
    </div>
  );
}