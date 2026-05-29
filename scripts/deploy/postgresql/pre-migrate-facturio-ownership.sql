-- À exécuter en tant que postgres AVANT `npm run migrate:prod` (rôle facturio dans DATABASE_URL).
-- Corrige : must be owner of type "EInvoiceStatus" (42501) lors de ALTER TYPE … ADD VALUE.
\set ON_ERROR_STOP on

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, t.typname AS type_name
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  LOOP
    EXECUTE format('ALTER TYPE %I.%I OWNER TO facturio', r.schema_name, r.type_name);
  END LOOP;
END
$$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I OWNER TO facturio', r.schemaname, r.tablename);
  END LOOP;
END
$$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT sequence_schema, sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format(
      'ALTER SEQUENCE %I.%I OWNER TO facturio',
      r.sequence_schema,
      r.sequence_name
    );
  END LOOP;
END
$$;

-- Colonne attendue par Prisma 1.3.5+ (évite 500 login si migrate bloqué en amont)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "documentTagLibrary" JSONB;
