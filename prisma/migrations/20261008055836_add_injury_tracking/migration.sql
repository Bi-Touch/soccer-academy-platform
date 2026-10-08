-- CreateEnum
CREATE TYPE "InjuryStatus" AS ENUM ('ACTIVE', 'RECOVERED');

-- CreateTable
CREATE TABLE "InjuryRecord" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "injuryType" TEXT NOT NULL,
    "description" TEXT,
    "dateOccurred" TIMESTAMP(3) NOT NULL,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "status" "InjuryStatus" NOT NULL DEFAULT 'ACTIVE',
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InjuryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InjuryRecord_playerId_status_idx" ON "InjuryRecord"("playerId", "status");

-- AddForeignKey
ALTER TABLE "InjuryRecord" ADD CONSTRAINT "InjuryRecord_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
