-- AlterTable
ALTER TABLE "Client" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Client_archivedAt_idx" ON "Client"("archivedAt");
CREATE INDEX "Client_organizationId_archivedAt_createdAt_idx" ON "Client"("organizationId", "archivedAt", "createdAt");
