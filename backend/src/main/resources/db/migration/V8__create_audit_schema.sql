-- WhiteFox B2B Laundry Management - Audit & System Schema
-- V8__create_audit_schema.sql

-- Extended Audit Log with partitioning support
CREATE TABLE audit_log_extended (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE SET NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    entity_version INTEGER,
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'IMPORT', 
        'LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PASSWORD_CHANGE', 'MFA_CHANGE',
        'ROLE_CHANGE', 'PERMISSION_CHANGE', 'STATUS_CHANGE', 'BULK_OPERATION',
        'SCAN', 'TRANSFER', 'ROTATE', 'RECONCILE', 'APPROVE', 'REJECT'
    )),
    action_category VARCHAR(30) CHECK (action_category IN ('DATA', 'AUTH', 'ADMIN', 'OPERATION', 'RFID', 'LAUNDRY', 'BILLING', 'SYSTEM')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    field_level_changes JSONB DEFAULT '[]',
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    user_role VARCHAR(30),
    impersonated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    correlation_id UUID,
    causation_id UUID,
    request_id UUID,
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    response_status INTEGER,
    duration_ms INTEGER,
    tags TEXT[],
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    is_sensitive BOOLEAN DEFAULT FALSE,
    compliance_tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_ext_tenant ON audit_log_extended(tenant_id);
CREATE INDEX idx_audit_ext_entity ON audit_log_extended(entity_type, entity_id);
CREATE INDEX idx_audit_ext_user ON audit_log_extended(user_id);
CREATE INDEX idx_audit_ext_action ON audit_log_extended(action);
CREATE INDEX idx_audit_ext_correlation ON audit_log_extended(correlation_id);
CREATE INDEX idx_audit_ext_created ON audit_log_extended(created_at DESC);

-- Monthly partitions for audit_log_extended
CREATE TABLE audit_log_extended_2026_01 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_extended_2026_02 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_log_extended_2026_03 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_log_extended_2026_04 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_log_extended_2026_05 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_log_extended_2026_06 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_log_extended_2026_07 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_log_extended_2026_08 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_log_extended_2026_09 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_log_extended_2026_10 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_log_extended_2026_11 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_log_extended_2026_12 PARTITION OF audit_log_extended
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Default partition for future dates
CREATE TABLE audit_log_extended_default PARTITION OF audit_log_extended DEFAULT;

-- Function to create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_audit_partition(p_year INT, p_month INT)
RETURNS VOID AS $$
DECLARE
    v_start DATE;
    v_end DATE;
    v_table_name TEXT;
BEGIN
    v_start := make_date(p_year, p_month, 1);
    v_end := v_start + interval '1 month';
    v_table_name := format('audit_log_extended_%s_%s', p_year, lpad(p_month::text, 2, '0'));
    
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_log_extended FOR VALUES FROM (%L) TO (%L)',
        v_table_name, v_start, v_end
    );
END;
$$ LANGUAGE plpgsql;

-- API Key for external integrations
CREATE TABLE api_key (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_suffix VARCHAR(10) NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    allowed_ips INET[],
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED', 'EXPIRED')),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    usage_count BIGINT DEFAULT 0,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    revoked_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_key_tenant ON api_key(tenant_id);
CREATE INDEX idx_api_key_hash ON api_key(key_hash);
CREATE INDEX idx_api_key_prefix ON api_key(key_prefix);
CREATE INDEX idx_api_key_status ON api_key(status);

-- Webhook Subscription
CREATE TABLE webhook_subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    event_filter JSONB DEFAULT '{}',
    headers JSONB DEFAULT '{}',
    retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff_multiplier": 2, "initial_delay_ms": 1000}',
    timeout_ms INTEGER DEFAULT 10000,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PAUSED', 'FAILED', 'DISABLED')),
    consecutive_failures INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_failure_reason TEXT,
    total_deliveries BIGINT DEFAULT 0,
    successful_deliveries BIGINT DEFAULT 0,
    failed_deliveries BIGINT DEFAULT 0,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    disabled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    disabled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_tenant ON webhook_subscription(tenant_id);
CREATE INDEX idx_webhook_status ON webhook_subscription(status);
CREATE INDEX idx_webhook_events ON webhook_subscription USING GIN(events);

-- Webhook Delivery Log
CREATE TABLE webhook_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES webhook_subscription(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_headers JSONB,
    attempt INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    next_retry_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_webhook_delivery_sub ON webhook_delivery(subscription_id, started_at DESC);
CREATE INDEX idx_webhook_delivery_success ON webhook_delivery(success) WHERE success = FALSE;
CREATE INDEX idx_webhook_delivery_retry ON webhook_delivery(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- System Configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    config_type VARCHAR(30) CHECK (config_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ENCRYPTED')),
    description TEXT,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    validation_schema JSONB,
    default_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL
);

CREATE INDEX idx_sys_config_category ON system_config(category);
CREATE INDEX idx_sys_config_public ON system_config(is_public) WHERE is_public = TRUE;

-- Insert default system configs
INSERT INTO system_config (config_key, config_value, config_type, description, category, is_public) VALUES
('platform.name', '"WhiteFox B2B Laundry Management"', 'STRING', 'Platform display name', 'platform', TRUE),
('platform.version', '"1.0.0"', 'STRING', 'Platform version', 'platform', TRUE),
('rfid.deduplication_window_ms', '5000', 'NUMBER', 'RFID deduplication time window in milliseconds', 'rfid', FALSE),
('rfid.enrichment_timeout_ms', '2000', 'NUMBER', 'RFID enrichment timeout in milliseconds', 'rfid', FALSE),
('laundry.default_sla_hours', '24', 'NUMBER', 'Default SLA in hours', 'laundry', FALSE),
('laundry.qc_sample_rate', '0.1', 'NUMBER', 'Default QC sample rate (0-1)', 'laundry', FALSE),
('laundry.default_wash_program', '"STANDARD_COTTON"', 'STRING', 'Default wash program code', 'laundry', FALSE),
('inventory.sync_interval_minutes', '5', 'NUMBER', 'Inventory sync interval in minutes', 'inventory', FALSE),
('reconciliation.auto_run_enabled', 'true', 'BOOLEAN', 'Enable automatic reconciliation runs', 'reconciliation', FALSE),
('reconciliation.alert_threshold_missing', '1', 'NUMBER', 'Missing garment count threshold for alerts', 'reconciliation', FALSE),
('billing.default_currency', '"INR"', 'STRING', 'Default currency', 'billing', FALSE),
('billing.default_tax_rate', '18.00', 'NUMBER', 'Default tax rate (GST)', 'billing', FALSE),
('notification.email_enabled', 'true', 'BOOLEAN', 'Enable email notifications', 'notification', FALSE),
('notification.sms_enabled', 'false', 'BOOLEAN', 'Enable SMS notifications', 'notification', FALSE),
('notification.push_enabled', 'true', 'BOOLEAN', 'Enable push notifications', 'notification', FALSE),
('security.password_min_length', '8', 'NUMBER', 'Minimum password length', 'security', FALSE),
('security.password_require_special', 'true', 'BOOLEAN', 'Require special characters in password', 'security', FALSE),
('security.session_timeout_minutes', '480', 'NUMBER', 'Session timeout in minutes', 'security', FALSE),
('security.max_login_attempts', '5', 'NUMBER', 'Max failed login attempts before lockout', 'security', FALSE),
('3set.default_sets_per_employee', '3', 'NUMBER', 'Default number of sets per employee', '3set', FALSE),
('3set.rotation_notice_hours', '2', 'NUMBER', 'Notice period before scheduled rotation', '3set', FALSE)
ON CONFLICT (config_key) DO NOTHING;

-- Feature Flags
CREATE TABLE feature_flag (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    target_tenants UUID[],
    target_roles TEXT[],
    target_users UUID[],
    conditions JSONB DEFAULT '{}',
    variants JSONB DEFAULT '[]',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ff_enabled ON feature_flag(enabled) WHERE enabled = TRUE;

-- Insert default feature flags
INSERT INTO feature_flag (flag_key, name, description, enabled, rollout_percentage) VALUES
('rfid_real_time_tracking', 'Real-time RFID Tracking', 'Enable real-time garment tracking via RFID', TRUE, 100),
('three_set_model', '3-Set Model', 'Enable 3-set rotation model for employees', TRUE, 100),
('ai_demand_forecast', 'AI Demand Forecast', 'Enable AI-powered demand forecasting', FALSE, 0),
('ai_replacement_prediction', 'AI Replacement Prediction', 'Enable AI-powered garment replacement prediction', FALSE, 0),
('ai_sla_risk', 'AI SLA Risk Prediction', 'Enable AI-powered SLA risk prediction', FALSE, 0),
('mobile_app_offline', 'Mobile App Offline Mode', 'Enable offline-first mode for mobile app', TRUE, 100),
('advanced_analytics', 'Advanced Analytics Dashboard', 'Enable advanced analytics and reporting', TRUE, 50),
('erp_integration', 'ERP Integration', 'Enable ERP system integration', FALSE, 0),
('hrms_integration', 'HRMS Integration', 'Enable HRMS integration for employee sync', FALSE, 0),
('multi_plant_routing', 'Multi-Plant Routing', 'Enable intelligent routing across multiple plants', FALSE, 0)
ON CONFLICT (flag_key) DO NOTHING;

-- Notification Template
CREATE TABLE notification_template (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    template_key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK')),
    subject_template VARCHAR(500),
    body_template TEXT NOT NULL,
    html_template TEXT,
    variables JSONB DEFAULT '[]',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, template_key, channel, language)
);

CREATE INDEX idx_notif_template_tenant ON notification_template(tenant_id);
CREATE INDEX idx_notif_template_key ON notification_template(template_key);

-- Notification Queue
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_template(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WEBHOOK')),
    recipient_type VARCHAR(30) CHECK (recipient_type IN ('USER', 'ROLE', 'TENANT_ADMIN', 'PLANT_MANAGER', 'DRIVER', 'EMPLOYEE', 'EXTERNAL')),
    recipient_id UUID,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(30),
    subject VARCHAR(500),
    body TEXT NOT NULL,
    html_body TEXT,
    variables JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    external_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_queue_tenant ON notification_queue(tenant_id);
CREATE INDEX idx_notif_queue_status ON notification_queue(status);
CREATE INDEX idx_notif_queue_scheduled ON notification_queue(scheduled_at) WHERE status IN ('PENDING', 'QUEUED');
CREATE INDEX idx_notif_queue_recipient ON notification_queue(recipient_type, recipient_id);

-- Scheduled Job
CREATE TABLE scheduled_job (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    cron_expression VARCHAR(100),
    job_class VARCHAR(255),
    job_data JSONB DEFAULT '{}',
    enabled BOOLEAN DEFAULT TRUE,
    singleton BOOLEAN DEFAULT TRUE,
    timeout_seconds INTEGER DEFAULT 300,
    retry_policy JSONB DEFAULT '{"max_retries": 2, "delay_minutes": 5}',
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(30) CHECK (last_run_status IN ('SUCCESS', 'FAILED', 'TIMEOUT', 'SKIPPED')),
    last_run_duration_ms INTEGER,
    last_run_error TEXT,
    next_run_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    max_consecutive_failures INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sched_job_enabled ON scheduled_job(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_sched_job_next_run ON scheduled_job(next_run_at) WHERE enabled = TRUE;

-- Job Execution Log
CREATE TABLE job_execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES scheduled_job(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    status VARCHAR(30) NOT NULL CHECK (status IN ('STARTED', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED')),
    output TEXT,
    error_message TEXT,
    stack_trace TEXT,
    metrics JSONB DEFAULT '{}',
    triggered_by VARCHAR(30) CHECK (triggered_by IN ('SCHEDULE', 'MANUAL', 'EVENT', 'RETRY')),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_job_log_job ON job_execution_log(job_id, started_at DESC);
CREATE INDEX idx_job_log_status ON job_execution_log(status);

-- Insert default scheduled jobs
INSERT INTO scheduled_job (job_key, name, description, cron_expression, job_class, enabled) VALUES
('inventory.sync', 'Inventory Sync', 'Sync garment locations and update materialized views', '0 */5 * * * *', 'com.whitefox.inventory.job.InventorySyncJob', TRUE),
('reconciliation.auto_run', 'Auto Reconciliation', 'Run automatic reconciliation for all tenants', '0 0 * * * *', 'com.whitefox.reconciliation.job.AutoReconciliationJob', TRUE),
('billing.generate_invoices', 'Generate Invoices', 'Generate monthly invoices for all tenants', '0 0 1 * *', 'com.whitefox.billing.job.InvoiceGenerationJob', TRUE),
('utilization.calculate', 'Calculate Utilization', 'Calculate garment and employee utilization metrics', '0 0 * * *', 'com.whitefox.analytics.job.UtilizationCalculationJob', TRUE),
('sla.check_risk', 'SLA Risk Check', 'Check and update SLA risk scores', '0 */15 * * * *', 'com.whitefox.analytics.job.SlaRiskCheckJob', TRUE),
('audit.cleanup', 'Audit Log Cleanup', 'Archive old audit logs', '0 0 2 * * *', 'com.whitefox.audit.job.AuditCleanupJob', TRUE),
('partition.maintenance', 'Partition Maintenance', 'Create new monthly partitions for audit tables', '0 0 1 * *', 'com.whitefox.audit.job.PartitionMaintenanceJob', TRUE)
ON CONFLICT (job_key) DO NOTHING;

-- Updated at triggers
CREATE TRIGGER update_api_key_updated_at BEFORE UPDATE ON api_key FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_sub_updated_at BEFORE UPDATE ON webhook_subscription FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sys_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flag_updated_at BEFORE UPDATE ON feature_flag FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notif_template_updated_at BEFORE UPDATE ON notification_template FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notif_queue_updated_at BEFORE UPDATE ON notification_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sched_job_updated_at BEFORE UPDATE ON scheduled_job FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();