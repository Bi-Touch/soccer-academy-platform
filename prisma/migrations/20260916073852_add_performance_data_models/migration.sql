-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT_EXCUSED', 'ABSENT_UNEXCUSED', 'INJURED');

-- CreateEnum
CREATE TYPE "AssessmentDomain" AS ENUM ('TECHNICAL', 'TACTICAL', 'PHYSICAL', 'MENTAL');

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "rating" INTEGER,
    "note" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevelopmentAssessment" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,
    "summary" TEXT,
    "nextGoals" TEXT,

    CONSTRAINT "DevelopmentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScore" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "domain" "AssessmentDomain" NOT NULL,
    "attribute" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "AssessmentScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalTest" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "testedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testedBy" TEXT,

    CONSTRAINT "PhysicalTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalTestResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "PhysicalTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPerformance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTarget" INTEGER NOT NULL DEFAULT 0,
    "passesAttempted" INTEGER NOT NULL DEFAULT 0,
    "passesCompleted" INTEGER NOT NULL DEFAULT 0,
    "keyPasses" INTEGER NOT NULL DEFAULT 0,
    "dribbles" INTEGER NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "recoveries" INTEGER NOT NULL DEFAULT 0,
    "turnovers" INTEGER NOT NULL DEFAULT 0,
    "foulsCommitted" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingAttendance_playerId_idx" ON "TrainingAttendance"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_eventId_playerId_key" ON "TrainingAttendance"("eventId", "playerId");

-- CreateIndex
CREATE INDEX "DevelopmentAssessment_playerId_assessedAt_idx" ON "DevelopmentAssessment"("playerId", "assessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentScore_assessmentId_attribute_key" ON "AssessmentScore"("assessmentId", "attribute");

-- CreateIndex
CREATE INDEX "PhysicalTest_playerId_testedAt_idx" ON "PhysicalTest"("playerId", "testedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalTestResult_testId_metric_key" ON "PhysicalTestResult"("testId", "metric");

-- CreateIndex
CREATE INDEX "MatchPerformance_playerId_idx" ON "MatchPerformance"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPerformance_eventId_playerId_key" ON "MatchPerformance"("eventId", "playerId");

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevelopmentAssessment" ADD CONSTRAINT "DevelopmentAssessment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScore" ADD CONSTRAINT "AssessmentScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "DevelopmentAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalTest" ADD CONSTRAINT "PhysicalTest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalTestResult" ADD CONSTRAINT "PhysicalTestResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "PhysicalTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPerformance" ADD CONSTRAINT "MatchPerformance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ScheduleEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPerformance" ADD CONSTRAINT "MatchPerformance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
