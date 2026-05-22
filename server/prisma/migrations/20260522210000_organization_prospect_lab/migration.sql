-- ProspectLab (prospection externe) sur Organization
ALTER TABLE "Organization" ADD COLUMN "prospectLabApiUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "prospectLabApiKey" TEXT;
