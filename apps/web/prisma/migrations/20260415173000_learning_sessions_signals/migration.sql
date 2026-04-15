-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "declaredDifficulty" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSignal" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subject" TEXT NOT NULL,
    "topic" TEXT,
    "painPoint" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT,
    "planHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningSession_ownerUserId_status_idx" ON "LearningSession"("ownerUserId", "status");

-- CreateIndex
CREATE INDEX "LearningSignal_ownerUserId_createdAt_idx" ON "LearningSignal"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningSignal_sessionId_idx" ON "LearningSignal"("sessionId");

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSignal" ADD CONSTRAINT "LearningSignal_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSignal" ADD CONSTRAINT "LearningSignal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
