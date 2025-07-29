-- Initialize Advanced Document Management System Database
-- Inicializar Base de Dados do Sistema de Gestão Documental Avançado

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS workflows;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default search path
ALTER DATABASE adms_dev SET search_path TO public, auth, documents, workflows, analytics;

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'adms_auth_service') THEN
        CREATE ROLE adms_auth_service WITH LOGIN PASSWORD 'auth_service_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'adms_document_service') THEN
        CREATE ROLE adms_document_service WITH LOGIN PASSWORD 'document_service_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'adms_readonly') THEN
        CREATE ROLE adms_readonly WITH LOGIN PASSWORD 'readonly_password';
    END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO adms_auth_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO adms_auth_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO adms_auth_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO adms_auth_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO adms_auth_service;

GRANT USAGE ON SCHEMA documents TO adms_document_service;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA documents TO adms_document_service;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA documents TO adms_document_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA documents GRANT ALL ON TABLES TO adms_document_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA documents GRANT ALL ON SEQUENCES TO adms_document_service;

-- Grant read-only access
GRANT USAGE ON ALL SCHEMAS IN DATABASE adms_dev TO adms_readonly;
GRANT SELECT ON ALL TABLES IN DATABASE adms_dev TO adms_readonly;
ALTER DEFAULT PRIVILEGES GRANT SELECT ON TABLES TO adms_readonly;

-- Create audit function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            new_values,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(NEW),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            old_values,
            new_values,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            table_name,
            operation,
            old_values,
            user_id,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            row_to_json(OLD),
            current_setting('app.current_user_id', true),
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(255) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);

-- Log successful initialization
INSERT INTO audit_logs (table_name, operation, new_values, timestamp)
VALUES ('system', 'INIT', '{"message": "Database initialized successfully", "version": "1.0.0"}', NOW());