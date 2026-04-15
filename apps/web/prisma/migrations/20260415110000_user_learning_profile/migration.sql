-- AlterTable
ALTER TABLE "User"
ADD COLUMN "affinitySubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "difficultySubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "learningGoal" TEXT;

-- Backfill defaults for existing rows
UPDATE "User"
SET "affinitySubjects" = COALESCE("affinitySubjects", ARRAY[]::TEXT[]),
    "difficultySubjects" = COALESCE("difficultySubjects", ARRAY[]::TEXT[]);

-- Enforce not-null arrays after backfill
ALTER TABLE "User"
ALTER COLUMN "affinitySubjects" SET NOT NULL,
ALTER COLUMN "difficultySubjects" SET NOT NULL;
