-- Inflnara Platform Database Initialization Script
-- This script sets up the initial database structure and sample data

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('INFLUENCER', 'ADVERTISER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE campaign_status AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE settlement_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE performance_type AS ENUM ('CLICK', 'CONVERSION', 'SALE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create backup_log table for backup tracking
CREATE TABLE IF NOT EXISTS backup_log (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL,
    backup_file VARCHAR(255) NOT NULL,
    backup_size_mb DECIMAL(10,2),
    backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Create indexes for backup_log
CREATE INDEX IF NOT EXISTS idx_backup_log_time ON backup_log(backup_time);
CREATE INDEX IF NOT EXISTS idx_backup_log_status ON backup_log(status);
CREATE INDEX IF NOT EXISTS idx_backup_log_type ON backup_log(backup_type);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('default_influencer_commission_rate', '70', 'number', 'Default commission rate for influencers (%)'),
('default_platform_commission_rate', '30', 'number', 'Default commission rate for platform (%)'),
('min_settlement_amount', '10000', 'number', 'Minimum amount for settlement (KRW)'),
('max_campaign_duration_days', '365', 'number', 'Maximum campaign duration in days'),
('min_campaign_budget', '100000', 'number', 'Minimum campaign budget (KRW)'),
('max_campaign_budget', '100000000', 'number', 'Maximum campaign budget (KRW)'),
('performance_tracking_enabled', 'true', 'boolean', 'Enable performance tracking'),
('click_tracking_enabled', 'true', 'boolean', 'Enable click tracking'),
('conversion_tracking_enabled', 'true', 'boolean', 'Enable conversion tracking'),
('auto_settlement_enabled', 'true', 'boolean', 'Enable automatic settlement'),
('settlement_schedule_cron', '0 9 * * 1', 'string', 'Cron schedule for settlements'),
('performance_sync_cron', '0 */6 * * *', 'string', 'Cron schedule for performance sync'),
('backup_schedule_cron', '0 2 * * *', 'string', 'Cron schedule for backups'),
('cleanup_schedule_cron', '0 3 * * 0', 'string', 'Cron schedule for cleanup tasks')
ON CONFLICT (setting_key) DO NOTHING;

-- Create audit_log table for system auditing
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Create system_health table for health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    last_check_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for system_health
CREATE INDEX IF NOT EXISTS idx_system_health_service ON system_health(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_last_check ON system_health(last_check_at);

-- Create performance_metrics table for system metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tags ON performance_metrics USING GIN(tags);

-- Create notification_queue table for async notifications
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL,
    recipient_id INTEGER,
    recipient_email VARCHAR(255),
    recipient_slack_channel VARCHAR(100),
    subject VARCHAR(255),
    message TEXT,
    template_data JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notification_queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_id);

-- Create cache_invalidation table for cache management
CREATE TABLE IF NOT EXISTS cache_invalidation (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL,
    cache_pattern VARCHAR(255),
    invalidation_reason VARCHAR(100),
    invalidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create indexes for cache_invalidation
CREATE INDEX IF NOT EXISTS idx_cache_invalidation_key ON cache_invalidation(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_invalidation_pattern ON cache_invalidation(cache_pattern);
CREATE INDEX IF NOT EXISTS idx_cache_invalidation_processed ON cache_invalidation(processed_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
        VALUES (current_setting('app.current_user_id', true)::integer, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (current_setting('app.current_user_id', true)::integer, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
        VALUES (current_setting('app.current_user_id', true)::integer, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create function to clean old audit logs
CREATE OR REPLACE FUNCTION clean_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_log WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Create function to clean old performance metrics
CREATE OR REPLACE FUNCTION clean_old_performance_metrics()
RETURNS void AS $$
BEGIN
    DELETE FROM performance_metrics WHERE recorded_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Create function to clean old system health records
CREATE OR REPLACE FUNCTION clean_old_system_health()
RETURNS void AS $$
BEGIN
    DELETE FROM system_health WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
END;
$$ language 'plpgsql';

-- Create function to get system statistics
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS TABLE (
    total_users INTEGER,
    total_campaigns INTEGER,
    total_settlements INTEGER,
    total_revenue DECIMAL(15,2),
    active_campaigns INTEGER,
    pending_settlements INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM campaigns) as total_campaigns,
        (SELECT COUNT(*) FROM settlements) as total_settlements,
        (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE status = 'COMPLETED') as total_revenue,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'ACTIVE') as active_campaigns,
        (SELECT COUNT(*) FROM settlements WHERE status = 'PENDING') as pending_settlements;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create a view for backup statistics
CREATE OR REPLACE VIEW backup_stats AS
SELECT 
    DATE_TRUNC('day', backup_time) as backup_date,
    backup_type,
    COUNT(*) as backup_count,
    AVG(backup_size_mb) as avg_size_mb,
    MAX(backup_size_mb) as max_size_mb,
    MIN(backup_size_mb) as min_size_mb,
    AVG(duration_seconds) as avg_duration_seconds
FROM backup_log
GROUP BY DATE_TRUNC('day', backup_time), backup_type
ORDER BY backup_date DESC, backup_type;

-- Create a view for system health summary
CREATE OR REPLACE VIEW system_health_summary AS
SELECT 
    service_name,
    status,
    COUNT(*) as check_count,
    AVG(response_time_ms) as avg_response_time_ms,
    MAX(last_check_at) as last_check_at
FROM system_health
WHERE last_check_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY service_name, status
ORDER BY service_name, status;

-- Log initialization completion
INSERT INTO audit_log (action, table_name, new_values)
VALUES ('DATABASE_INIT', 'system', '{"version": "1.0.0", "initialized_at": "' || CURRENT_TIMESTAMP || '"}');

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Inflnara database initialization completed successfully at %', CURRENT_TIMESTAMP;
END $$; 