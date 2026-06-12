-- Suppression du module prospects / ProspectLab
DROP TABLE IF EXISTS "Prospect";

ALTER TABLE "Organization" DROP COLUMN "prospectLabApiUrl";
ALTER TABLE "Organization" DROP COLUMN "prospectLabApiKey";
