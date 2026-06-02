-- Aligne Organization.saasPlan sur l'enum Prisma (bases créées en TEXT via incremental_prod_sync).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SaasBillingPlan') THEN
    CREATE TYPE "SaasBillingPlan" AS ENUM ('FREE', 'PRO', 'PRO_EFACTURE', 'AGENCY');
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Organization'
      AND column_name = 'saasPlan'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "Organization" ALTER COLUMN "saasPlan" DROP DEFAULT;
    ALTER TABLE "Organization"
      ALTER COLUMN "saasPlan" TYPE "SaasBillingPlan"
      USING ("saasPlan"::"SaasBillingPlan");
    ALTER TABLE "Organization"
      ALTER COLUMN "saasPlan" SET DEFAULT 'FREE'::"SaasBillingPlan";
  END IF;
END
$$;
