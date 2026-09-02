-- WhiteFox B2B Laundry Management - Reconciliation Schema
-- V5__create_reconciliation_schema.sql

-- Reconciliation Point Types
CREATE TABLE reconciliation_point_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sequence_order INTEGER NOT NULL,
    expected_source_entity VARCHAR(50) NOT NULL,
    received_source_entity VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO reconciliation_point_type (code, name, description, sequence_order, expected_source_entity, received_source_entity) VALUES
('PICKUP', 'Hospital Pickup', 'Compare hospital expected vs driver scanned at pickup', 1, 'pickup_request', 'pickup_scanned_garment'),
('PLANT_RECEIVE', 'Plant Receive', 'Compare pickup scanned vs plant gate scanned', 2, 'pickup_scanned_garment', 'rfid_event_enriched'),
('DISPATCH', 'Plant Dispatch', 'Compare pack list vs dispatch gate scanned', 3, 'pack_list_garment', 'rfid_event_enriched'),
('DELIVERY', 'Hospital Delivery', 'Compare dispatch scanned vs hospital received', 4, 'delivery_scanned_garment', 'rfid_event_enriched'),
('INVENTORY_AUDIT', 'Periodic Inventory Audit', 'Compare system inventory vs physical RFID inventory scan', 5, 'garment_location', 'rfid_event_enriched')
ON CONFLICT (code) DO NOTHING;

-- Reconciliation Run
CREATE TABLE reconciliation_run (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    point_type_id UUID NOT NULL REFERENCES reconciliation_point_type(id) ON DELETE RESTRICT,
    reference_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    run_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CANCELLED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    expected_count INTEGER DEFAULT 0,
    received_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    missing_count INTEGER DEFAULT 0,
    extra_count INTEGER DEFAULT 0,
    mismatch_count INTEGER DEFAULT 0,
    match_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN expected_count > 0 THEN (matched_count::DECIMAL / expected_count * 100) ELSE 0 END
    ) STORED,
    tolerance_percent DECIMAL(5,2) DEFAULT 0,
    auto_resolve_missing BOOLEAN DEFAULT FALSE,
    triggered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    trigger_type VARCHAR(30) CHECK (trigger_type IN ('MANUAL', 'SCHEDULED', 'EVENT_DRIVEN', 'API')),
    notes TEXT,
    summary JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_run_tenant ON reconciliation_run(tenant_id);
CREATE INDEX idx_recon_run_branch ON reconciliation_run(branch_id);
CREATE INDEX idx_recon_run_point_type ON reconciliation_run(point_type_id);
CREATE INDEX idx_recon_run_reference ON reconciliation_run(reference_type, reference_id);
CREATE INDEX idx_recon_run_status ON reconciliation_run(status);
CREATE INDEX idx_recon_run_dates ON reconciliation_run(started_at DESC);

-- Expected Garments (What should be there)
CREATE TABLE expected_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES reconciliation_run(id) ON DELETE CASCADE,
    garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    epc VARCHAR(100),
    asset_id VARCHAR(50),
    garment_type VARCHAR(50),
    size_code VARCHAR(20),
    color_code VARCHAR(30),
    expected_quantity INTEGER DEFAULT 1,
    expected_location_type VARCHAR(30),
    expected_location_id UUID,
    source_entity VARCHAR(50),
    source_entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expected_run ON expected_garment(run_id);
CREATE INDEX idx_expected_garment ON expected_garment(garment_id);
CREATE INDEX idx_expected_epc ON expected_garment(epc);
CREATE INDEX idx_expected_asset ON expected_garment(asset_id);

-- Received Garments (What was actually detected)
CREATE TABLE received_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES reconciliation_run(id) ON DELETE CASCADE,
    garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    epc VARCHAR(100),
    asset_id VARCHAR(50),
    garment_type VARCHAR(50),
    size_code VARCHAR(20),
    color_code VARCHAR(30),
    received_quantity INTEGER DEFAULT 1,
    received_location_type VARCHAR(30),
    received_location_id UUID,
    rfid_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    scan_timestamp TIMESTAMPTZ,
    signal_strength_dbm DECIMAL(5,2),
    antenna_id INTEGER,
    source_entity VARCHAR(50),
    source_entity_id UUID,
    confidence_score DECIMAL(4,3),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_received_run ON received_garment(run_id);
CREATE INDEX idx_received_garment ON received_garment(garment_id);
CREATE INDEX idx_received_epc ON received_garment(epc);
CREATE INDEX idx_received_asset ON received_garment(asset_id);
CREATE INDEX idx_received_rfid ON received_garment(rfid_event_id);

-- Discrepancy (Mismatch between expected and received)
CREATE TABLE discrepancy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES reconciliation_run(id) ON DELETE CASCADE,
    discrepancy_type VARCHAR(30) NOT NULL CHECK (discrepancy_type IN (
        'MISSING', 'EXTRA', 'WRONG_GARMENT', 'WRONG_QUANTITY', 
        'WRONG_LOCATION', 'DAMAGED', 'CONTAMINATED', 'STATUS_MISMATCH',
        'DUPLICATE_DETECTED', 'GHOST_READ'
    )),
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    expected_garment_id UUID REFERENCES expected_garment(id) ON DELETE SET NULL,
    received_garment_id UUID REFERENCES received_garment(id) ON DELETE SET NULL,
    garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    epc VARCHAR(100),
    asset_id VARCHAR(50),
    expected_quantity INTEGER DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    quantity_variance INTEGER GENERATED ALWAYS AS (received_quantity - expected_quantity) STORED,
    expected_location_type VARCHAR(30),
    expected_location_id UUID,
    received_location_type VARCHAR(30),
    received_location_id UUID,
    description TEXT,
    root_cause VARCHAR(100),
    resolution VARCHAR(30) CHECK (resolution IN (
        'PENDING', 'INVESTIGATING', 'FOUND', 'CONFIRMED_LOST', 'CONFIRMED_DAMAGED',
        'WRONG_TAG', 'SYSTEM_ERROR', 'PROCESS_ERROR', 'THEFT_SUSPECTED',
        'AUTO_RESOLVED', 'MANUALLY_RESOLVED', 'ESCALATED'
    )),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    financial_impact DECIMAL(12,2),
    alert_triggered BOOLEAN DEFAULT FALSE,
    alert_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discrepancy_run ON discrepancy(run_id);
CREATE INDEX idx_discrepancy_type ON discrepancy(discrepancy_type);
CREATE INDEX idx_discrepancy_severity ON discrepancy(severity);
CREATE INDEX idx_discrepancy_garment ON discrepancy(garment_id);
CREATE INDEX idx_discrepancy_epc ON discrepancy(epc);
CREATE INDEX idx_discrepancy_resolution ON discrepancy(resolution);
CREATE INDEX idx_discrepancy_alert ON discrepancy(alert_triggered) WHERE alert_triggered = TRUE;

-- Missing Garment Alert
CREATE TABLE missing_garment_alert (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    discrepancy_id UUID REFERENCES discrepancy(id) ON DELETE SET NULL,
    reconciliation_run_id UUID REFERENCES reconciliation_run(id) ON DELETE SET NULL,
    alert_number VARCHAR(50) NOT NULL UNIQUE,
    alert_level VARCHAR(20) DEFAULT 'WARNING' CHECK (alert_level IN ('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY')),
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'LOCATED', 'CONFIRMED_LOST', 'CONFIRMED_STOLEN', 'REPLACED', 'CLOSED', 'FALSE_ALARM')),
    last_known_location_type VARCHAR(30),
    last_known_location_id UUID,
    last_known_location_name VARCHAR(255),
    last_rfid_scan_at TIMESTAMPTZ,
    last_rfid_gate_id UUID REFERENCES rfid_gate(id) ON DELETE SET NULL,
    days_missing INTEGER DEFAULT 0,
    estimated_value DECIMAL(10,2),
    replacement_initiated BOOLEAN DEFAULT FALSE,
    replacement_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    investigation_notes TEXT,
    investigation_assignments JSONB DEFAULT '[]',
    root_cause VARCHAR(100),
    final_disposition VARCHAR(50) CHECK (final_disposition IN (
        'FOUND_IN_LAUNDRY', 'FOUND_IN_HOSPITAL', 'FOUND_IN_TRANSIT', 
        'CONFIRMED_LOST', 'CONFIRMED_STOLEN', 'CONFIRMED_DAMAGED_BEYOND_REPAIR',
        'MISPLACED_TAG', 'SYSTEM_ERROR', 'REPLACED', 'WRITTEN_OFF'
    )),
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    escalation_level INTEGER DEFAULT 0,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES app_user(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_missing_tenant ON missing_garment_alert(tenant_id);
CREATE INDEX idx_missing_garment ON missing_garment_alert(garment_id);
CREATE INDEX idx_missing_status ON missing_garment_alert(status);
CREATE INDEX idx_missing_level ON missing_garment_alert(alert_level);
CREATE INDEX idx_missing_days ON missing_garment_alert(days_missing DESC);
CREATE INDEX idx_missing_discrepancy ON missing_garment_alert(discrepancy_id);

-- Reconciliation Rule Configuration
CREATE TABLE reconciliation_rule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    point_type_id UUID NOT NULL REFERENCES reconciliation_point_type(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'EXACT_MATCH', 'FUZZY_MATCH', 'QUANTITY_TOLERANCE', 
        'LOCATION_TOLERANCE', 'TIME_WINDOW', 'SEQUENCE_CHECK',
        'GHOST_READ', 'STATUS_MISMATCH'
    )),
    field_name VARCHAR(50),
    operator VARCHAR(20) CHECK (operator IN ('=', '!=', '>', '<', '>=', '<=', 'IN', 'NOT_IN', 'LIKE', 'BETWEEN', 'DUPLICATE')),
    expected_value TEXT,
    tolerance_value TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    action VARCHAR(30) DEFAULT 'FLAG' CHECK (action IN ('FLAG', 'AUTO_RESOLVE', 'ALERT', 'BLOCK', 'ESCALATE')),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, point_type_id, rule_name)
);

CREATE INDEX idx_recon_rule_tenant ON reconciliation_rule(tenant_id);
CREATE INDEX idx_recon_rule_point_type ON reconciliation_rule(point_type_id);

-- Insert default rules
INSERT INTO reconciliation_rule (tenant_id, point_type_id, rule_name, rule_type, field_name, operator, tolerance_value, severity, action, priority, description) VALUES
-- Pickup rules
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='PICKUP'), 'Missing Garment Alert', 'EXACT_MATCH', 'epc', '=', '0', 'HIGH', 'ALERT', 10, 'Flag any EPC expected but not received at pickup'),
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='PICKUP'), 'Extra Garment Alert', 'EXACT_MATCH', 'epc', '!=', '0', 'MEDIUM', 'FLAG', 20, 'Flag any EPC received but not expected at pickup'),
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='PICKUP'), 'Quantity Tolerance', 'QUANTITY_TOLERANCE', 'quantity', 'BETWEEN', '-2,2', 'LOW', 'FLAG', 30, 'Allow +/- 2 quantity variance'),

-- Plant Receive rules
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='PLANT_RECEIVE'), 'Missing at Plant', 'EXACT_MATCH', 'epc', '=', '0', 'CRITICAL', 'ALERT', 10, 'Critical: Garment missing between pickup and plant'),
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='PLANT_RECEIVE'), 'Ghost Read Detection', 'GHOST_READ', 'epc', '=', 'DUPLICATE', 'HIGH', 'ALERT', 20, 'Detect duplicate/ghost RFID reads at plant gate'),

-- Dispatch rules
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='DISPATCH'), 'Pack List vs Dispatch Mismatch', 'EXACT_MATCH', 'epc', '=', '0', 'HIGH', 'ALERT', 10, 'Flag mismatch between packed and dispatched garments'),

-- Delivery rules
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='DELIVERY'), 'Delivery Shortage', 'EXACT_MATCH', 'epc', '=', '0', 'HIGH', 'ALERT', 10, 'Flag garments dispatched but not received at hospital'),
(NULL, (SELECT id FROM reconciliation_point_type WHERE code='DELIVERY'), 'Condition Check', 'STATUS_MISMATCH', 'condition', '!=', 'GOOD', 'MEDIUM', 'FLAG', 20, 'Flag garments delivered in non-good condition')

ON CONFLICT (tenant_id, point_type_id, rule_name) DO NOTHING;

-- Updated at triggers
CREATE TRIGGER update_reconciliation_run_updated_at BEFORE UPDATE ON reconciliation_run FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discrepancy_updated_at BEFORE UPDATE ON discrepancy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missing_alert_updated_at BEFORE UPDATE ON missing_garment_alert FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recon_rule_updated_at BEFORE UPDATE ON reconciliation_rule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();