-- WhiteFox B2B Laundry Management - Billing Schema
-- V7__create_billing_schema.sql

-- Invoice
CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contract(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_series VARCHAR(20) DEFAULT 'INV',
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIAL_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED', 'WRITTEN_OFF')),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    -- Amounts
    subtotal DECIMAL(14,2) DEFAULT 0,
    discount_amount DECIMAL(14,2) DEFAULT 0,
    taxable_amount DECIMAL(14,2) DEFAULT 0,
    cgst_amount DECIMAL(14,2) DEFAULT 0,
    sgst_amount DECIMAL(14,2) DEFAULT 0,
    igst_amount DECIMAL(14,2) DEFAULT 0,
    total_tax_amount DECIMAL(14,2) DEFAULT 0,
    total_amount DECIMAL(14,2) DEFAULT 0,
    paid_amount DECIMAL(14,2) DEFAULT 0,
    balance_amount DECIMAL(14,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    -- GST Details
    gstin_supplier VARCHAR(15),
    gstin_customer VARCHAR(15),
    place_of_supply VARCHAR(2),
    hsn_sac_code VARCHAR(8) DEFAULT '9981',
    e_invoice_ack_no VARCHAR(50),
    e_invoice_ack_date TIMESTAMPTZ,
    irn VARCHAR(100),
    qr_code_url VARCHAR(500),
    -- Payment
    payment_terms_days INTEGER DEFAULT 30,
    payment_method VARCHAR(30) CHECK (payment_method IN ('BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CASH', 'ONLINE', 'OTHER')),
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    -- Notes
    notes TEXT,
    terms_and_conditions TEXT,
    -- Approval
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_invoice_tenant ON invoice(tenant_id);
CREATE INDEX idx_invoice_contract ON invoice(contract_id);
CREATE INDEX idx_invoice_status ON invoice(status);
CREATE INDEX idx_invoice_dates ON invoice(invoice_date DESC);
CREATE INDEX idx_invoice_due ON invoice(due_date) WHERE status IN ('SENT', 'PARTIAL_PAID', 'OVERDUE');
CREATE INDEX idx_invoice_number ON invoice(invoice_number);

-- Invoice Line Items
CREATE TABLE invoice_line_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('LAUNDRY_SERVICE', 'GARMENT_RENTAL', 'GARMENT_PURCHASE', 'REPAIR_SERVICE', 'REPLACEMENT', 'PICKUP_DELIVERY', 'STORAGE', 'ADMIN_FEE', 'PENALTY', 'DISCOUNT', 'OTHER')),
    description TEXT NOT NULL,
    hsn_sac_code VARCHAR(8) DEFAULT '9981',
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_of_measure VARCHAR(20) DEFAULT 'PCS' CHECK (unit_of_measure IN ('PCS', 'KG', 'METER', 'HOUR', 'DAY', 'MONTH', 'BATCH', 'TRIP')),
    unit_price DECIMAL(12,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    taxable_amount DECIMAL(14,2) NOT NULL,
    cgst_rate DECIMAL(5,2) DEFAULT 9.00,
    sgst_rate DECIMAL(5,2) DEFAULT 9.00,
    igst_rate DECIMAL(5,2) DEFAULT 0,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    total_tax_amount DECIMAL(12,2) DEFAULT 0,
    line_total DECIMAL(14,2) NOT NULL,
    -- References
    reference_type VARCHAR(50),
    reference_id UUID,
    garment_type_id UUID REFERENCES garment_type(id) ON DELETE SET NULL,
    service_period_start DATE,
    service_period_end DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (invoice_id, line_number)
);

CREATE INDEX idx_ili_invoice ON invoice_line_item(invoice_id);
CREATE INDEX idx_ili_reference ON invoice_line_item(reference_type, reference_id);

-- Billing Rule (Configuration for automated billing)
CREATE TABLE billing_rule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contract(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'PER_WASH', 'PER_GARMENT_MONTH', 'PER_EMPLOYEE_MONTH', 
        'PER_KG', 'PER_PICKUP', 'FLAT_MONTHLY', 'TIERED_VOLUME',
        'MINIMUM_COMMITMENT', 'OVERAGE_RATE'
    )),
    applies_to VARCHAR(30) CHECK (applies_to IN ('ALL', 'GARMENT_TYPE', 'DEPARTMENT', 'EMPLOYEE_GRADE')),
    garment_type_id UUID REFERENCES garment_type(id) ON DELETE SET NULL,
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    condition_expression TEXT,
    rate DECIMAL(12,4) NOT NULL,
    rate_unit VARCHAR(20) CHECK (rate_unit IN ('PER_WASH', 'PER_GARMENT', 'PER_KG', 'PER_MONTH', 'PER_EMPLOYEE', 'PER_PICKUP')),
    minimum_quantity INTEGER,
    maximum_quantity INTEGER,
    tier_config JSONB DEFAULT '[]',
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    priority INTEGER DEFAULT 100,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_rule_tenant ON billing_rule(tenant_id);
CREATE INDEX idx_billing_rule_contract ON billing_rule(contract_id);
CREATE INDEX idx_billing_rule_active ON billing_rule(is_active, effective_from, effective_to);

-- Usage Record (For metering/billing)
CREATE TABLE usage_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contract(id) ON DELETE SET NULL,
    billing_rule_id UUID REFERENCES billing_rule(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('WASH', 'RENTAL', 'PICKUP', 'DELIVERY', 'REPAIR', 'REPLACEMENT', 'STORAGE')),
    garment_type_id UUID REFERENCES garment_type(id) ON DELETE SET NULL,
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    weight_kg DECIMAL(10,3),
    unit_price DECIMAL(12,4),
    total_amount DECIMAL(14,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(100),
    billed BOOLEAN DEFAULT FALSE,
    billed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, record_date, item_type, reference_type, reference_id)
);

CREATE INDEX idx_usage_tenant_date ON usage_record(tenant_id, record_date DESC);
CREATE INDEX idx_usage_contract ON usage_record(contract_id);
CREATE INDEX idx_usage_billed ON usage_record(billed) WHERE billed = FALSE;
CREATE INDEX idx_usage_ref ON usage_record(reference_type, reference_id);

-- Payment
CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(14,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'CASH', 'ONLINE', 'OTHER')),
    payment_reference VARCHAR(100),
    bank_reference VARCHAR(100),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND')),
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_tenant ON payment(tenant_id);
CREATE INDEX idx_payment_invoice ON payment(invoice_id);
CREATE INDEX idx_payment_date ON payment(payment_date DESC);
CREATE INDEX idx_payment_status ON payment(status);
CREATE INDEX idx_payment_ref ON payment(payment_reference);

-- Credit Note
CREATE TABLE credit_note (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    credit_note_number VARCHAR(50) NOT NULL UNIQUE,
    credit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason VARCHAR(100) CHECK (reason IN ('RETURN', 'DISCOUNT', 'WRONG_BILLING', 'SLA_PENALTY', 'QUALITY_ISSUE', 'CANCELLATION', 'OTHER')),
    total_amount DECIMAL(14,2) NOT NULL,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED')),
    applied_to_invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    applied_amount DECIMAL(14,2) DEFAULT 0,
    notes TEXT,
    issued_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cn_tenant ON credit_note(tenant_id);
CREATE INDEX idx_cn_invoice ON credit_note(invoice_id);
CREATE INDEX idx_cn_status ON credit_note(status);

-- Debit Note
CREATE TABLE debit_note (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    debit_note_number VARCHAR(50) NOT NULL UNIQUE,
    debit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason VARCHAR(100) CHECK (reason IN ('ADDITIONAL_SERVICE', 'RATE_REVISION', 'PENALTY', 'EXTRA_QUANTITY', 'OTHER')),
    total_amount DECIMAL(14,2) NOT NULL,
    cgst_amount DECIMAL(12,2) DEFAULT 0,
    sgst_amount DECIMAL(12,2) DEFAULT 0,
    igst_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')),
    notes TEXT,
    issued_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dn_tenant ON debit_note(tenant_id);
CREATE INDEX idx_dn_invoice ON debit_note(invoice_id);

-- Updated at triggers
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON invoice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_rule_updated_at BEFORE UPDATE ON billing_rule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_note_updated_at BEFORE UPDATE ON credit_note FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_debit_note_updated_at BEFORE UPDATE ON debit_note FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default billing rules (platform level)
INSERT INTO billing_rule (tenant_id, rule_name, rule_type, applies_to, rate, rate_unit, tax_rate, effective_from, description, priority) VALUES
(NULL, 'Standard Wash Rate', 'PER_WASH', 'ALL', 25.0000, 'PER_WASH', 18.00, '2024-01-01', 'Standard per-wash charge for all garment types', 100),
(NULL, 'Garment Rental Monthly', 'PER_GARMENT_MONTH', 'ALL', 150.0000, 'PER_MONTH', 18.00, '2024-01-01', 'Monthly rental per garment', 100),
(NULL, 'Pickup/Delivery Fee', 'PER_PICKUP', 'ALL', 500.0000, 'PER_PICKUP', 18.00, '2024-01-01', 'Fixed fee per pickup/delivery trip', 100),
(NULL, 'Repair Service', 'PER_WASH', 'ALL', 100.0000, 'PER_WASH', 18.00, '2024-01-01', 'Base repair charge', 100),
(NULL, 'Emergency Service Surcharge', 'PER_WASH', 'ALL', 500.0000, 'PER_WASH', 18.00, '2024-01-01', 'Surcharge for emergency/urgent service', 50)
ON CONFLICT DO NOTHING;