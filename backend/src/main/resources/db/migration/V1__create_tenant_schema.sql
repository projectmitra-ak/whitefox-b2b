-- WhiteFox B2B Laundry Management - Tenant Schema
-- V1__create_tenant_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenant (Organization)
CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL')),
    industry VARCHAR(50) CHECK (industry IN ('HEALTHCARE', 'HOSPITALITY', 'INDUSTRIAL', 'EDUCATION', 'OTHER')),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    phone VARCHAR(30),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(3) DEFAULT 'INR',
    language VARCHAR(10) DEFAULT 'en',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_tenant_code ON tenant(code);
CREATE INDEX idx_tenant_status ON tenant(status);

-- Branch (Physical location of tenant)
CREATE TABLE branch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    branch_type VARCHAR(30) NOT NULL DEFAULT 'HOSPITAL' CHECK (branch_type IN ('HOSPITAL', 'CLINIC', 'HOTEL', 'HOSTEL', 'FACTORY', 'WAREHOUSE', 'LAUNDRY_PLANT', 'OTHER')),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    phone VARCHAR(30),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    operating_hours JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_branch_tenant ON branch(tenant_id);
CREATE INDEX idx_branch_status ON branch(status);
CREATE INDEX idx_branch_type ON branch(branch_type);

-- Department (Within branch)
CREATE TABLE department (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_type VARCHAR(30) CHECK (department_type IN ('ICU', 'EMERGENCY', 'SURGERY', 'GENERAL_WARD', 'OT', 'RADIOLOGY', 'LABORATORY', 'PHARMACY', 'ADMIN', 'HOUSEKEEPING', 'LAUNDRY', 'KITCHEN', 'FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'OTHER')),
    floor VARCHAR(20),
    wing VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    garment_requirements JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (branch_id, code)
);

CREATE INDEX idx_department_branch ON department(branch_id);
CREATE INDEX idx_department_type ON department(department_type);

-- Contract (Service agreement)
CREATE TABLE contract (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contract_type VARCHAR(30) NOT NULL DEFAULT 'LAUNDRY_SERVICE' CHECK (contract_type IN ('LAUNDRY_SERVICE', 'RENTAL', 'PURCHASE', 'MAINTENANCE', 'FULL_SERVICE')),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWAL_PENDING')),
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    renewal_notice_days INTEGER DEFAULT 30,
    sla_hours INTEGER NOT NULL DEFAULT 24,
    sla_penalty_percent DECIMAL(5,2) DEFAULT 0,
    pricing_model VARCHAR(30) NOT NULL DEFAULT 'PER_WASH' CHECK (pricing_model IN ('PER_WASH', 'PER_GARMENT_MONTH', 'PER_EMPLOYEE_MONTH', 'FLAT_RATE', 'TIERED')),
    base_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY')),
    payment_terms_days INTEGER DEFAULT 30,
    included_services JSONB DEFAULT '[]',
    excluded_services JSONB DEFAULT '[]',
    terms_and_conditions TEXT,
    signed_at TIMESTAMPTZ,
    signed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_contract_tenant ON contract(tenant_id);
CREATE INDEX idx_contract_status ON contract(status);
CREATE INDEX idx_contract_dates ON contract(start_date, end_date);

-- Contract Pricing Tiers (for tiered pricing)
CREATE TABLE contract_pricing_tier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    min_quantity INTEGER NOT NULL,
    max_quantity INTEGER,
    price_per_unit DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(20) NOT NULL DEFAULT 'PER_WASH' CHECK (unit_type IN ('PER_WASH', 'PER_GARMENT', 'PER_KG')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_pricing_tier_contract ON contract_pricing_tier(contract_id);

-- User / App User
CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(30),
    avatar_url VARCHAR(500),
    role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE' CHECK (role IN ('WHITEFOX_ADMIN', 'TENANT_ADMIN', 'PLANT_MANAGER', 'PLANT_OPERATOR', 'DRIVER', 'EMPLOYEE', 'SUPERVISOR', 'AUDITOR')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING_VERIFICATION')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_user_tenant ON app_user(tenant_id);
CREATE INDEX idx_user_email ON app_user(email);
CREATE INDEX idx_user_role ON app_user(role);
CREATE INDEX idx_user_status ON app_user(status);

-- User Branch Access (Many-to-Many)
CREATE TABLE user_branch_access (
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    access_level VARCHAR(20) NOT NULL DEFAULT 'READ' CHECK (access_level IN ('READ', 'WRITE', 'ADMIN')),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID,
    PRIMARY KEY (user_id, branch_id)
);

-- Audit Log (for all modules)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_correlation ON audit_log(correlation_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenant_updated_at BEFORE UPDATE ON tenant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branch_updated_at BEFORE UPDATE ON branch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_department_updated_at BEFORE UPDATE ON department FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_updated_at BEFORE UPDATE ON contract FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_user_updated_at BEFORE UPDATE ON app_user FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- System tenant for platform-level operations
INSERT INTO tenant (id, code, name, status, industry, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'WHITEFOX', 'WhiteFox Platform', 'ACTIVE', 'OTHER', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Default WhiteFox admin user (password: admin123 - should be changed in production)
INSERT INTO app_user (id, tenant_id, email, username, password_hash, first_name, last_name, role, status, email_verified, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'admin@whitefox.com', 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'System', 'Administrator', 'WHITEFOX_ADMIN', 'ACTIVE', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;