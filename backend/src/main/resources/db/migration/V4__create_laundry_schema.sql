-- WhiteFox B2B Laundry Management - Laundry Operations Schema
-- V4__create_laundry_schema.sql

-- Laundry Plant
CREATE TABLE laundry_plant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plant_type VARCHAR(30) DEFAULT 'CENTRAL' CHECK (plant_type IN ('CENTRAL', 'SATELLITE', 'MOBILE', 'ON_PREMISE')),
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
    capacity_kg_per_day INTEGER,
    operating_hours JSONB DEFAULT '{}',
    certifications JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'COMMISSIONING')),
    manager_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_plant_tenant ON laundry_plant(tenant_id);
CREATE INDEX idx_plant_branch ON laundry_plant(branch_id);
CREATE INDEX idx_plant_status ON laundry_plant(status);

-- Washing Machine
CREATE TABLE washing_machine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    capacity_kg INTEGER NOT NULL,
    machine_type VARCHAR(30) DEFAULT 'WASHER_EXTRACTOR' CHECK (machine_type IN ('WASHER_EXTRACTOR', 'TUNNEL_WASHER', 'BATCH_WASHER', 'CONTINUOUS_WASHER', 'DRYER', 'IRONER', 'FOLDER', 'STACKER')),
    available_programs UUID[],
    status VARCHAR(20) DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'RUNNING', 'PAUSED', 'MAINTENANCE', 'ERROR', 'OFFLINE')),
    current_batch_id UUID,
    last_maintenance DATE,
    next_maintenance DATE,
    total_cycles_run BIGINT DEFAULT 0,
    total_kg_processed DECIMAL(12,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plant_id, code)
);

CREATE INDEX idx_washer_plant ON washing_machine(plant_id);
CREATE INDEX idx_washer_status ON washing_machine(status);
CREATE INDEX idx_washer_type ON washing_machine(machine_type);

-- Pickup Request (Scheduled)
CREATE TABLE pickup_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    request_number VARCHAR(50) NOT NULL UNIQUE,
    requested_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'EMERGENCY')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    estimated_garment_count INTEGER,
    estimated_weight_kg DECIMAL(10,2),
    special_instructions TEXT,
    recurring_pattern VARCHAR(50) CHECK (recurring_pattern IN ('DAILY', 'WEEKDAY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM')),
    recurring_end_date DATE,
    parent_request_id UUID REFERENCES pickup_request(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_req_tenant ON pickup_request(tenant_id);
CREATE INDEX idx_pickup_req_branch ON pickup_request(branch_id);
CREATE INDEX idx_pickup_req_date ON pickup_request(scheduled_date);
CREATE INDEX idx_pickup_req_status ON pickup_request(status);
CREATE INDEX idx_pickup_req_number ON pickup_request(request_number);

-- Pickup (Actual execution)
CREATE TABLE pickup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES pickup_request(id) ON DELETE SET NULL,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    vehicle_id UUID,
    pickup_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'SCANNING', 'LOADING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED')),
    started_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    scanning_started_at TIMESTAMPTZ,
    scanning_completed_at TIMESTAMPTZ,
    loading_completed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expected_garment_count INTEGER,
    scanned_garment_count INTEGER DEFAULT 0,
    loaded_garment_count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(10,2),
    temperature_celsius DECIMAL(4,2),
    humidity_percent DECIMAL(5,2),
    gps_latitude_start DECIMAL(10, 8),
    gps_longitude_start DECIMAL(11, 8),
    gps_latitude_end DECIMAL(10, 8),
    gps_longitude_end DECIMAL(11, 8),
    route_distance_km DECIMAL(8,2),
    route_duration_minutes INTEGER,
    notes TEXT,
    issues JSONB DEFAULT '[]',
    signature_url VARCHAR(500),
    signed_by VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickup_request ON pickup(request_id);
CREATE INDEX idx_pickup_tenant ON pickup(tenant_id);
CREATE INDEX idx_pickup_branch ON pickup(branch_id);
CREATE INDEX idx_pickup_driver ON pickup(driver_id);
CREATE INDEX idx_pickup_status ON pickup(status);
CREATE INDEX idx_pickup_date ON pickup(started_at DESC);

-- Pickup Scanned Garment (Detail)
CREATE TABLE pickup_scanned_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_id UUID NOT NULL REFERENCES pickup(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    rfid_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scan_sequence INTEGER,
    location_in_bag VARCHAR(50),
    condition_noted VARCHAR(30) CHECK (condition_noted IN ('GOOD', 'STAINED', 'TORN', 'MISSING_BUTTON', 'DAMAGED', 'WET', 'UNKNOWN')),
    weight_grams INTEGER,
    notes TEXT,
    UNIQUE (pickup_id, garment_id)
);

CREATE INDEX idx_pickup_scan_pickup ON pickup_scanned_garment(pickup_id);
CREATE INDEX idx_pickup_scan_garment ON pickup_scanned_garment(garment_id);
CREATE INDEX idx_pickup_scan_rfid ON pickup_scanned_garment(rfid_event_id);

-- Wash Batch
CREATE TABLE wash_batch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    wash_program_id UUID REFERENCES wash_program(id) ON DELETE SET NULL,
    machine_id UUID REFERENCES washing_machine(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'LOADING', 'LOADED', 'WASHING', 'RINSING', 'SPINNING', 'UNLOADING', 'COMPLETED', 'FAILED', 'ABORTED', 'REWASH_REQUIRED')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    garment_count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    target_temperature_celsius INTEGER,
    actual_temperature_celsius DECIMAL(5,2),
    chemical_batch_id VARCHAR(100),
    chemical_dosage_ml DECIMAL(10,2),
    water_consumption_liters DECIMAL(10,2),
    energy_consumption_kwh DECIMAL(10,2),
    started_at TIMESTAMPTZ,
    wash_started_at TIMESTAMPTZ,
    wash_completed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    quality_check_required BOOLEAN DEFAULT TRUE,
    qc_sample_rate DECIMAL(4,3) DEFAULT 0.1,
    notes TEXT,
    issues JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wash_batch_plant ON wash_batch(plant_id);
CREATE INDEX idx_wash_batch_status ON wash_batch(status);
CREATE INDEX idx_wash_batch_number ON wash_batch(batch_number);
CREATE INDEX idx_wash_batch_dates ON wash_batch(started_at DESC);

-- Wash Batch Garments
CREATE TABLE wash_batch_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES wash_batch(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    rfid_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    loaded_at TIMESTAMPTZ,
    unloaded_at TIMESTAMPTZ,
    position_in_machine VARCHAR(50),
    pre_wash_condition VARCHAR(30) CHECK (pre_wash_condition IN ('GOOD', 'HEAVILY_SOILED', 'STAINED', 'DAMAGED', 'WET')),
    post_wash_condition VARCHAR(30) CHECK (post_wash_condition IN ('CLEAN', 'STILL_SOILED', 'STAINED', 'DAMAGED', 'SHRUNK', 'COLOR_BLED')),
    weight_before_grams INTEGER,
    weight_after_grams INTEGER,
    qc_selected BOOLEAN DEFAULT FALSE,
    qc_result VARCHAR(20) CHECK (qc_result IN ('PASS', 'FAIL', 'REWASH', 'REPAIR', 'PENDING')),
    notes TEXT,
    UNIQUE (batch_id, garment_id)
);

CREATE INDEX idx_wbg_batch ON wash_batch_garment(batch_id);
CREATE INDEX idx_wbg_garment ON wash_batch_garment(garment_id);
CREATE INDEX idx_wbg_qc ON wash_batch_garment(qc_selected, qc_result);

-- Dry Cycle
CREATE TABLE dry_cycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wash_batch_id UUID REFERENCES wash_batch(id) ON DELETE SET NULL,
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    dryer_id UUID REFERENCES washing_machine(id) ON DELETE SET NULL,
    cycle_number VARCHAR(50) NOT NULL UNIQUE,
    program_name VARCHAR(100),
    target_temperature_celsius INTEGER,
    target_humidity_percent INTEGER,
    target_duration_minutes INTEGER,
    actual_temperature_celsius DECIMAL(5,2),
    actual_humidity_percent DECIMAL(5,2),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'LOADING', 'DRYING', 'COOLING', 'UNLOADING', 'COMPLETED', 'FAILED', 'ABORTED')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    energy_consumption_kwh DECIMAL(10,2),
    garment_count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(10,2),
    operator_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dry_cycle_batch ON dry_cycle(wash_batch_id);
CREATE INDEX idx_dry_cycle_plant ON dry_cycle(plant_id);
CREATE INDEX idx_dry_cycle_status ON dry_cycle(status);

-- Dry Cycle Garments
CREATE TABLE dry_cycle_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dry_cycle_id UUID NOT NULL REFERENCES dry_cycle(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    loaded_at TIMESTAMPTZ,
    unloaded_at TIMESTAMPTZ,
    weight_before_grams INTEGER,
    weight_after_grams INTEGER,
    moisture_content_percent DECIMAL(5,2),
    condition_after VARCHAR(30) CHECK (condition_after IN ('DRY', 'DAMP', 'OVER_DRIED', 'SHRUNK', 'WRINKLED')),
    UNIQUE (dry_cycle_id, garment_id)
);

CREATE INDEX idx_dcg_cycle ON dry_cycle_garment(dry_cycle_id);
CREATE INDEX idx_dcg_garment ON dry_cycle_garment(garment_id);

-- Quality Check
CREATE TABLE quality_check (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    wash_batch_id UUID REFERENCES wash_batch(id) ON DELETE SET NULL,
    dry_cycle_id UUID REFERENCES dry_cycle(id) ON DELETE SET NULL,
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    qc_number VARCHAR(50) NOT NULL UNIQUE,
    checker_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    check_type VARCHAR(30) DEFAULT 'POST_WASH' CHECK (check_type IN ('POST_WASH', 'POST_DRY', 'PRE_PACK', 'RANDOM_SAMPLE', 'CUSTOMER_COMPLAINT', 'REWORK_VERIFICATION')),
    result VARCHAR(20) NOT NULL CHECK (result IN ('PASS', 'FAIL', 'REWASH', 'REPAIR', 'REPLACE', 'CONDITIONAL_PASS')),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    -- Defect details
    has_stains BOOLEAN DEFAULT FALSE,
    stain_types TEXT[],
    stain_severity VARCHAR(20) CHECK (stain_severity IN ('LIGHT', 'MODERATE', 'HEAVY')),
    has_tears BOOLEAN DEFAULT FALSE,
    tear_locations TEXT[],
    tear_severity VARCHAR(20) CHECK (tear_severity IN ('MINOR', 'MAJOR', 'CRITICAL')),
    has_missing_buttons BOOLEAN DEFAULT FALSE,
    missing_button_count INTEGER DEFAULT 0,
    has_broken_zipper BOOLEAN DEFAULT FALSE,
    has_fraying BOOLEAN DEFAULT FALSE,
    has_discoloration BOOLEAN DEFAULT FALSE,
    has_shrinkage BOOLEAN DEFAULT FALSE,
    shrinkage_percent DECIMAL(5,2),
    has_odor BOOLEAN DEFAULT FALSE,
    has_wrinkles BOOLEAN DEFAULT FALSE,
    wrinkle_severity VARCHAR(20) CHECK (wrinkle_severity IN ('LIGHT', 'MODERATE', 'HEAVY')),
    measurements JSONB DEFAULT '{}',
    photos JSONB DEFAULT '[]',
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rework_required BOOLEAN DEFAULT FALSE,
    rework_notes TEXT,
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qc_garment ON quality_check(garment_id, checked_at DESC);
CREATE INDEX idx_qc_batch ON quality_check(wash_batch_id);
CREATE INDEX idx_qc_plant ON quality_check(plant_id);
CREATE INDEX idx_qc_result ON quality_check(result);
CREATE INDEX idx_qc_checker ON quality_check(checker_id);
CREATE INDEX idx_qc_date ON quality_check(checked_at DESC);

-- Repair
CREATE TABLE repair (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    quality_check_id UUID REFERENCES quality_check(id) ON DELETE SET NULL,
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    repair_number VARCHAR(50) NOT NULL UNIQUE,
    repair_type VARCHAR(30) NOT NULL CHECK (repair_type IN ('STITCHING', 'PATCHING', 'BUTTON_REPLACEMENT', 'ZIPPER_REPAIR', 'ZIPPER_REPLACEMENT', 'HEM_REPAIR', 'SEAM_REPAIR', 'STAIN_REMOVAL', 'RE_DYEING', 'OTHER')),
    damage_description TEXT,
    repair_description TEXT,
    materials_used JSONB DEFAULT '[]',
    labor_minutes INTEGER,
    cost_materials DECIMAL(10,2) DEFAULT 0,
    cost_labor DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (cost_materials + cost_labor) STORED,
    technician_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'OUTSOURCED')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    warranty_days INTEGER DEFAULT 30,
    qc_after_repair_id UUID REFERENCES quality_check(id) ON DELETE SET NULL,
    outsourced_to VARCHAR(255),
    outsourced_cost DECIMAL(10,2),
    notes TEXT,
    photos_before JSONB DEFAULT '[]',
    photos_after JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repair_garment ON repair(garment_id);
CREATE INDEX idx_repair_plant ON repair(plant_id);
CREATE INDEX idx_repair_status ON repair(status);
CREATE INDEX idx_repair_technician ON repair(technician_id);
CREATE INDEX idx_repair_qc ON repair(quality_check_id);

-- Pack List
CREATE TABLE pack_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID,
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    pack_number VARCHAR(50) NOT NULL UNIQUE,
    packer_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PACKING', 'PACKED', 'SEALED', 'VERIFIED', 'DISPATCHED')),
    bag_count INTEGER DEFAULT 0,
    garment_count INTEGER DEFAULT 0,
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    packing_method VARCHAR(30) CHECK (packing_method IN ('INDIVIDUAL_BAG', 'BUNDLE', 'HANGER', 'FLAT_PACK', 'ROLL_PACK', 'CARTON')),
    seal_numbers TEXT[],
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pack_dispatch ON pack_list(dispatch_id);
CREATE INDEX idx_pack_plant ON pack_list(plant_id);
CREATE INDEX idx_pack_status ON pack_list(status);

-- Pack List Garments
CREATE TABLE pack_list_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_list_id UUID NOT NULL REFERENCES pack_list(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    bag_number INTEGER,
    position_in_bag INTEGER,
    folded BOOLEAN DEFAULT TRUE,
    hanger_type VARCHAR(30),
    special_handling BOOLEAN DEFAULT FALSE,
    notes TEXT,
    UNIQUE (pack_list_id, garment_id)
);

CREATE INDEX idx_plg_pack ON pack_list_garment(pack_list_id);
CREATE INDEX idx_plg_garment ON pack_list_garment(garment_id);

-- Dispatch
CREATE TABLE dispatch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    vehicle_id UUID,
    dispatch_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'LOADING', 'LOADED', 'SEALED', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'UNLOADING', 'DELIVERED', 'PARTIAL_DELIVERY', 'FAILED', 'CANCELLED')),
    destination_branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    destination_type VARCHAR(30) CHECK (destination_type IN ('HOSPITAL_BRANCH', 'LAUNDRY_PLANT', 'STORAGE', 'CUSTOMER_SITE')),
    dispatch_date DATE NOT NULL,
    estimated_arrival TIMESTAMPTZ,
    loaded_weight_kg DECIMAL(10,2),
    bag_count INTEGER DEFAULT 0,
    garment_count INTEGER DEFAULT 0,
    seal_numbers TEXT[],
    gps_tracking_enabled BOOLEAN DEFAULT TRUE,
    route_optimized BOOLEAN DEFAULT FALSE,
    route_distance_km DECIMAL(8,2),
    route_duration_minutes INTEGER,
    loaded_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    loaded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    dispatched_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    issues JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispatch_plant ON dispatch(plant_id);
CREATE INDEX idx_dispatch_driver ON dispatch(driver_id);
CREATE INDEX idx_dispatch_branch ON dispatch(destination_branch_id);
CREATE INDEX idx_dispatch_status ON dispatch(status);
CREATE INDEX idx_dispatch_date ON dispatch(dispatch_date DESC);
CREATE INDEX idx_dispatch_number ON dispatch(dispatch_number);

-- Dispatch Pack Lists
CREATE TABLE dispatch_pack_list (
    dispatch_id UUID NOT NULL REFERENCES dispatch(id) ON DELETE CASCADE,
    pack_list_id UUID NOT NULL REFERENCES pack_list(id) ON DELETE CASCADE,
    loaded_sequence INTEGER,
    loaded_at TIMESTAMPTZ,
    PRIMARY KEY (dispatch_id, pack_list_id)
);

-- Delivery
CREATE TABLE delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID NOT NULL REFERENCES dispatch(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    delivery_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'UNLOADING', 'SCANNING', 'VERIFYING', 'COMPLETED', 'PARTIAL', 'DISCREPANCY', 'REJECTED', 'RESCHEDULED')),
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    arrived_at TIMESTAMPTZ,
    unloading_started_at TIMESTAMPTZ,
    unloading_completed_at TIMESTAMPTZ,
    scanning_started_at TIMESTAMPTZ,
    scanning_completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expected_garment_count INTEGER,
    received_garment_count INTEGER DEFAULT 0,
    verified_garment_count INTEGER DEFAULT 0,
    discrepancy_count INTEGER DEFAULT 0,
    temperature_celsius DECIMAL(4,2),
    humidity_percent DECIMAL(5,2),
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    signature_url VARCHAR(500),
    signed_by VARCHAR(255),
    notes TEXT,
    issues JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivery_dispatch ON delivery(dispatch_id);
CREATE INDEX idx_delivery_tenant ON delivery(tenant_id);
CREATE INDEX idx_delivery_branch ON delivery(branch_id);
CREATE INDEX idx_delivery_status ON delivery(status);
CREATE INDEX idx_delivery_date ON delivery(scheduled_date DESC);

-- Delivery Scanned Garments
CREATE TABLE delivery_scanned_garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES delivery(id) ON DELETE CASCADE,
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    rfid_event_id UUID REFERENCES rfid_event_raw(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scan_sequence INTEGER,
    condition_on_delivery VARCHAR(30) CHECK (condition_on_delivery IN ('GOOD', 'WRINKLED', 'DAMP', 'STAINED', 'DAMAGED', 'MISSING')),
    locker_assigned VARCHAR(50),
    notes TEXT,
    UNIQUE (delivery_id, garment_id)
);

CREATE INDEX idx_dsg_delivery ON delivery_scanned_garment(delivery_id);
CREATE INDEX idx_dsg_garment ON delivery_scanned_garment(garment_id);
CREATE INDEX idx_dsg_rfid ON delivery_scanned_garment(rfid_event_id);

-- Updated at triggers
CREATE TRIGGER update_laundry_plant_updated_at BEFORE UPDATE ON laundry_plant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_washing_machine_updated_at BEFORE UPDATE ON washing_machine FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_request_updated_at BEFORE UPDATE ON pickup_request FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pickup_updated_at BEFORE UPDATE ON pickup FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wash_batch_updated_at BEFORE UPDATE ON wash_batch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dry_cycle_updated_at BEFORE UPDATE ON dry_cycle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_check_updated_at BEFORE UPDATE ON quality_check FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_updated_at BEFORE UPDATE ON repair FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pack_list_updated_at BEFORE UPDATE ON pack_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dispatch_updated_at BEFORE UPDATE ON dispatch FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_updated_at BEFORE UPDATE ON delivery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default plant
INSERT INTO laundry_plant (id, code, name, plant_type, capacity_kg_per_day, status, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000010', 'PLANT001', 'WhiteFox Central Laundry Plant', 'CENTRAL', 5000, 'ACTIVE', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;