-- WhiteFox B2B Laundry Management - RFID Schema
-- V3__create_rfid_schema.sql

-- RFID Reader
CREATE TABLE rfid_reader (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reader_type VARCHAR(30) NOT NULL DEFAULT 'FIXED' CHECK (reader_type IN ('FIXED', 'HANDHELD', 'MOBILE', 'PORTAL', 'CONVEYOR', 'OVEN_TUNNEL')),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    ip_address INET,
    port INTEGER DEFAULT 5084,
    protocol VARCHAR(30) DEFAULT 'LLRP' CHECK (protocol IN ('LLRP', 'CUSTOM_TCP', 'HTTP', 'MQTT', 'MODBUS')),
    llrp_ro_spec_id INTEGER,
    llrp_access_spec_id INTEGER,
    antenna_config JSONB DEFAULT '[]',
    read_zone_config JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR', 'CONFIGURING')),
    last_heartbeat TIMESTAMPTZ,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_rfid_reader_tenant ON rfid_reader(tenant_id);
CREATE INDEX idx_rfid_reader_branch ON rfid_reader(branch_id);
CREATE INDEX idx_rfid_reader_status ON rfid_reader(status);
CREATE INDEX idx_rfid_reader_code ON rfid_reader(code);

-- RFID Gate / Portal
CREATE TABLE rfid_gate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reader_id UUID NOT NULL REFERENCES rfid_reader(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    gate_type VARCHAR(30) NOT NULL DEFAULT 'ENTRY_EXIT' CHECK (gate_type IN ('ENTRY', 'EXIT', 'ENTRY_EXIT', 'INTERNAL', 'LOADING_DOCK', 'RECEIVING', 'SHIPPING', 'LOCKER_ROOM', 'QC_STATION')),
    direction VARCHAR(10) CHECK (direction IN ('IN', 'OUT', 'BIDIRECTIONAL')),
    location_description TEXT,
    gps_latitude DECIMAL(10, 8),
    gps_longitude DECIMAL(11, 8),
    antenna_ids INTEGER[],
    read_range_cm INTEGER DEFAULT 300,
    read_zone_polygon GEOMETRY(POLYGON, 4326),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CALIBRATING')),
    calibration_data JSONB DEFAULT '{}',
    expected_throughput_per_hour INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (reader_id, code)
);

CREATE INDEX idx_rfid_gate_reader ON rfid_gate(reader_id);
CREATE INDEX idx_rfid_gate_tenant ON rfid_gate(tenant_id);
CREATE INDEX idx_rfid_gate_branch ON rfid_gate(branch_id);
CREATE INDEX idx_rfid_gate_type ON rfid_gate(gate_type);
CREATE INDEX idx_rfid_gate_status ON rfid_gate(status);

-- RFID Scan Session (groups scans from a single pass)
CREATE TABLE rfid_scan_session (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_id UUID NOT NULL REFERENCES rfid_gate(id) ON DELETE CASCADE,
    reader_id UUID NOT NULL REFERENCES rfid_reader(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    session_type VARCHAR(30) NOT NULL DEFAULT 'GATE_PASS' CHECK (session_type IN ('GATE_PASS', 'INVENTORY', 'LOCATE', 'COMMISSIONING', 'DECOMMISSIONING', 'QC_SCAN', 'MANUAL')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_ms INTEGER,
    total_tags_read INTEGER DEFAULT 0,
    unique_tags_read INTEGER DEFAULT 0,
    expected_count INTEGER,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABORTED', 'ERROR')),
    trigger_source VARCHAR(30) CHECK (trigger_source IN ('PHOTO_EYE', 'MOTION', 'SCHEDULED', 'MANUAL', 'API', 'WEIGHT_SCALE')),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_scan_session_gate ON rfid_scan_session(gate_id, started_at DESC);
CREATE INDEX idx_scan_session_reader ON rfid_scan_session(reader_id, started_at DESC);
CREATE INDEX idx_scan_session_tenant ON rfid_scan_session(tenant_id, started_at DESC);
CREATE INDEX idx_scan_session_status ON rfid_scan_session(status);

-- Raw RFID Event (as received from reader/gateway)
CREATE TABLE rfid_event_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES rfid_scan_session(id) ON DELETE SET NULL,
    gate_id UUID REFERENCES rfid_gate(id) ON DELETE SET NULL,
    reader_id UUID REFERENCES rfid_reader(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    epc VARCHAR(100) NOT NULL,
    tid VARCHAR(100),
    user_memory VARCHAR(500),
    antenna_id INTEGER,
    rssi_dbm DECIMAL(5,2),
    phase_angle DECIMAL(6,3),
    frequency_khz BIGINT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(20) DEFAULT 'READ' CHECK (event_type IN ('READ', 'WRITE', 'LOCK', 'KILL', 'ACCESS')),
    protocol_data JSONB DEFAULT '{}',
    is_duplicate BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    processing_status VARCHAR(20) DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'ENRICHED', 'FAILED', 'IGNORED')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfid_raw_epc ON rfid_event_raw(epc);
CREATE INDEX idx_rfid_raw_session ON rfid_event_raw(session_id);
CREATE INDEX idx_rfid_raw_gate ON rfid_event_raw(gate_id, timestamp DESC);
CREATE INDEX idx_rfid_raw_reader ON rfid_event_raw(reader_id, timestamp DESC);
CREATE INDEX idx_rfid_raw_tenant ON rfid_event_raw(tenant_id, timestamp DESC);
CREATE INDEX idx_rfid_raw_timestamp ON rfid_event_raw(timestamp DESC);
CREATE INDEX idx_rfid_raw_processing ON rfid_event_raw(processing_status);
CREATE INDEX idx_rfid_raw_duplicate ON rfid_event_raw(is_duplicate);

-- Enriched RFID Event (with business context)
CREATE TABLE rfid_event_enriched (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_event_id UUID NOT NULL REFERENCES rfid_event_raw(id) ON DELETE CASCADE,
    session_id UUID REFERENCES rfid_scan_session(id) ON DELETE SET NULL,
    gate_id UUID REFERENCES rfid_gate(id) ON DELETE SET NULL,
    reader_id UUID REFERENCES rfid_reader(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    asset_id VARCHAR(50),
    garment_type VARCHAR(50),
    employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    set_position CHAR(1) CHECK (set_position IN ('A', 'B', 'C')),
    location_type VARCHAR(30) CHECK (location_type IN ('HOSPITAL_BRANCH', 'HOSPITAL_DEPARTMENT', 'HOSPITAL_LOCKER', 'LAUNDRY_PLANT', 'LAUNDRY_RECEIVING', 'LAUNDRY_WASHING', 'LAUNDRY_DRYING', 'LAUNDRY_QC', 'LAUNDRY_PACKING', 'LAUNDRY_DISPATCH', 'TRANSIT', 'TRUCK')),
    location_id UUID,
    location_name VARCHAR(255),
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    branch_name VARCHAR(255),
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    department_name VARCHAR(255),
    direction VARCHAR(10) CHECK (direction IN ('IN', 'OUT', 'INTERNAL')),
    movement_type VARCHAR(30) CHECK (movement_type IN ('PICKUP', 'DELIVERY', 'TRANSFER', 'INVENTORY', 'QC', 'REPAIR', 'ROTATION', 'UNKNOWN')),
    expected BOOLEAN DEFAULT TRUE,
    anomaly_flags TEXT[],
    enrichment_confidence DECIMAL(4,3),
    enriched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfid_enriched_raw ON rfid_event_enriched(raw_event_id);
CREATE INDEX idx_rfid_enriched_garment ON rfid_event_enriched(garment_id, enriched_at DESC);
CREATE INDEX idx_rfid_enriched_tenant ON rfid_event_enriched(tenant_id, enriched_at DESC);
CREATE INDEX idx_rfid_enriched_gate ON rfid_event_enriched(gate_id, enriched_at DESC);
CREATE INDEX idx_rfid_enriched_location ON rfid_event_enriched(location_type, location_id);
CREATE INDEX idx_rfid_enriched_movement ON rfid_event_enriched(movement_type);
CREATE INDEX idx_rfid_enriched_anomaly ON rfid_event_enriched(anomaly_flags) WHERE array_length(anomaly_flags, 1) > 0;

-- Deduplication Log
CREATE TABLE rfid_deduplication_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    epc VARCHAR(100) NOT NULL,
    reader_id UUID REFERENCES rfid_reader(id) ON DELETE SET NULL,
    gate_id UUID REFERENCES rfid_gate(id) ON DELETE SET NULL,
    first_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    duplicate_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    time_diff_ms INTEGER NOT NULL,
    deduplication_rule VARCHAR(50) DEFAULT 'TIME_WINDOW_5SEC',
    action_taken VARCHAR(20) DEFAULT 'SUPPRESSED' CHECK (action_taken IN ('SUPPRESSED', 'LOGGED', 'ALERTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dedup_epc ON rfid_deduplication_log(epc, created_at DESC);
CREATE INDEX idx_dedup_reader ON rfid_deduplication_log(reader_id, created_at DESC);

-- Reader Health / Diagnostics
CREATE TABLE rfid_reader_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reader_id UUID NOT NULL REFERENCES rfid_reader(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    temperature_celsius DECIMAL(5,2),
    power_status VARCHAR(20),
    antenna_status JSONB DEFAULT '[]',
    tag_read_rate_per_sec DECIMAL(10,2),
    error_rate_percent DECIMAL(5,2),
    uptime_seconds BIGINT,
    firmware_version VARCHAR(50),
    alerts TEXT[],
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_reader_health_reader ON rfid_reader_health(reader_id, recorded_at DESC);

-- Updated at triggers
CREATE TRIGGER update_rfid_reader_updated_at BEFORE UPDATE ON rfid_reader FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfid_gate_updated_at BEFORE UPDATE ON rfid_gate FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();