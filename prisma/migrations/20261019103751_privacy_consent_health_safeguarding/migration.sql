-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PHOTOGRAPHY', 'VIDEO', 'PUBLIC_MEDIA', 'SCOUTING_LOCAL', 'AGENTS_LOCAL', 'SCOUTING_OVERSEAS_ACADEMIES', 'SCOUTING_OVERSEAS_CLUBS', 'SCOUTING_OVERSEAS_SCOUTS', 'SCOUTING_OVERSEAS_AGENTS', 'HEALTH_DATA', 'MARKETING_COMMUNICATIONS');

-- CreateEnum
CREATE TYPE "ConsentGivenBy" AS ENUM ('GUARDIAN', 'PLAYER');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('REGISTRATION', 'PARENT_DASHBOARD', 'PLAYER_AT_18', 'ADMIN_ON_BEHALF');

-- CreateEnum
CREATE TYPE "ConcernCategory" AS ENUM ('PHYSICAL', 'EMOTIONAL', 'SEXUAL', 'NEGLECT', 'ONLINE', 'BULLYING', 'CONDUCT_BY_STAFF', 'OTHER');

-- CreateEnum
CREATE TYPE "ConcernStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'REFERRED_EXTERNAL', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClearanceType" AS ENUM ('CERTIFICATE_OF_GOOD_CONDUCT', 'SAFEGUARDING_TRAINING', 'FIRST_AID', 'COACHING_LICENCE', 'CODE_OF_CONDUCT_SIGNED');

-- CreateEnum
CREATE TYPE "DataRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'DELETION', 'RESTRICTION', 'OBJECTION', 'WITHDRAW_CONSENT');

-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REFUSED');

-- CreateEnum
CREATE TYPE "BreachStatus" AS ENUM ('OPEN', 'CONTAINED', 'REPORTED', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SAFEGUARDING_LEAD';
ALTER TYPE "Role" ADD VALUE 'MEDICAL_OFFICER';

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "playerId" TEXT,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "ConsentRecord" ADD COLUMN     "emergencyTreatmentAuthorised" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "healthData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "localAgents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketingCommunications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overseasAgents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overseasScouts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "policyVersion" TEXT,
ALTER COLUMN "scouts" SET DEFAULT false,
ALTER COLUMN "agents" SET DEFAULT false;

-- AlterTable
ALTER TABLE "GalleryPhoto" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "InjuryRecord" ADD COLUMN     "treatment" TEXT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlayerConsent" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "givenById" TEXT NOT NULL,
    "givenByRole" "ConsentGivenBy" NOT NULL,
    "source" "ConsentSource" NOT NULL,
    "formVersion" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "consentRecordId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CookieConsentLog" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "analytics" BOOLEAN NOT NULL,
    "marketing" BOOLEAN NOT NULL,
    "externalMedia" BOOLEAN NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "clientTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHealthProfile" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "allergies" TEXT,
    "conditions" TEXT,
    "medications" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "insuranceInfo" TEXT,
    "emergencyTreatmentAuthorised" BOOLEAN NOT NULL DEFAULT false,
    "authorisedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PlayerHealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingConcern" (
    "id" TEXT NOT NULL,
    "playerId" TEXT,
    "reportedById" TEXT NOT NULL,
    "category" "ConcernCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConcernStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "SafeguardingConcern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafeguardingAction" (
    "id" TEXT NOT NULL,
    "concernId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafeguardingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffClearance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ClearanceType" NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "documentRef" TEXT,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "type" "DataRequestType" NOT NULL,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "playerId" TEXT,
    "requestedById" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "handledById" TEXT,
    "notes" TEXT,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataBreachIncident" (
    "id" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "dataTypes" TEXT,
    "affectedCount" INTEGER,
    "status" "BreachStatus" NOT NULL DEFAULT 'OPEN',
    "containedAt" TIMESTAMP(3),
    "reportedToOdpcAt" TIMESTAMP(3),
    "familiesNotifiedAt" TIMESTAMP(3),
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataBreachIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GalleryPhotoToPlayer" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "PlayerConsent_playerId_type_createdAt_idx" ON "PlayerConsent"("playerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "CookieConsentLog_visitorId_createdAt_idx" ON "CookieConsentLog"("visitorId", "createdAt");

-- CreateIndex
CREATE INDEX "CookieConsentLog_createdAt_idx" ON "CookieConsentLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerHealthProfile_playerId_key" ON "PlayerHealthProfile"("playerId");

-- CreateIndex
CREATE INDEX "EmergencyContact_playerId_idx" ON "EmergencyContact"("playerId");

-- CreateIndex
CREATE INDEX "SafeguardingConcern_status_createdAt_idx" ON "SafeguardingConcern"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SafeguardingConcern_playerId_idx" ON "SafeguardingConcern"("playerId");

-- CreateIndex
CREATE INDEX "SafeguardingAction_concernId_createdAt_idx" ON "SafeguardingAction"("concernId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffClearance_userId_type_idx" ON "StaffClearance"("userId", "type");

-- CreateIndex
CREATE INDEX "StaffClearance_expiresAt_idx" ON "StaffClearance"("expiresAt");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_dueAt_idx" ON "DataSubjectRequest"("status", "dueAt");

-- CreateIndex
CREATE INDEX "DataBreachIncident_status_detectedAt_idx" ON "DataBreachIncident"("status", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_GalleryPhotoToPlayer_AB_unique" ON "_GalleryPhotoToPlayer"("A", "B");

-- CreateIndex
CREATE INDEX "_GalleryPhotoToPlayer_B_index" ON "_GalleryPhotoToPlayer"("B");

-- CreateIndex
CREATE INDEX "AuditLog_playerId_createdAt_idx" ON "AuditLog"("playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "PlayerConsent" ADD CONSTRAINT "PlayerConsent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHealthProfile" ADD CONSTRAINT "PlayerHealthProfile_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingConcern" ADD CONSTRAINT "SafeguardingConcern_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafeguardingAction" ADD CONSTRAINT "SafeguardingAction_concernId_fkey" FOREIGN KEY ("concernId") REFERENCES "SafeguardingConcern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffClearance" ADD CONSTRAINT "StaffClearance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GalleryPhotoToPlayer" ADD CONSTRAINT "_GalleryPhotoToPlayer_A_fkey" FOREIGN KEY ("A") REFERENCES "GalleryPhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GalleryPhotoToPlayer" ADD CONSTRAINT "_GalleryPhotoToPlayer_B_fkey" FOREIGN KEY ("B") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
