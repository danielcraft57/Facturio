-- CreateTable
CREATE TABLE "ApiAccessToken" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiAccessToken_tokenHash_key" ON "ApiAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ApiAccessToken_organizationId_idx" ON "ApiAccessToken"("organizationId");

-- AddForeignKey
ALTER TABLE "ApiAccessToken" ADD CONSTRAINT "ApiAccessToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
