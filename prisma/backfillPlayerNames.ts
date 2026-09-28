import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const players = await prisma.player.findMany({
    where: { name: null, userId: { not: null } },
    include: { user: true },
  });

  for (const p of players) {
    if (!p.user) continue;
    await prisma.player.update({ where: { id: p.id }, data: { name: p.user.name } });
  }

  console.log(`Backfilled name on ${players.length} existing player(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });