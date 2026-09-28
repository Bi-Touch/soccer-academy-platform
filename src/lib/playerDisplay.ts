export function playerName(player: { name?: string | null; user?: { name: string } | null }): string {
  return player.name ?? player.user?.name ?? "Unnamed player";
}