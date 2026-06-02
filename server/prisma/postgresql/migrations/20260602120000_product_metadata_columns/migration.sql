-- Colonnes catalogue produit (présentes en SQLite via migrations dev, absentes de l'historique PostgreSQL prod).
-- Corrige les 500 sur GET/POST /api/products après déploiement sans migrate:prod complet.

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purpose" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "estimatedHours" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "visualType" TEXT DEFAULT 'icon';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "iconName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageData" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "languages" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "details" JSONB;

-- Anciennes bases : languages/details parfois créés en TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'languages'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "Product"
      ALTER COLUMN "languages" TYPE JSONB
      USING (
        CASE
          WHEN "languages" IS NULL OR btrim("languages"::text) = '' THEN NULL
          WHEN left(btrim("languages"::text), 1) IN ('[', '{') THEN "languages"::text::jsonb
          ELSE to_jsonb(string_to_array("languages"::text, ','))
        END
      );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'details'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE "Product"
      ALTER COLUMN "details" TYPE JSONB
      USING (
        CASE
          WHEN "details" IS NULL OR btrim("details"::text) = '' THEN NULL
          WHEN left(btrim("details"::text), 1) IN ('[', '{') THEN "details"::text::jsonb
          ELSE to_jsonb(string_to_array("details"::text, E'\n'))
        END
      );
  END IF;
END
$$;
