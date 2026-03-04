DO $$
DECLARE
  stmt text;
BEGIN
  SELECT
    'TRUNCATE TABLE '
    || string_agg(format('%I.%I', schemaname, tablename), ', ')
    || ' RESTART IDENTITY CASCADE;'
  INTO stmt
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename <> '_prisma_migrations';

  IF stmt IS NULL THEN
    RAISE NOTICE 'Aucune table à purger dans le schéma public.';
    RETURN;
  END IF;

  EXECUTE stmt;
END $$;

