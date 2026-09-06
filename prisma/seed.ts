import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("changeme123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@academy.local" },
    update: {},
    create: {
      email: "admin@academy.local",
      name: "Academy Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  const team = await prisma.team.create({
    data: {
      name: "U15 Eagles",
      ageGroup: "U15",
    },
  });

  console.log({ admin: admin.email, team: team.name });
  console.log("Seed complete. Login with admin@academy.local / changeme123 — change this password immediately.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
