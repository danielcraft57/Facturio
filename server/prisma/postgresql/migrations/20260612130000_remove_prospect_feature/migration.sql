-- Suppression du module prospects / ProspectLab
DROP TABLE IF EXISTS "Prospect";

ALTER TABLE "Organization" DROP COLUMN IF EXISTS "prospectLabApiUrl";
ALTER TABLE "Organization" DROP COLUMN IF EXISTS "prospectLabApiKey";

DROP TYPE IF EXISTS "ProspectStatus";
DROP TYPE IF EXISTS "CompanySize";
DROP TYPE IF EXISTS "BudgetRange";
DROP TYPE IF EXISTS "Priority";
DROP TYPE IF EXISTS "SourceType";
