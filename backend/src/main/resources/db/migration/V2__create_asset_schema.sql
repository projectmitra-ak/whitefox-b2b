-- WhiteFox B2B Laundry Management - Asset Schema
-- V2__create_asset_schema.sql

-- Garment Type (Shirt, Trouser, Scrub, Bedsheet, Towel, etc.)
CREATE TABLE garment_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL CHECK (category IN ('UPPER_BODY', 'LOWER_BODY', 'FULL_BODY', 'LINEN', 'TOWEL', 'ACCESSORY', 'OTHER')),
    default_wash_program_id UUID,
    default_wash_temp_celsius INTEGER DEFAULT 60,
    typical_lifespan_washes INTEGER DEFAULT 100,
    fabric_composition VARCHAR(255),
    care_instructions TEXT,
    standard_weight_grams INTEGER,
    color_fastness_rating INTEGER CHECK (color_fastness_rating BETWEEN 1 AND 5),
    shrinkage_tolerance_percent DECIMAL(4,2) DEFAULT 3.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_garment_type_category ON garment_type(category);
CREATE INDEX idx_garment_type_active ON garment_type(is_active);

-- Size
CREATE TABLE size (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    chest_cm DECIMAL(6,2),
    waist_cm DECIMAL(6,2),
    hip_cm DECIMAL(6,2),
    length_cm DECIMAL(6,2),
    is_standard BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_size_sort ON size(sort_order);

-- Standard sizes insert
INSERT INTO size (code, label, sort_order, chest_cm, waist_cm, length_cm) VALUES
('XS', 'Extra Small', 1, 86, 71, 66),
('S', 'Small', 2, 91, 76, 69),
('M', 'Medium', 3, 97, 81, 72),
('L', 'Large', 4, 104, 89, 75),
('XL', 'Extra Large', 5, 112, 97, 78),
('XXL', 'Double Extra Large', 6, 120, 105, 81),
('3XL', 'Triple Extra Large', 7, 128, 113, 84),
('CUSTOM', 'Custom Size', 99, NULL, NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Color
CREATE TABLE color (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    hex_code VARCHAR(7),
    pantone_code VARCHAR(20),
    is_standard BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

INSERT INTO color (code, name, hex_code, sort_order) VALUES
('WHITE', 'White', '#FFFFFF', 1),
('BLUE', 'Blue', '#0066CC', 2),
('NAVY', 'Navy Blue', '#000080', 3),
('GREEN', 'Green', '#008000', 4),
('TEAL', 'Teal', '#008080', 5),
('GREY', 'Grey', '#808080', 6),
('BLACK', 'Black', '#000000', 7),
('BEIGE', 'Beige', '#F5F5DC', 8),
('PINK', 'Pink', '#FFC0CB', 9),
('YELLOW', 'Yellow', '#FFFF00', 10),
('ORANGE', 'Orange', '#FFA500', 11),
('RED', 'Red', '#FF0000', 12),
('PURPLE', 'Purple', '#800080', 13),
('CUSTOM', 'Custom Color', NULL, 99)
ON CONFLICT (code) DO NOTHING;

-- RFID Tag
CREATE TABLE rfid_tag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    epc VARCHAR(100) NOT NULL UNIQUE,
    tag_type VARCHAR(30) NOT NULL DEFAULT 'UHF_PASSIVE' CHECK (tag_type IN ('UHF_PASSIVE', 'UHF_ACTIVE', 'HF_PASSIVE', 'NFC', 'BLE')),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    encoding_standard VARCHAR(30) DEFAULT 'GS1_EPC_GEN2' CHECK (encoding_standard IN ('GS1_EPC_GEN2', 'ISO_18000_6C', 'CUSTOM')),
    status VARCHAR(20) NOT NULL DEFAULT 'UNENCODED' CHECK (status IN ('UNENCODED', 'ENCODED', 'VERIFIED', 'ATTACHED', 'ACTIVE', 'DAMAGED', 'LOST', 'RETIRED')),
    encoded_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    attached_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ,
    read_count BIGINT DEFAULT 0,
    garment_id UUID,
    batch_number VARCHAR(50),
    warranty_expiry DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_rfid_tag_epc ON rfid_tag(epc);
CREATE INDEX idx_rfid_tag_status ON rfid_tag(status);
CREATE INDEX idx_rfid_tag_garment ON rfid_tag(garment_id);

-- Garment (Core Asset / Digital Twin)
CREATE TABLE garment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(50) NOT NULL UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE RESTRICT,
    garment_type_id UUID NOT NULL REFERENCES garment_type(id) ON DELETE RESTRICT,
    size_id UUID NOT NULL REFERENCES size(id) ON DELETE RESTRICT,
    color_id UUID NOT NULL REFERENCES color(id) ON DELETE RESTRICT,
    rfid_tag_id UUID UNIQUE REFERENCES rfid_tag(id) ON DELETE SET NULL,
    
    -- Status & Lifecycle
    status VARCHAR(30) NOT NULL DEFAULT 'PROCURED' CHECK (status IN (
        'PROCURED', 'TAGGED', 'ALLOCATED', 'IN_USE', 'IN_LOCKER', 
        'IN_TRANSIT', 'RECEIVED_AT_PLANT', 'SORTING', 'WASHING', 
        'DRYING', 'QC_PENDING', 'QC_PASSED', 'QC_FAILED', 
        'REPAIRING', 'REPAIRED', 'PACKED', 'DISPATCHED', 
        'DELIVERED', 'MISSING', 'LOST', 'DAMAGED', 'RETIRED', 'DISPOSED'
    )),
    previous_status VARCHAR(30),
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tracking
    current_branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    current_department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    current_location_type VARCHAR(30) CHECK (current_location_type IN ('BRANCH', 'DEPARTMENT', 'LOCKER', 'PLANT', 'TRANSIT', 'WASHING_MACHINE', 'DRYER', 'QC_STATION', 'PACKING_STATION', 'DISPATCH_AREA')),
    current_location_id UUID,
    locker_number VARCHAR(50),
    
    -- Employee Assignment (for 3-set model)
    assigned_employee_id UUID,
    set_position CHAR(1) CHECK (set_position IN ('A', 'B', 'C')),
    
    -- Lifecycle Metrics
    manufacture_date DATE,
    procurement_date DATE,
    first_use_date DATE,
    wash_count INTEGER NOT NULL DEFAULT 0,
    repair_count INTEGER NOT NULL DEFAULT 0,
    qc_pass_count INTEGER NOT NULL DEFAULT 0,
    qc_fail_count INTEGER NOT NULL DEFAULT 0,
    total_days_in_use INTEGER DEFAULT 0,
    total_days_in_laundry INTEGER DEFAULT 0,
    last_wash_date TIMESTAMPTZ,
    last_qc_date TIMESTAMPTZ,
    predicted_retirement_date DATE,
    
    -- Condition
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    last_condition_check TIMESTAMPTZ,
    notes TEXT,
    
    -- Financial
    purchase_cost DECIMAL(10,2),
    depreciation_per_wash DECIMAL(10,4),
    current_book_value DECIMAL(10,2),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_garment_tenant ON garment(tenant_id);
CREATE INDEX idx_garment_asset_id ON garment(asset_id);
CREATE INDEX idx_garment_status ON garment(status);
CREATE INDEX idx_garment_rfid ON garment(rfid_tag_id);
CREATE INDEX idx_garment_employee ON garment(assigned_employee_id);
CREATE INDEX idx_garment_branch ON garment(current_branch_id);
CREATE INDEX idx_garment_type ON garment(garment_type_id);
CREATE INDEX idx_garment_wash_count ON garment(wash_count);
CREATE INDEX idx_garment_status_changed ON garment(status_changed_at DESC);

-- Garment Status History (Audit trail for lifecycle)
CREATE TABLE garment_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    location_type VARCHAR(30),
    location_id UUID,
    triggered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    trigger_type VARCHAR(30) CHECK (trigger_type IN ('MANUAL', 'RFID_SCAN', 'WORKFLOW', 'SCHEDULED', 'SYSTEM', 'CORRECTION')),
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_garment_history_garment ON garment_status_history(garment_id, created_at DESC);
CREATE INDEX idx_garment_history_status ON garment_status_history(to_status);

-- Employee
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(30),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')),
    hire_date DATE,
    termination_date DATE,
    employment_type VARCHAR(20) DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERN')),
    role VARCHAR(100),
    grade VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED')),
    uniform_required BOOLEAN DEFAULT TRUE,
    sets_allocated INTEGER DEFAULT 3,
    size_id UUID REFERENCES size(id) ON DELETE SET NULL,
    measurements JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, employee_code)
);

CREATE INDEX idx_employee_tenant ON employee(tenant_id);
CREATE INDEX idx_employee_branch ON employee(branch_id);
CREATE INDEX idx_employee_department ON employee(department_id);
CREATE INDEX idx_employee_status ON employee(status);
CREATE INDEX idx_employee_code ON employee(employee_code);

-- 3-Set Model: Employee Garment Set Assignment
CREATE TABLE employee_garment_set (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    set_a_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    set_b_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    set_c_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    current_rotation INTEGER NOT NULL DEFAULT 0,
    last_rotated_at TIMESTAMPTZ,
    last_rotated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    rotation_reason VARCHAR(30) CHECK (rotation_reason IN ('SHIFT_CHANGE', 'SCHEDULED', 'EMERGENCY', 'DAMAGED', 'MISSING', 'MANUAL')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (employee_id)
);

CREATE INDEX idx_emp_set_employee ON employee_garment_set(employee_id);
CREATE INDEX idx_emp_set_garments ON employee_garment_set(set_a_garment_id, set_b_garment_id, set_c_garment_id);

-- Garment Set Rotation History
CREATE TABLE garment_set_rotation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_garment_set_id UUID NOT NULL REFERENCES employee_garment_set(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    previous_set_a UUID REFERENCES garment(id) ON DELETE SET NULL,
    previous_set_b UUID REFERENCES garment(id) ON DELETE SET NULL,
    previous_set_c UUID REFERENCES garment(id) ON DELETE SET NULL,
    new_set_a UUID REFERENCES garment(id) ON DELETE SET NULL,
    new_set_b UUID REFERENCES garment(id) ON DELETE SET NULL,
    new_set_c UUID REFERENCES garment(id) ON DELETE SET NULL,
    rotation_number INTEGER NOT NULL,
    reason VARCHAR(30) CHECK (reason IN ('SHIFT_CHANGE', 'SCHEDULED', 'EMERGENCY', 'DAMAGED', 'MISSING', 'MANUAL')),
    rotated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_rotation_history_emp_set ON garment_set_rotation_history(employee_garment_set_id, created_at DESC);
CREATE INDEX idx_rotation_history_employee ON garment_set_rotation_history(employee_id);

-- Garment Location History (for tracking movement)
CREATE TABLE garment_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    location_type VARCHAR(30) NOT NULL CHECK (location_type IN ('BRANCH', 'DEPARTMENT', 'LOCKER', 'PLANT', 'TRANSIT', 'WASHING_MACHINE', 'DRYER', 'QC_STATION', 'PACKING_STATION', 'DISPATCH_AREA', 'TRUCK')),
    location_id UUID,
    location_name VARCHAR(255),
    from_location_type VARCHAR(30),
    from_location_id UUID,
    arrived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    departed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    triggered_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    trigger_event_id UUID,
    trigger_event_type VARCHAR(50),
    rfid_event_id UUID,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_location_history_garment ON garment_location_history(garment_id, arrived_at DESC);
CREATE INDEX idx_location_history_tenant ON garment_location_history(tenant_id, arrived_at DESC);
CREATE INDEX idx_location_history_location ON garment_location_history(location_type, location_id);
CREATE INDEX idx_location_history_rfid ON garment_location_history(rfid_event_id);

-- Wash Program
CREATE TABLE wash_program (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    temperature_celsius INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    chemical_dosage_ml_per_kg DECIMAL(8,2),
    water_level VARCHAR(20) CHECK (water_level IN ('LOW', 'MEDIUM', 'HIGH')),
    spin_speed_rpm INTEGER,
    suitable_fabrics TEXT[],
    unsuitable_fabrics TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Garment Type -> Wash Program mapping
CREATE TABLE garment_type_wash_program (
    garment_type_id UUID NOT NULL REFERENCES garment_type(id) ON DELETE CASCADE,
    wash_program_id UUID NOT NULL REFERENCES wash_program(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 1,
    notes TEXT,
    PRIMARY KEY (garment_type_id, wash_program_id)
);

-- Updated at triggers
CREATE TRIGGER update_garment_type_updated_at BEFORE UPDATE ON garment_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_size_updated_at BEFORE UPDATE ON size FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfid_tag_updated_at BEFORE UPDATE ON rfid_tag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_garment_updated_at BEFORE UPDATE ON garment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_updated_at BEFORE UPDATE ON employee FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emp_set_updated_at BEFORE UPDATE ON employee_garment_set FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wash_program_updated_at BEFORE UPDATE ON wash_program FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default wash programs
INSERT INTO wash_program (code, name, description, temperature_celsius, duration_minutes, chemical_dosage_ml_per_kg, water_level, spin_speed_rpm) VALUES
('STANDARD_COTTON', 'Standard Cotton', 'Standard wash for cotton garments', 60, 45, 15.0, 'MEDIUM', 800),
('HEAVY_SOIL', 'Heavy Soil', 'For heavily soiled items', 75, 60, 20.0, 'HIGH', 1000),
('DELICATE', 'Delicate', 'Gentle wash for delicate fabrics', 40, 35, 10.0, 'LOW', 400),
('WHITE_HOT', 'White Hot Wash', 'High temp for whites', 90, 50, 25.0, 'HIGH', 1000),
('COLOR_SAFE', 'Color Safe', 'Cool wash for colors', 40, 40, 12.0, 'MEDIUM', 600),
('MEDICAL_SCRUBS', 'Medical Scrubs', 'Hygienic wash for scrubs', 71, 55, 18.0, 'MEDIUM', 800),
('LINEN_HEAVY', 'Heavy Linen', 'For bedsheets and heavy linen', 75, 65, 20.0, 'HIGH', 1000),
('TOWEL_FLUFF', 'Towel Fluff', 'Fluffy towel cycle', 60, 50, 15.0, 'HIGH', 600)
ON CONFLICT (code) DO NOTHING;