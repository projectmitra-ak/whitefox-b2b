-- WhiteFox B2B Laundry Management - Inventory & Analytics Schema
-- V6__create_inventory_schema.sql

-- Real-time Garment Location (Materialized view for fast lookups)
CREATE TABLE garment_location (
    garment_id UUID PRIMARY KEY REFERENCES garment(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    location_type VARCHAR(30) NOT NULL CHECK (location_type IN (
        'BRANCH', 'DEPARTMENT', 'LOCKER', 'LAUNDRY_PLANT', 
        'RECEIVING', 'WASHING', 'DRYING', 'QC', 'PACKING', 'DISPATCH', 
        'TRANSIT', 'TRUCK', 'MISSING', 'RETIRED'
    )),
    location_id UUID,
    location_name VARCHAR(255),
    branch_id UUID REFERENCES branch(id) ON DELETE SET NULL,
    branch_name VARCHAR(255),
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    department_name VARCHAR(255),
    locker_number VARCHAR(50),
    plant_id UUID REFERENCES laundry_plant(id) ON DELETE SET NULL,
    plant_name VARCHAR(255),
    machine_id UUID REFERENCES washing_machine(id) ON DELETE SET NULL,
    machine_name VARCHAR(255),
    truck_id UUID,
    truck_license_plate VARCHAR(20),
    employee_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    employee_name VARCHAR(255),
    set_position CHAR(1) CHECK (set_position IN ('A', 'B', 'C')),
    status VARCHAR(30),
    last_rfid_scan_at TIMESTAMPTZ,
    last_rfid_gate_id UUID REFERENCES rfid_gate(id) ON DELETE SET NULL,
    last_movement_type VARCHAR(30),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_garment_loc_tenant ON garment_location(tenant_id);
CREATE INDEX idx_garment_loc_type ON garment_location(location_type);
CREATE INDEX idx_garment_loc_branch ON garment_location(branch_id);
CREATE INDEX idx_garment_loc_dept ON garment_location(department_id);
CREATE INDEX idx_garment_loc_plant ON garment_location(plant_id);
CREATE INDEX idx_garment_loc_employee ON garment_location(employee_id);
CREATE INDEX idx_garment_loc_status ON garment_location(status);
CREATE INDEX idx_garment_loc_updated ON garment_location(updated_at DESC);

-- Inventory Summary (Aggregated counts per tenant/status/location)
CREATE TABLE inventory_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branch(id) ON DELETE CASCADE,
    department_id UUID REFERENCES department(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES laundry_plant(id) ON DELETE CASCADE,
    location_type VARCHAR(30) NOT NULL,
    garment_type_id UUID REFERENCES garment_type(id) ON DELETE SET NULL,
    size_id UUID REFERENCES size(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL,
    garment_count INTEGER NOT NULL DEFAULT 0,
    total_weight_kg DECIMAL(12,2) DEFAULT 0,
    total_wash_count BIGINT DEFAULT 0,
    avg_wash_count DECIMAL(8,2) DEFAULT 0,
    min_wash_count INTEGER,
    max_wash_count INTEGER,
    estimated_value DECIMAL(14,2),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_latest BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, branch_id, department_id, plant_id, location_type, garment_type_id, size_id, status, snapshot_date, is_latest)
);

CREATE INDEX idx_inv_sum_tenant ON inventory_summary(tenant_id, snapshot_date DESC);
CREATE INDEX idx_inv_sum_branch ON inventory_summary(branch_id);
CREATE INDEX idx_inv_sum_latest ON inventory_summary(is_latest) WHERE is_latest = TRUE;

-- Inventory Snapshot History (for trend analysis)
CREATE TABLE inventory_snapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_garments INTEGER DEFAULT 0,
    in_use_count INTEGER DEFAULT 0,
    in_locker_count INTEGER DEFAULT 0,
    in_laundry_count INTEGER DEFAULT 0,
    in_transit_count INTEGER DEFAULT 0,
    at_plant_count INTEGER DEFAULT 0,
    washing_count INTEGER DEFAULT 0,
    drying_count INTEGER DEFAULT 0,
    qc_count INTEGER DEFAULT 0,
    packed_count INTEGER DEFAULT 0,
    dispatched_count INTEGER DEFAULT 0,
    missing_count INTEGER DEFAULT 0,
    damaged_count INTEGER DEFAULT 0,
    retired_count INTEGER DEFAULT 0,
    total_wash_count BIGINT DEFAULT 0,
    avg_wash_count DECIMAL(8,2) DEFAULT 0,
    garments_due_replacement INTEGER DEFAULT 0,
    estimated_total_value DECIMAL(16,2),
    metadata JSONB DEFAULT '{}',
    UNIQUE (tenant_id, snapshot_date, snapshot_time)
);

CREATE INDEX idx_inv_snap_tenant_date ON inventory_snapshot(tenant_id, snapshot_date DESC);

-- Garment Utilization Metrics
CREATE TABLE garment_utilization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    garment_id UUID NOT NULL REFERENCES garment(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    days_in_period INTEGER NOT NULL,
    days_in_use INTEGER DEFAULT 0,
    days_in_locker INTEGER DEFAULT 0,
    days_in_laundry INTEGER DEFAULT 0,
    days_in_transit INTEGER DEFAULT 0,
    days_missing INTEGER DEFAULT 0,
    wash_cycles_completed INTEGER DEFAULT 0,
    qc_passes INTEGER DEFAULT 0,
    qc_failures INTEGER DEFAULT 0,
    repairs_needed INTEGER DEFAULT 0,
    rotations_completed INTEGER DEFAULT 0,
    utilization_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN days_in_period > 0 THEN (days_in_use::DECIMAL / days_in_period * 100) ELSE 0 END
    ) STORED,
    laundry_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN days_in_period > 0 THEN (days_in_laundry::DECIMAL / days_in_period * 100) ELSE 0 END
    ) STORED,
    qc_pass_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN (qc_passes + qc_failures) > 0 THEN (qc_passes::DECIMAL / (qc_passes + qc_failures) * 100) ELSE 100 END
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (garment_id, period_type, period_start)
);

CREATE INDEX idx_util_garment ON garment_utilization(garment_id, period_start DESC);
CREATE INDEX idx_util_tenant ON garment_utilization(tenant_id, period_start DESC);
CREATE INDEX idx_util_period ON garment_utilization(period_type, period_start);

-- Department Inventory Summary
CREATE TABLE department_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branch(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    garment_type_id UUID REFERENCES garment_type(id) ON DELETE SET NULL,
    size_id UUID REFERENCES size(id) ON DELETE SET NULL,
    required_sets INTEGER DEFAULT 0,
    allocated_sets INTEGER DEFAULT 0,
    in_use_count INTEGER DEFAULT 0,
    in_locker_count INTEGER DEFAULT 0,
    in_laundry_count INTEGER DEFAULT 0,
    shortage_count INTEGER GENERATED ALWAYS AS (required_sets - allocated_sets) STORED,
    surplus_count INTEGER DEFAULT 0,
    avg_wash_count DECIMAL(8,2),
    garments_needing_replacement INTEGER DEFAULT 0,
    last_reconciled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, branch_id, department_id, garment_type_id, size_id)
);

CREATE INDEX idx_dept_inv_tenant ON department_inventory(tenant_id);
CREATE INDEX idx_dept_inv_branch ON department_inventory(branch_id);
CREATE INDEX idx_dept_inv_dept ON department_inventory(department_id);

-- Plant Throughput Metrics
CREATE TABLE plant_throughput (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plant_id UUID NOT NULL REFERENCES laundry_plant(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(20) CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT', 'FULL_DAY')),
    batches_processed INTEGER DEFAULT 0,
    garments_washed INTEGER DEFAULT 0,
    kg_washed DECIMAL(12,2) DEFAULT 0,
    wash_hours DECIMAL(6,2) DEFAULT 0,
    dry_cycles_completed INTEGER DEFAULT 0,
    kg_dried DECIMAL(12,2) DEFAULT 0,
    dry_hours DECIMAL(6,2) DEFAULT 0,
    qc_inspections INTEGER DEFAULT 0,
    qc_passed INTEGER DEFAULT 0,
    qc_failed INTEGER DEFAULT 0,
    qc_rework INTEGER DEFAULT 0,
    repairs_completed INTEGER DEFAULT 0,
    garments_packed INTEGER DEFAULT 0,
    garments_dispatched INTEGER DEFAULT 0,
    avg_batch_size DECIMAL(6,2),
    avg_wash_time_minutes DECIMAL(6,2),
    avg_dry_time_minutes DECIMAL(6,2),
    machine_utilization_pct DECIMAL(5,2),
    energy_kwh DECIMAL(10,2),
    water_liters DECIMAL(12,2),
    chemical_ml DECIMAL(12,2),
    labor_hours DECIMAL(6,2),
    cost_per_garment DECIMAL(10,4),
    cost_per_kg DECIMAL(10,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (plant_id, date, shift)
);

CREATE INDEX idx_plant_tp_plant_date ON plant_throughput(plant_id, date DESC);

-- Employee Utilization (for 3-set model tracking)
CREATE TABLE employee_utilization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    set_a_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    set_b_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    set_c_garment_id UUID REFERENCES garment(id) ON DELETE SET NULL,
    rotations_count INTEGER DEFAULT 0,
    rotation_reasons JSONB DEFAULT '{}',
    days_with_all_sets INTEGER DEFAULT 0,
    days_missing_set INTEGER DEFAULT 0,
    emergency_rotations INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, date)
);

CREATE INDEX idx_emp_util_emp ON employee_utilization(employee_id, date DESC);
CREATE INDEX idx_emp_util_tenant ON employee_utilization(tenant_id, date DESC);

-- SLA Tracking
CREATE TABLE sla_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contract(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    pickup_request_id UUID REFERENCES pickup_request(id) ON DELETE SET NULL,
    pickup_id UUID REFERENCES pickup(id) ON DELETE SET NULL,
    delivery_id UUID REFERENCES delivery(id) ON DELETE SET NULL,
    sla_type VARCHAR(30) NOT NULL CHECK (sla_type IN ('PICKUP_TO_DELIVERY', 'PLANT_PROCESSING', 'EMERGENCY_RESPONSE', 'REPLACEMENT_TIME')),
    sla_hours INTEGER NOT NULL,
    actual_hours DECIMAL(8,2),
    started_at TIMESTAMPTZ NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'MET', 'BREACHED', 'AT_RISK', 'CANCELLED')),
    breach_reason TEXT,
    penalty_amount DECIMAL(12,2),
    risk_score DECIMAL(4,3),
    risk_factors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sla_contract ON sla_tracking(contract_id);
CREATE INDEX idx_sla_tenant ON sla_tracking(tenant_id);
CREATE INDEX idx_sla_status ON sla_tracking(status);
CREATE INDEX idx_sla_dates ON sla_tracking(started_at DESC);
CREATE INDEX idx_sla_risk ON sla_tracking(risk_score DESC) WHERE status IN ('IN_PROGRESS', 'AT_RISK');

-- Updated at triggers
CREATE TRIGGER update_garment_location_updated_at BEFORE UPDATE ON garment_location FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dept_inv_updated_at BEFORE UPDATE ON department_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh garment_location (to be called by triggers or scheduled job)
CREATE OR REPLACE FUNCTION refresh_garment_location(p_garment_id UUID)
RETURNS VOID AS $$
DECLARE
    v_garment RECORD;
    v_location_type VARCHAR(30);
    v_location_id UUID;
    v_location_name VARCHAR(255);
    v_branch_id UUID;
    v_branch_name VARCHAR(255);
    v_dept_id UUID;
    v_dept_name VARCHAR(255);
    v_plant_id UUID;
    v_plant_name VARCHAR(255);
    v_employee_id UUID;
    v_employee_name VARCHAR(255);
    v_locker VARCHAR(50);
    v_set_pos VARCHAR(1);
    v_status VARCHAR(30);
BEGIN
    SELECT g.*, 
           b.name as branch_name,
           d.name as dept_name,
           e.first_name || ' ' || e.last_name as emp_name,
           p.name as plant_name
    INTO v_garment
    FROM garment g
    LEFT JOIN branch b ON g.current_branch_id = b.id
    LEFT JOIN department d ON g.current_department_id = d.id
    LEFT JOIN employee e ON g.assigned_employee_id = e.id
    LEFT JOIN laundry_plant p ON g.current_location_id = p.id
    WHERE g.id = p_garment_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Determine location type based on status and context
    CASE v_garment.status
        WHEN 'IN_USE' THEN
            v_location_type := 'BRANCH';
            v_location_id := v_garment.current_branch_id;
            v_location_name := v_garment.branch_name;
            v_branch_id := v_garment.current_branch_id;
            v_branch_name := v_garment.branch_name;
            v_dept_id := v_garment.current_department_id;
            v_dept_name := v_garment.dept_name;
            v_employee_id := v_garment.assigned_employee_id;
            v_employee_name := v_garment.emp_name;
            v_set_pos := v_garment.set_position;
        WHEN 'IN_LOCKER' THEN
            v_location_type := 'LOCKER';
            v_location_id := v_garment.current_branch_id;
            v_location_name := v_garment.branch_name || ' - Locker ' || COALESCE(v_garment.locker_number, 'Unknown');
            v_branch_id := v_garment.current_branch_id;
            v_branch_name := v_garment.branch_name;
            v_dept_id := v_garment.current_department_id;
            v_dept_name := v_garment.dept_name;
            v_locker := v_garment.locker_number;
        WHEN 'IN_TRANSIT', 'RECEIVED_AT_PLANT', 'SORTING', 'WASHING', 'DRYING', 'QC_PENDING', 'QC_PASSED', 'QC_FAILED', 'REPAIRING', 'PACKED', 'DISPATCHED' THEN
            v_location_type := 'LAUNDRY_PLANT';
            v_location_id := v_garment.current_location_id;
            v_plant_id := v_garment.current_location_id;
            v_plant_name := v_garment.plant_name;
        WHEN 'DELIVERED' THEN
            v_location_type := 'BRANCH';
            v_location_id := v_garment.current_branch_id;
            v_location_name := v_garment.branch_name;
            v_branch_id := v_garment.current_branch_id;
            v_branch_name := v_garment.branch_name;
        WHEN 'MISSING', 'LOST' THEN
            v_location_type := 'MISSING';
        WHEN 'RETIRED', 'DISPOSED' THEN
            v_location_type := 'RETIRED';
        ELSE
            v_location_type := 'BRANCH';
            v_location_id := v_garment.current_branch_id;
            v_branch_id := v_garment.current_branch_id;
    END CASE;
    
    v_status := v_garment.status;
    
    INSERT INTO garment_location (
        garment_id, tenant_id, location_type, location_id, location_name,
        branch_id, branch_name, department_id, department_name,
        locker_number, plant_id, plant_name, employee_id, employee_name,
        set_position, status, updated_at
    ) VALUES (
        p_garment_id, v_garment.tenant_id, v_location_type, v_location_id, v_location_name,
        v_branch_id, v_branch_name, v_dept_id, v_dept_name,
        v_locker, v_plant_id, v_plant_name, v_employee_id, v_employee_name,
        v_set_pos, v_status, NOW()
    )
    ON CONFLICT (garment_id) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        location_type = EXCLUDED.location_type,
        location_id = EXCLUDED.location_id,
        location_name = EXCLUDED.location_name,
        branch_id = EXCLUDED.branch_id,
        branch_name = EXCLUDED.branch_name,
        department_id = EXCLUDED.department_id,
        department_name = EXCLUDED.department_name,
        locker_number = EXCLUDED.locker_number,
        plant_id = EXCLUDED.plant_id,
        plant_name = EXCLUDED.plant_name,
        employee_id = EXCLUDED.employee_id,
        employee_name = EXCLUDED.employee_name,
        set_position = EXCLUDED.set_position,
        status = EXCLUDED.status,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update garment_location on garment status change
CREATE OR REPLACE FUNCTION trigger_garment_location_update()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM refresh_garment_location(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS garment_location_sync ON garment;
CREATE TRIGGER garment_location_sync
    AFTER INSERT OR UPDATE ON garment
    FOR EACH ROW EXECUTE FUNCTION trigger_garment_location_update();