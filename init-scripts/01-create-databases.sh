#!/bin/bash
set -e

echo "Creating databases..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE "muse-auth";
    CREATE DATABASE "muse_notes";
    CREATE DATABASE "muse_feed";
    CREATE DATABASE "muse_parental";
    CREATE DATABASE "muse_journal";
    CREATE DATABASE "muse_chat";
    CREATE DATABASE "muse_academic";
    CREATE DATABASE "muse_calendar";
    CREATE DATABASE "muse_assignment";
    CREATE DATABASE "muse_classroom";
    CREATE DATABASE "muse_labs";
    CREATE DATABASE "muse_ai";
    CREATE DATABASE "muse_social";
    CREATE DATABASE "keycloak";
EOSQL


# Enable pgvector extension for databases that need it
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "muse_notes" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "muse_feed" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "muse_ai" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL

echo "Databases created successfully."

