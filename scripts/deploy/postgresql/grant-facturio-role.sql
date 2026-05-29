-- Droits + propriété pour le rôle applicatif (après migrations éventuellement passées en postgres)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO facturio;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO facturio;
GRANT USAGE ON SCHEMA public TO facturio;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO facturio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO facturio;

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
