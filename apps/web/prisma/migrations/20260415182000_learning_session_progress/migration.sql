-- AlterTable
ALTER TABLE "LearningSession"
ADD COLUMN "understandingScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "understandingSummary" TEXT;
