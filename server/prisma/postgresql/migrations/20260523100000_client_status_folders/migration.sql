CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROSPECT');
ALTER TABLE "Client" ADD COLUMN "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX "Client_status_idx" ON "Client"("status");
CREATE INDEX "Client_isCompany_idx" ON "Client"("isCompany");
