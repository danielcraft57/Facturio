-- Statut client pour catégories (actifs, inactifs, prospects)
ALTER TABLE "Client" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_isCompany_idx" ON "Client"("isCompany");
