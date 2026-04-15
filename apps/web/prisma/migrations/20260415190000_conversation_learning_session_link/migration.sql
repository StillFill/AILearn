-- AlterTable
ALTER TABLE "Conversation"
ADD COLUMN "learningSessionId" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_learningSessionId_idx" ON "Conversation"("learningSessionId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
