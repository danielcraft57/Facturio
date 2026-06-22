-- Initialisation base PrestaFacture (à exécuter une fois en tant que postgres)
-- sudo -u postgres psql -f init-facturio.sql

\set ON_ERROR_STOP on

CREATE USER facturio WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
CREATE DATABASE facturio OWNER facturio ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8' TEMPLATE template0;

\c facturio

ALTER DATABASE facturio SET timezone TO 'UTC';
ALTER DATABASE facturio SET statement_timeout TO '60s';
ALTER DATABASE facturio SET idle_in_transaction_session_timeout TO '120s';

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

GRANT ALL ON SCHEMA public TO facturio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO facturio;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO facturio;
