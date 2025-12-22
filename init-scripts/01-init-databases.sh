#!/bin/bash
set -e

# This script creates all databases and enables pgvector extension
# It runs automatically when the postgres container starts for the first time

echo "Creating databases and enabling pgvector extension..."

# Function to create database and enable pgvector
create_db_with_pgvector() {
    DB_NAME=$1
    echo "Creating database: $DB_NAME"
    
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        -- Create database if it doesn't exist
        SELECT 'CREATE DATABASE $DB_NAME'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
        
        -- Connect to the database and enable pgvector
        \c $DB_NAME
        CREATE EXTENSION IF NOT EXISTS vector;
        
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $POSTGRES_USER;
EOSQL
    
    echo "✅ Database $DB_NAME created with pgvector extension enabled"
}

# Create all service databases
create_db_with_pgvector "muse-auth"
create_db_with_pgvector "muse_notes"
create_db_with_pgvector "muse_social"
create_db_with_pgvector "muse_ai"
create_db_with_pgvector "muse_labs"
create_db_with_pgvector "muse_academic"

echo "✅ All databases created successfully with pgvector extension!"
