/*
  Warnings:

  - A unique constraint covering the columns `[testId,testCode]` on the table `PhysicalTestResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARENT';

-- AlterTable
ALTER TABLE "PhysicalTest" ADD COLUMN     "ageGroup" TEXT;

-- AlterTable
ALTER TABLE "PhysicalTestResult" ADD COLUMN     "benchmarkVersion" TEXT,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "testCode" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "name" TEXT,
ADD COLUMN     "parentGuardianId" TEXT,
ADD COLUMN     "sex" "Sex",
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ParentGuardian" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "idNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerRegistration" (
    "id" TEXT NOT NULL,
    "parentGuardianId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "nationality" TEXT,
    "position" TEXT,
    "preferredFoot" TEXT,
    "previousClub" TEXT,
    "previousAcademy" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "medicalNotes" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdPlayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "dataProcessing" BOOLEAN NOT NULL,
    "statistics" BOOLEAN NOT NULL,
    "photography" BOOLEAN NOT NULL,
    "videoRecording" BOOLEAN NOT NULL,
    "publicMedia" BOOLEAN NOT NULL,
    "localScouting" BOOLEAN NOT NULL,
    "overseasAcademies" BOOLEAN NOT NULL,
    "overseasClubs" BOOLEAN NOT NULL,
    "scouts" BOOLEAN NOT NULL,
    "agents" BOOLEAN NOT NULL,
    "guardianDeclaration" BOOLEAN NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkConfig" (
    "id" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "version" TEXT NOT NULL,
    "minBenchmark" DOUBLE PRECISION NOT NULL,
    "maxBenchmark" DOUBLE PRECISION NOT NULL,
    "lowerIsBetter" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentGuardian_userId_key" ON "ParentGuardian"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerRegistration_createdPlayerId_key" ON "PlayerRegistration"("createdPlayerId");

-- CreateIndex
CREATE INDEX "PlayerRegistration_status_idx" ON "PlayerRegistration"("status");

-- CreateIndex
CREATE INDEX "PlayerRegistration_parentGuardianId_idx" ON "PlayerRegistration"("parentGuardianId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_registrationId_key" ON "ConsentRecord"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkConfig_testCode_ageGroup_sex_version_key" ON "BenchmarkConfig"("testCode", "ageGroup", "sex", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalTestResult_testId_testCode_key" ON "PhysicalTestResult"("testId", "testCode");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_parentGuardianId_fkey" FOREIGN KEY ("parentGuardianId") REFERENCES "ParentGuardian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentGuardian" ADD CONSTRAINT "ParentGuardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerRegistration" ADD CONSTRAINT "PlayerRegistration_parentGuardianId_fkey" FOREIGN KEY ("parentGuardianId") REFERENCES "ParentGuardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "PlayerRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
